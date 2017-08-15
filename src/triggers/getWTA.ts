import { messages } from "elasticio-node";
import { isUndefined } from "lodash";
import Axios from "axios";
import * as Papa from "papaparse";
import { sleep, StatusResultError, StatusResult, TokenResult } from "../utils";

exports.process = getWTA;

export interface GetWTAConfig {
    host: string;
    username: string;
    password: string;
    startdate: string;
    enddate: string;
}

export interface WorkingTime {
    location_id: number;
    location_name: string;
    pnr_id: number;
    pnr: string;
    First_name: string;
    Last_name: string;
    Master_project_ID: number;
    calendar_date: string;
    target_time: number;
    actual_time: number;
    planned_time: number;
}

export interface WorkingTimeCSVEntry {
    location_id: number;
    location_name: string;
    pnr_id: number;
    pnr: string;
    First_name: string;
    Last_name: string;
    Master_project_ID: number;
    calendar_date: string;
    Wage_type_number: number;
    Export_name: string;
    Time_account_relevant: boolean;
    Minutes: number;
    Minutes_time_account_relevant: number; // Not relevant
    Minutes_time_account_non_relevant: number; // Not relevant
}


/**
 * getWTA returns the working time accounts of all employees between some start and end date.
 * The function returns a Promise sending a request and resolving the response as platform message.
 *
 * @param msg incoming messages which is empty for triggers
 * @param cfg object to retrieve triggers configuration values
 * @param snapshot the scratchpad for persitence between execution runs
 * 
 * @returns promise resolving a message to be emitted to the platform
 */
export async function getWTA(msg: elasticionode.Message, cfg: GetWTAConfig, snapshot: any) {
    console.log("Msg content:");
    console.log(msg);
    console.log("Cfg content:");
    console.log(cfg);
    console.log("snapshot content:");
    console.log(snapshot);

    // Generate the config for https request
    if (isUndefined(cfg)) {
        throw new Error("cfg is undefined");
    }
    if (isUndefined(cfg.startdate)) {
        // TODO: implement a better logic by using a special config value
        cfg.startdate = "20170601";
    }
    if (isUndefined(cfg.enddate)) {
        // TODO: implement a better logic by using a special config value
        cfg.enddate = "20170614";
    }
    cfg.host = cfg.host.trim();
    cfg.username = cfg.username.trim();
    cfg.password = cfg.password.trim();

    let axios = Axios.create({
        baseURL: "https://" + cfg.host,
        auth: {
            username: cfg.username,
            password: cfg.password
        },
        // We want to handle the 404 status
        validateStatus: function (status) {
            if (status === 404) {
                return true;
            }
            return status >= 200 && status < 300; // default
        },
    });

    // Request data
    let query = "/api/export/select/WorkingTimeAccounts/v1?startDate=" + cfg.startdate + "&endDate=" + cfg.enddate;
    console.log("Starting query:");
    console.log(query);
    let response = await axios.get("" + query, { responseType: "json" });
    let result = <TokenResult>response.data;
    if (isUndefined(result.StatusToken)) {
        throw new Error("StatusToken for WorkingTimeAccounts selection is empty");
    }
    let statusToken = result.StatusToken;
    console.log("Recieved status token: " + statusToken);

    // Download data
    var data: string;
    while (true) {
        query = "/api/export/download/" + statusToken;
        console.log("Starting download:");
        console.log(query);
        let response = await axios.get(query);
        console.log("Response code: " + response.status);
        if (response.status === 200) {
            data = response.data;
            break;
        } else if (response.status === 202) {
            await sleep(500);
        } else if (response.status === 404) {
            let status = <StatusResult>response.data;
            console.error("Error Message from StatusResult: " + status.Message);
            throw new StatusResultError("Unexpected status Result while downloading the data: " + status.Status);
        }
    }

    // Parse Data
    let lines = await parseCSV(data);
    readAndEmitLines(this, lines);
}

