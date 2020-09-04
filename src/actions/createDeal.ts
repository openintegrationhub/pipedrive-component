import { isUndefined } from "lodash";

import { Deal } from "../models/deal";
import { Status, Visibility } from "../models/enums";
import { PipedriveMessage } from "../models/pipedriveMessage";
import { ComponentConfig } from "../models/componentConfig";
const Q = require("q");
import { APIClient } from "../apiclient";
import { messages } from "ferryman-node";

/**
 * createDeal creates a new deal.
 *
 * @param msg incoming messages which is empty for triggers
 * @param cfg object to retrieve triggers configuration values
 * @param snapshot the scratchpad for persitence between execution runs
 *
 * @returns promise resolving a message to be emitted to the platform
 */
export async function processAction(
  msg: ferrymannode.Message,
  cfg: ComponentConfig,
  snapshot: any
) {
  console.log("Msg content:");
  console.log(msg);
  console.log("Cfg content:");
  console.log(cfg);
  console.log("snapshot content:");
  console.log(snapshot);

  let data = <PipedriveMessage>msg.body;
  const self = this;
  // Get the input data
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

  async function emitData() {
    // Client init
    cfg.token = cfg.token.trim();
    cfg.company_domain = cfg.company_domain.trim();
    let client = new APIClient(cfg.company_domain, cfg.token);

    // Create Deal
    let deal = {
      title: data.deal_title,
      currency: data.deal_currency,
      person_id: data.person_id,
      org_id: data.org_id,
      user_id: data.owner_id,
      add_time: data.deal_add_time,
      lost_reason: data.deal_lost_reason,
      stage_id: data.deal_stage_id,
      value: data.deal_value,
    } as Deal;

    // Set visibility enum, API allows it to be omitted
    switch (data.deal_visible_to) {
      case 1:
        deal.visible_to = Visibility.OwnerAndFollowers;
        break;
      case 2:
        deal.visible_to = Visibility.EntireCompany;
        break;
    }
    switch (data.deal_status) {
      case "Open":
        deal.status = Status.Open;
        break;
      case "Won":
        deal.status = Status.Won;
        break;
      case "Lost":
        deal.status = Status.Lost;
        break;
    }
    console.log("Creating deal: " + JSON.stringify(deal));
    deal = await client.createDeal(deal);
    console.log("Created deal: " + JSON.stringify(deal));

    // Return message
    let ret = <PipedriveMessage>data;
    ret.deal_id = deal.id;

    self.emit("data", messages.newMessageWithBody(ret));
    // return ret;
  }
  function emitError(e: {}) {
    console.error("ERROR: ", e);
    console.log("Oops! Error occurred");
    self.emit("error", e);
  }
  function emitEnd() {
    console.log("Finished execution");
    self.emit("end");
  }

  // Set status enum, API allows it to be omitted

  Q().then(emitData).fail(emitError).done(emitEnd);
}
module.exports = {
  process: processAction,
};
