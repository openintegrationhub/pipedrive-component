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
//   msg: elasticionode.Message,
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

/**
 * This method will be called from OIH platform providing following data
 *
 * @param {Object} msg - incoming message object that contains ``body`` with payload
 * @param {Object} cfg - configuration that is account information and configuration field values
 */
async function processAction(msg: any, cfg: ComponentConfig) {
  // const token = cfg.API_KEY;
  //   const token = await getToken(cfg);
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
    let organizationObject = msg.body.data;

    if (recordUid && recordUid !== "" && recordUid !== "undefined") {
      // Conflict Management implementation
      const cfmResponse = await resolve(msg, cfg.token, "organization");

      if (cfmResponse) {
        organizationObject = cfmResponse.resolvedConflict;
        objectExists = cfmResponse.exists;
      }
    }

    // Upsert the object depending on 'objectExists' property
    const reply = await upsertObject(
      organizationObject,
      cfg.token,
      objectExists,
      "organization",
      msg.body.meta
    );

    if (objectExists) {
      const result: any[] = [];
      reply.body.forEach((elem: any) => {
        delete elem.payload.uid;
        result.push(elem);
      });
      newElement.meta = oihMeta;
      newElement.data = reply.body;
    } else {
      oihMeta.recordUid = reply.body.payload.uid;
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