function parseCSV(csvString: string): Promise<PapaParse.ParseResult> {
    return new Promise<PapaParse.ParseResult>(function (resolve, reject) {
        let options = {
            headers: true,
            complete: resolve,
            error: reject
        } as PapaParse.ParseConfig;
        Papa.parse(csvString, options);
    });
}

function readAndEmitLines(callContext: any, lines: PapaParse.ParseResult) {
    validateHeader(lines.data[0]);

    // Generate the temporary maps (key: "calendar_date-pnr_id")
    let timeMap: Map<string, WorkingTime> = new Map<string, WorkingTime>();

    // Read the the line entries and fill the map
    lines.data.slice(1).forEach((element: string[]) => {
        if (element[0] !== "") {
            let entry = parseLine(element);
            let key = entry.calendar_date + "+" + entry.pnr_id;
            let t = timeMap.get(key) as WorkingTime;
            // New entry, fill it with the base data
            if (t === undefined) {
                t = {} as WorkingTime;
                t.location_id = entry.location_id;
                t.location_name = entry.location_name;
                t.pnr_id = entry.pnr_id;
                t.pnr = entry.pnr;
                t.First_name = entry.First_name;
                t.Last_name = entry.Last_name;
                t.Master_project_ID = entry.Master_project_ID;
                t.calendar_date = entry.calendar_date;
                t.actual_time = 0;
                t.planned_time = 0;
                t.target_time = 0;
            }
            // Check what time type we need to set
            let change = false;
            if (entry.Wage_type_number === 8000) {
                // target time
                t.target_time = Math.abs(entry.Minutes);
                change = true;
            } else if (entry.Wage_type_number === 8293) {
                // planned time
                t.planned_time = entry.Minutes;
                change = true;
            } else if (entry.Time_account_relevant === true) {
                // other relevant actual times
                t.actual_time += entry.Minutes;
                change = true;
            }

            // Ignore uneventful days
            if (change) {
                timeMap.set(key, t);
            }
        }
    });

    console.log("Number of entries found: " + timeMap.size);

    // Emit every line as seperate message
    timeMap.forEach(element => {
        callContext.emit('data', messages.newMessageWithBody(element));
    });
}

function validateHeader(header: string[]) {
    // We need to trim because of the BOM...
    let columns = ["location_id", "location_name", "pnr_id", "pnr", "First_name", "Last_name",
        "Master_project_ID", "calendar_date", "Wage_type_number", "Export_name", "Time_account_relevant",
        "Minutes", "Minutes_time_account_relevant", "Minutes_time_account_non_relevant"];
    for (var i = 0; i < columns.length; i++) {
        if (header[i].trim() !== columns[i]) {
            throw new Error(columns[i] + " was not found. Found: " + header[0].trim());
        }
    }
}

function parseLine(line: string[]): WorkingTimeCSVEntry {
    let entry: WorkingTimeCSVEntry = {
        location_id: Number.parseInt(line[0]),
        location_name: line[1],
        pnr_id: Number.parseInt(line[2]),
        pnr: line[3],
        First_name: line[4],
        Last_name: line[5],
        Master_project_ID: Number.parseInt(line[6]),
        calendar_date: parseDate(line[7]),
        Wage_type_number: Number.parseInt(line[8]),
        Export_name: line[9],
        Time_account_relevant: parseBoolean(line[10]),
        Minutes: Number.parseInt(line[11]),
        Minutes_time_account_relevant: Number.parseInt(line[12]),
        Minutes_time_account_non_relevant: Number.parseInt(line[13]),
    };
    return entry;
}

function parseDate(s: string): string {
    let datestring = s.split(" ")[0].split(".");
    return datestring[2] + "-" + datestring[1] + "-" + datestring[0];
}

function parseBoolean(s: string): boolean {
    if (s.toLowerCase() === "true") {
        return true;
    } else if (s.toLowerCase() === "false") {
        return false;
    }
    throw new Error("Unkown boolean value when parsing string: " + s);
}