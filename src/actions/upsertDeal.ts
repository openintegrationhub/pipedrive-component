// import { isUndefined } from "lodash";

// //import { Visibility } from "../models/enums";
// import { Organization } from "../models/organization";
// import { ComponentConfig } from "../models/componentConfig";
// import { PipedriveMessage } from "../models/pipedriveMessage";

// import { APIClient } from "../apiclient";

// exports.process = upsertOrganization;

// /**
//  * createOrganisation creates a new org.
//  *
//  * @param data incoming messages which is empty for triggers
//  * @param cfg object to retrieve triggers configuration values
//  * @param snapshot the scratchpad for persitence between execution runs
//  *
//  * @returns promise resolving a message to be emitted to the platform
//  */

// export async function upsertOrganization(
//   msg: any,
//   cfg: ComponentConfig,
//   snapshot: any
// ): Promise<PipedriveMessage> {
//   console.log("Msg content:");
//   console.log(msg);
//   console.log("Cfg content:");
//   console.log(cfg);
//   console.log("snapshot content:");
//   console.log(snapshot);

//   let data = <PipedriveMessage>msg.body;

//   // Generate the config for https request
//   if (isUndefined(cfg)) {
//     throw new Error("cfg is undefined");
//   }
//   if (isUndefined(cfg.token)) {
//     throw new Error("API token is undefined");
//   }
//   if (isUndefined(cfg.company_domain)) {
//     throw new Error("Company domain is undefined");
//   }

//   // Client init
//   cfg.token = cfg.token.trim();
//   cfg.company_domain = cfg.company_domain.trim();
//   let client = new APIClient(cfg.company_domain, cfg.token);

//   // Upsert Organization, private by default
//   let organization = {
//     name: data.org_name,
//     add_time: data.org_add_time,
//     owner_id: data.owner_id,
//   } as Organization;

//   // Set visibility enum, API allows it to be omitted
//   //   switch (data.org_visible_to) {
//   //     case 1:
//   //       organization.visible_to = Visibility.OwnerAndFollowers;
//   //       break;
//   //     case 2:
//   //       organization.visible_to = Visibility.EntireCompany;
//   //       break;
//   //   }
//   console.log("Upserting organization: " + JSON.stringify(organization));
//   organization = await client.upsertOganization(organization);
//   console.log("Upserting organization: " + JSON.stringify(organization));
//   // assign returned id to org_id
//   let ret = <PipedriveMessage>data;
//   ret.org_id = organization.id;
//   // Return message

//   return ret;
// }

const Q = require("q");
const { newMessage } = require("../helpers");
const { resolve } = require("./../utils/resolver");
const { upsertObject } = require("./../utils/helpers");
//  import { APIClient } from "../apiclient";
import { ComponentConfig } from "../models/componentConfig";
// import { messages } from "ferryman-node";
/**
 * This method will be called from OIH platform providing following data
 *
 * @param {Object} msg - incoming message object that contains ``body`` with payload
 * @param {Object} cfg - configuration that is account information and configuration field values
 */
