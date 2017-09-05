import { isUndefined, isFinite, toNumber } from "lodash";


import { Done } from "../models/enums";
import { Note } from "../models/note";
import { Organization } from "../models/organization";
import { Person } from "../models/person";
import { Activity } from "../models/activity";
import { ComponentConfig } from "../models/componentConfig";

import { APIClient } from "../apiclient";

exports.process = createActivity;



// owner_id is optional, when not specified authenticated user is set as owner
// from https://developers.pipedrive.com/docs/api/v1
export interface CreateActivityInMessage {
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    role: string;
    company: string;
    company_size: string;
    message: string;
    owner_id: number;
    org_id: number;
    person_id: number;
    user_id: number;
}

export interface CreateActivityOutMessage {
    deal_id: number;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    role: string;
    company: string;
    company_size: string;
    message: string;
    owner_id: number;
    org_id: number;
    person_id: number;
    user_id: number;
}

// TODO this entire function is code duplication, it can be safely embedded into the createDeal() function.

/**
 * createActivity creates a new activity(task). It will also create a contact person,
 * an organisation and a note.
 *
 * @param msg incoming messages which is empty for triggers
 * @param cfg object to retrieve triggers configuration values
 * @param snapshot the scratchpad for persitence between execution runs
 *
 * @returns promise resolving a message to be emitted to the platform
 */
export async function createActivity(msg: elasticionode.Message, cfg: ComponentConfig, snapshot: any): Promise<CreateActivityOutMessage> {
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

    // Get the input data
    let data = <CreateActivityInMessage>msg.body;

    let ownerId = toNumber(cfg.owner_id);
    let ownerIdFlag = isFinite(ownerId);

    // If an org_id is not supplied create an organization
    if (isUndefined(data.org_id)) {
        // Create Organization
        let organization = {
            name: data.company,
        } as Organization;
        // Check availability of possible owner_id definitions
        if (data.owner_id) {
            organization.owner_id = data.owner_id;
        } else if (ownerIdFlag) {
            organization.owner_id = ownerId;
        }
        console.log("Creating organization: " + JSON.stringify(organization));
        organization = await client.createOrganization(organization);
        console.log("Created organization: " + JSON.stringify(organization));
        // assign returned id to org_id
        data.org_id = organization.id;
    } else {
        console.log("Using org_id: " + data.org_id);
    }

    // If an person_id is not supplied create a person
    if (isUndefined(data.person_id)) {
        // Create Person
        let person = {
            name: data.contact_name,
            email: new Array<string>(data.contact_email),
            phone: new Array<string>(data.contact_phone),
            org_id: data.org_id,
        } as Person;
        // Check availability of possible owner_id definitions
        if (data.owner_id) {
            person.owner_id = data.owner_id;
        } else if (ownerIdFlag) {
            person.owner_id = ownerId;
        }
        console.log("Creating person: " + JSON.stringify(person));
        person = await client.createPerson(person);
        console.log("Created person: " + JSON.stringify(person));
        // assign returned id to person_id
        data.person_id = person.id;
    } else {
        console.log("Using person_id: " + data.person_id);
    }

    // Create Note
    let noteMessage = "";
    // Check for optional config parameters
    // if cfg.deal_note is defined and not empty, append
    if (cfg.deal_note && cfg.deal_note !== "") {
        noteMessage += cfg.deal_note;
        // if a special message is available also append " : "
        if (data.message && data.message !== "") {
            noteMessage += " : ";
        }
    }
    // if a special message is available also append it
    if (data.message && data.message !== "") {
        noteMessage += data.message;
    }
    // Form note object to be inserted.
    let note = {
        person_id: data.person_id,
        org_id: data.org_id,
        content: noteMessage,
    } as Note;
    console.log("Creating note: " + JSON.stringify(note));
    note = await client.createNote(note);
    console.log("Created note for deal_id : " + JSON.stringify(note));

    // Create follow-up task activity
    let activity = {
        done: Done.NotDone,
        type: 'task',
        person_id: data.person_id,
        subject: "File Download follow-up", // TODO
        org_id: data.org_id,
    } as Activity;
    // Sets a user to be the owner of the task. Empty defaults to API key owner.
    // First checks for user_id, then for input owner_id, then config owner_id
    if (data.user_id) {
        activity.user_id = data.user_id;
    } else if (data.owner_id) {
        activity.user_id = data.owner_id;
    } else if (ownerIdFlag) {
        activity.user_id = ownerId;
    }
    console.log("Creating activity: " + JSON.stringify(activity));
    activity = await client.createActivity(activity);
    console.log("Created activity for deal_id : " + JSON.stringify(activity));

    // Return message
    let ret = <CreateActivityOutMessage>data;
    ret.deal_id = activity.id;
    return ret;
}
