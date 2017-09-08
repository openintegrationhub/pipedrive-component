import { isUndefined } from "lodash";

import { Note } from "../models/note";
import { ComponentConfig } from "../models/componentConfig";
import { PipedriveMessage } from "../models/pipedriveMessage";

import { APIClient } from "../apiclient";

exports.process = createNote;

/**
 * createPerson creates a new person. It will also create a contact person,
 * an organisation and a note.
 *
 * @param msg incoming messages which is empty for triggers
 * @param cfg object to retrieve triggers configuration values
 * @param snapshot the scratchpad for persitence between execution runs
 *
 * @returns promise resolving a message to be emitted to the platform
 */
export async function createNote(msg: elasticionode.Message, cfg: ComponentConfig, snapshot: any): Promise<PipedriveMessage> {

    console.log("Msg content:");
    console.log(msg);
    console.log("Cfg content:");
    console.log(cfg);
    console.log("snapshot content:");
    console.log(snapshot);

    // Get the input data
    let data = <PipedriveMessage>msg.body;

    if (data.note_id) {
        console.log("Note_id " + data.note_id + " already exists");
        return data;
    }
    // Generate the config for https request
    if (isUndefined(cfg)) {
        throw new Error("cfg is undefined");
    }
    if (isUndefined(cfg.token)) {
        throw new Error("API token is undefined");
    }
    if (isUndefined(cfg.company_domain)) {
        throw new Error("Company domain is undefined");
    }

    // Client init
    cfg.token = cfg.token.trim();
    cfg.company_domain = cfg.company_domain.trim();
    let client = new APIClient(cfg.company_domain, cfg.token);

    // Create Note
    let noteMessage = "";
    // Check for optional config parameters
    // if cfg.deal_note is defined and not empty, append
    if (cfg.deal_note && cfg.deal_note !== "") {
        noteMessage += cfg.deal_note;
        // if a special message is available also append " : "
        if (data.note_content && data.note_content !== "") {
            noteMessage += " : ";
        }
    }
    // if a special message is available also append it
    if (data.note_content && data.note_content !== "") {
        noteMessage += data.note_content;
    }
    // Form note object to be inserted.
    let note = {
        org_id: data.org_id,
        person_id: data.person_id,
        deal_id: data.deal_id,
        content: noteMessage,
    } as Note;
    console.log("Creating note: " + JSON.stringify(note));
    note = await client.createNote(note);
    console.log("Created note for deal_id : " + JSON.stringify(note));
    // assign returned id to org_id
    let ret = <PipedriveMessage>data;
    ret.note_id = note.id;
    // Return message
    return ret;
}