async function processAction(msg: any, cfg: ComponentConfig) {
  // const token = cfg.API_KEY;
  // const token = await getToken(cfg);
  cfg.token = cfg.token.trim();
  cfg.company_domain = cfg.company_domain.trim();
  //let client = new APIClient(cfg.company_domain, cfg.token);

  const self = this;
  const oihUid =
    msg.body.meta !== undefined && msg.body.meta.oihUid !== undefined
      ? msg.body.meta.oihUid
      : "oihUid not set yet";
  const recordUid =
    msg.body !== undefined && msg.body.meta.recordUid !== undefined
      ? msg.body.meta.recordUid
      : undefined;
  const applicationUid =
    msg.body.meta !== undefined && msg.body.meta.applicationUid !== undefined
      ? msg.body.meta.applicationUid
      : undefined;

  async function emitData() {
    /** Create an OIH meta object which is required
     * to make the Hub and Spoke architecture work properly
     */
    const newElement = { meta: {}, data: { body: {} } };
    const oihMeta = {
      applicationUid,
      oihUid,
      recordUid,
    };

    let objectExists = false;
    let dealObject = msg.body.data;

    // let organizationObject = {
    //   id: 2,
    //   creator_user_id: {
    //     id: 11550282,
    //     name: "Ioannis Lafiotis",
    //     email: "ioannis.lafiotis@cloudecosystem.org",
    //     has_pic: 0,
    //     pic_hash: null,
    //     active_flag: true,
    //     value: 11550282,
    //   },
    //   user_id: {
    //     id: 11550282,
    //     name: "Ioannis Lafiotis",
    //     email: "ioannis.lafiotis@cloudecosystem.org",
    //     has_pic: 0,
    //     pic_hash: null,
    //     active_flag: true,
    //     value: 11550282,
    //   },
    //   person_id: null,
    //   org_id: {
    //     name: "pipe",
    //     people_count: 0,
    //     owner_id: 11550282,
    //     address: null,
    //     active_flag: true,
    //     cc_email: "cloudecosystemev-sandbox@pipedrivemail.com",
    //     value: 3,
    //   },
    //   stage_id: 1,
    //   title: "pipedrive deal",
    //   value: 0,
    //   currency: "USD",
    //   add_time: "2020-09-09 14:32:57",
    //   update_time: "2020-09-10 08:13:38",
    //   stage_change_time: null,
    //   active: true,
    //   deleted: false,
    //   status: "open",
    //   probability: null,
    //   next_activity_date: "2020-09-10",
    //   next_activity_time: "10:30:00",
    //   next_activity_id: 1,
    //   last_activity_id: null,
    //   last_activity_date: null,
    //   lost_reason: null,
    //   visible_to: "3",
    //   close_time: null,
    //   pipeline_id: 1,
    //   won_time: null,
    //   first_won_time: null,
    //   lost_time: null,
    //   products_count: 0,
    //   files_count: 0,
    //   notes_count: 0,
    //   followers_count: 1,
    //   email_messages_count: 0,
    //   activities_count: 1,
    //   done_activities_count: 0,
    //   undone_activities_count: 1,
    //   participants_count: 0,
    //   expected_close_date: null,
    //   last_incoming_mail_time: null,
    //   last_outgoing_mail_time: null,
    //   label: null,
    //   stage_order_nr: 0,
    //   person_name: null,
    //   org_name: "pipe",
    //   next_activity_subject: "meeting with owner",
    //   next_activity_type: "call",
    //   next_activity_duration: "00:30:00",
    //   next_activity_note: null,
    //   formatted_value: "$0",
    //   weighted_value: 0,
    //   formatted_weighted_value: "$0",
    //   weighted_value_currency: "USD",
    //   rotten_time: null,
    //   owner_name: "Ioannis Lafiotis",
    //   cc_email: "cloudecosystemev-sandbox+deal2@pipedrivemail.com",
    //   org_hidden: false,
    //   person_hidden: false,
    // };
    if (recordUid && recordUid !== "" && recordUid !== "undefined") {
      // Conflict Management implementation
      const cfmResponse = await resolve(msg, cfg.token, "organization");

      if (cfmResponse) {
        dealObject = cfmResponse.resolvedConflict;
        objectExists = cfmResponse.exists;
      }
    }
    // msg.body.meta = 2;
    // objectExists = true;

    // Upsert the object depending on 'objectExists' property
    const reply = await upsertObject(
      dealObject,
      objectExists,
      "deals",
      msg.body.meta,
      cfg
    );
    // msg,
    // organizationObject,
    // objectExists,
    // "organizations",
    // msg.body.meta

    console.log("object is being put!!!");
    console.log("this is the reply:", reply.body);

    if (objectExists) {
      const result: any[] = [];
      reply.body.forEach((elem: any) => {
        delete elem.payload.uid;
        result.push(elem);
      });
      newElement.meta = oihMeta;
      newElement.data = reply.body;

      // newElement.data.body = {
      //   name: "pipedrive nuance",
      //   visible_to: "OwnerAndFollowers",
      // };
      console.log(newElement.data);
    } else {
      oihMeta.recordUid = reply.body.payload.uid;
      oihMeta.recordUid = msg.body.meta;
      delete reply.body.payload.uid;
      newElement.meta = oihMeta;
      newElement.data = reply.body.payload;
    }

    self.emit("data", newMessage(newElement));
  }

  /**
   * This method will be called from OIH platform if an error occured
   *
   * @param e - object containg the error
   */
  function emitError(e: {}) {
    console.error("ERROR: ", e);
    console.log("Oops! Error occurred");
    self.emit("error", e);
  }

  /**
   * This method will be called from OIH platform
   * when the execution is finished successfully
   *
   */
  function emitEnd() {
    console.log("Finished execution");
    self.emit("end");
  }

  Q().then(emitData).fail(emitError).done(emitEnd);
}

module.exports = {
  process: processAction,
};
