import { isUndefined, isFinite, toNumber } from "lodash";

import { Done } from "../models/enums";
import { Activity } from "../models/activity";
import { ComponentConfig } from "../models/componentConfig";
import { PipedriveMessage } from '../models/pipedriveMessage';

import { APIClient } from "../apiclient";

exports.process = createActivity;

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
export async function createActivity(msg: elasticionode.Message, cfg: ComponentConfig, snapshot: any): Promise<PipedriveMessage> {
    console.log("Msg content:");
    console.log(msg);
    console.log("Cfg content:");
    console.log(cfg);
    console.log("snapshot content:");
    console.log(snapshot);

    // Get the input data
    let data = <PipedriveMessage>msg.body;

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

    // Create activity TODO REMOVE hardcoded
    let activity = {
        done: Done.NotDone,
        type: data.activity_type,
        person_id: data.person_id,
        subject: data.activity_subject,
        org_id: data.org_id,
    } as Activity;
    // Sets a user to be the owner of the task. Empty defaults to API key owner.
    // First checks for input id, then config owner_id
    if (data.user_id) {
        activity.user_id = data.user_id;
    } else if (ownerIdFlag) {
        activity.user_id = ownerId;
    }
    console.log("Creating activity: " + JSON.stringify(activity));
    activity = await client.createActivity(activity);
    console.log("Created activity for deal_id : " + JSON.stringify(activity));

    // Return message
    let ret = <PipedriveMessage>data;
    ret.activity_id = activity.id;
    return ret;
}
