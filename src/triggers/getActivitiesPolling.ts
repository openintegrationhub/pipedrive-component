/* eslint no-param-reassign: "off" */

/**
 * Copyright 2019 Wice GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const Q = require("q");
//const { newMessage } = require("../helpers");
const { getEntries } = require("../utils/helpers");
///const { getToken } = require('./../utils/authentication');
import { ComponentConfig } from "../models/componentConfig";
import { messages } from "ferryman-node";

/**
 * This method will be called from OIH platform providing following data
 *
 * @param cfg - configuration that is account information and configuration field values
 * @param snapshot - saves the current state of integration step for the future reference
 */
async function processTrigger(
  cfg: ComponentConfig,
  snapshot: { lastUpdated: Date }
) {
  // Authenticate and get the token from Pipedrive
  const { applicationUid, domainId, schema, recordUid } = cfg;

  // const token = cfg.API_KEY;
  // const token = cfg.token;
  const self = this;

  // Set the snapshot if it is not provided
  snapshot.lastUpdated = snapshot.lastUpdated || new Date(0).getTime();

  async function emitData() {
    /** Create an OIH meta object which is required
     * to make the Hub and Spoke architecture work properly
     */
    const oihMeta = {
      applicationUid:
        applicationUid !== undefined && applicationUid !== null
          ? applicationUid
          : undefined,
      schema: schema !== undefined && schema !== null ? schema : undefined,
      domainId:
        domainId !== undefined && domainId !== null ? domainId : undefined,
      recordUid:
        recordUid !== undefined && recordUid !== null ? recordUid : undefined,
    };

    // Get the total amount of fetched objects
    // do we need the count???
    let count;
    const getCount = await getEntries(snapshot, count, "activities");
    count = getCount.count; // eslint-disable-line

    const activities = await getEntries(snapshot, count, "activities", cfg);

    console.log(`Found ${activities.result.length} new records.`);

    if (activities.result.length > 0) {
      activities.result.forEach((elem: any) => {
        const newElement = { meta: {}, data: elem };
        // Attach object uid to oihMeta object
        oihMeta.recordUid = elem.uid;
        delete elem.uid;
        newElement.meta = oihMeta;
        newElement.data = elem;
        // Emit the object with meta and data properties
        self.emit("data", messages.newMessageWithBody(newElement));
      });
      // Get the lastUpdate property from the last object and attach it to snapshot
      snapshot.lastUpdated =
        activities.result[activities.result.length - 1].lastUpdate;
      console.log(`New snapshot: ${snapshot.lastUpdated}`);
      self.emit("snapshot", snapshot);
    } else {
      self.emit("snapshot", snapshot);
    }
  }

  /**
   * This method will be called from OIH platform if an error occured
   *
   * @param e - object containg the error
   */
  function emitError(e: {}) {
    console.log(`ERROR: ${e}`);
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
  process: processTrigger,
  getEntries,
};
