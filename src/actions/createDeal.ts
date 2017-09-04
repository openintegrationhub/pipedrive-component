import { isUndefined } from "lodash";

import { Deal } from "../models/deal";
import { Status, Done } from "../models/enums";
import { Note } from "../models/note";
import { Organization } from "../models/organization";
import { Person } from "../models/person";
import { Activity } from "../models/activity";

import { APIClient } from "../apiclient";

exports.process = createDeal;

export interface CreateDealConfig {
    token: string;
    company_domain: string;
    deal_note: string;
}

// owner_id is optional, when not specified authenticated user is set as owner
// from https://developers.pipedrive.com/docs/api/v1
export interface CreateDealInMessage {
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    role: string;
    company: string;
    company_size: string;
    message: string;
    owner_id: number;
}

export interface CreateDealOutMessage {
    deal_id: number;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    role: string;
    company: string;
    company_size: string;
    message: string;
    owner_id: number;
}

/**
 * createDeal creates a new deal. It will also create a contact person,
 * an organisation and a note.
 *
 * @param msg incoming messages which is empty for triggers
 * @param cfg object to retrieve triggers configuration values
 * @param snapshot the scratchpad for persitence between execution runs
 *
 * @returns promise resolving a message to be emitted to the platform
 */
export async function createDeal(msg: elasticionode.Message, cfg: CreateDealConfig, snapshot: any): Promise<CreateDealOutMessage> {
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
    if (isUndefined(cfg.deal_note)) {
        throw new Error("Deal note is undefined");
    }

    // Client init
    cfg.token = cfg.token.trim();
    cfg.company_domain = cfg.company_domain.trim();
    let client = new APIClient(cfg.company_domain, cfg.token);

    // Get the input data
    let data = <CreateDealInMessage>msg.body;

    // Create Organization
    let organization = {
        name: data.company,
    } as Organization;
    // If owner_id is defined add it
    if (data.owner_id) {
        organization['owner_id'] = data.owner_id;
    }
    console.log("Creating organization: " + JSON.stringify(organization));
    organization = await client.createOrganization(organization);
    console.log("Created organization: " + JSON.stringify(organization));

    // Create Person
    let person = {
        name: data.contact_name,
        email: new Array<string>(data.contact_email),
        phone: new Array<string>(data.contact_phone),
        org_id: organization.id,
    } as Person;
    // If owner_id is defined add it
    if (data.owner_id) {
        person['owner_id'] = data.owner_id;
    }
    console.log("Creating person: " + JSON.stringify(person));
    person = await client.createPerson(person);
    console.log("Created person: " + JSON.stringify(person));

    // Create Deal
    console.log("Creating deal: ");
    let deal = {
        title: "Website: " + data.company,
        person_id: person.id,
        org_id: organization.id,
        status: Status.Open,
    } as Deal;
    deal = await client.createDeal(deal);
    console.log("Created deal: " + deal.title);

    // Create Note
    console.log("Creating note: ");
    let note = {
        deal_id: deal.id,
        content: cfg.deal_note,
    } as Note;
    note = await client.createNote(note);
    console.log("Created note for deal_id : " + note.deal_id);

    // Create follow-up task activity
    console.log("Creating activity: ");
    let activity = {
        done: Done.NotDone,
        type: 'task',
        deal_id: deal.id,
        person_id: person.id,
        subject: deal.title,
        org_id: organization.id,
        user_id: 0,
    } as Activity;
    // TODO: Owner and user may be seperate people.
    // If owner_id is defined add it
    if (data.owner_id) {
        activity.user_id = data.owner_id;
    }
    activity = await client.createActivity(activity);
    console.log("Created activity for deal_id : " + activity.deal_id);

    // Return message
    let ret = <CreateDealOutMessage>data;
    ret.deal_id = deal.id;
    return ret;
}
