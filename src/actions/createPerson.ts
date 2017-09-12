import { isUndefined, isFinite, toNumber } from "lodash";

import { Visibility } from "../models/enums";
import { Person } from "../models/person";
import { ComponentConfig } from "../models/componentConfig";
import { PersonIn } from "../models/personIn";

import { APIClient } from "../apiclient";

exports.process = createPerson;

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
export async function createPerson(msg: elasticionode.Message, cfg: ComponentConfig, snapshot: any): Promise<Person> {

    console.log("Msg content:");
    console.log(msg);
    console.log("Cfg content:");
    console.log(cfg);
    console.log("snapshot content:");
    console.log(snapshot);

    // Get the input data
    let data = <PersonIn>msg.body;

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

    let ownerId = toNumber(cfg.owner_id);
    let ownerIdFlag = isFinite(ownerId);

    // Create Organization, private by default
    let person = {
        person_name: data.person_name,
        person_email: data.person_email,
        person_phone: data.person_phone,
        org_id: data.org_id,
        add_time: data.add_time,
    } as Person;
    // Check availability of other owner_id definitions
    if (data.owner_id) {
        person.owner_id = data.owner_id;
    } else if (ownerIdFlag) {
        person.owner_id = ownerId;
    }
    // Set visibility enum, API allows it to be omitted
    switch (data.visible_to) {
        case 1:
            person.visible_to = Visibility.OwnerAndFollowers;
            break;
        case 2:
            person.visible_to = Visibility.EntireCompany;
            break;
    }
    console.log("Creating person: " + JSON.stringify(person));
    person = await client.createPerson(person);
    console.log("Created person: " + JSON.stringify(person));
    // assign returned id to org_id
    let ret = <Person>data;
    ret.person_id = person.person_id;
    // Return message
    return ret;
}