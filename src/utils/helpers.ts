//const request = require('request-promise').defaults({ simple: false, resolveWithFullResponse: true });

import { ComponentConfig } from "../models/componentConfig";
//import { APIClient } from "../apiclient";

//const BASE_URI = "https://api.pipedrive.com/v1/";
export const request = require("request-promise").defaults({
  simple: false,
  resolveWithFullResponse: true,
});

/**
 * This method fetches persons or organizations from Snazzy Contacts
 *
 * @param options - request options
 * @param snapshot - current state of snapshot
 * @return {Object} - Array of person objects containing data and meta
 */

async function fetchAll(options: {}, snapshot: any) {
  try {
    const result: any[] = [];

    const entries = await request.get(options);

    console.log("RESPONSE");
    console.log(entries.body.data[0]);
    console.log(snapshot);
    if (
      Object.entries(entries.body.data).length === 0 &&
      entries.body.data.constructor === Object
    ) {
      return false;
    }
    entries.body.data.forEach((person: any) => {
      //Push only this objects which were updated after last function call
      if (person.update_time > snapshot.lastUpdated) {
        return result.push(person);
      }
      //result.push(person);
      return person;
    });

    // Sort the objects by lastUpdate
    result.sort(
      (a, b) => parseInt(a.update_time, 10) - parseInt(b.update_time, 10)
    );
    return {
      result,
    };
  } catch (e) {
    throw new Error(e);
  }
}

/**
 * @desc Prepares a DTO object for updating
 *
 * @access  Private
 * @param {Object} msg - the whole incoming object
 * @param {String} type - either 'person 'or 'organization'
 * @return {Object} - a new DTO object
 */
function prepareObject(msg: any, type: string) {
  let newObject: {
    dto: {};
  };
  if (type === "persons") {
    newObject = {
      dto: {
        name: msg.name ? msg.name : "",
        // first_name: msg.first_name ? msg.first_name : "",
        // last_name: msg.last_name ? msg.last_name : "",
        //middleName: msg.middleName ? msg.middleName : "",
        // salutation: msg.salutation ? msg.salutation : "",
        // title: msg.title ? msg.title : "",
        // birthday: msg.birthday ? msg.birthday : "",
        // nickname: msg.nickname ? msg.nickname : "",
        // jobTitle: msg.jobTitle ? msg.jobTitle : "",
        // gender: msg.gender ? msg.gender : "",
      },
    };
    console.log("this is the new object!!", newObject);
    console.log("this is the new object.dto!!", newObject.dto);
  } else {
    newObject = {
      dto: {
        name: msg.name ? msg.name : "new message",
        // logo: msg.logo ? msg.logo : "",
      },
    };
  }
  return newObject;
}

/**
 * @desc Upsert function which creates or updates
 * an object, depending on certain conditions
 *
 * @access  Private
 * @param {Object} msg - the whole incoming object
 * @param {String} token - token from Pipefrive
 * @param {Boolean} objectExists - ig the object was found
 * @param {String} type - object type - 'person' or 'organization'
 * @param {Object} meta -  meta object containg meta inforamtion
 * @return {Object} - the new created ot update object in Pipedrive
 */
async function upsertObject(
  msg: any,
  objectExists: boolean,
  type: string,
  // meta: { recordUid: number },
  id: number,
  cfg: ComponentConfig
) {
  // msg,
  // organizationObject,
  // objectExists,
  // "organizations",
  // msg.body.meta
  cfg.token = cfg.token.trim();
  cfg.company_domain = cfg.company_domain.trim();

  //let client = new APIClient(cfg.company_domain, cfg.token);

  if (!type) {
    return false;
  }

  let newObject: any;
  let uri;
  let method;

  if (objectExists) {
    // Update the object if it already exists
    method = "PUT";
    //uri = `${BASE_URI}/${type}/${meta.recordUid}`;
    uri = `https://${cfg.company_domain}.pipedrive.com/v1/${type}/${id}?api_token=${cfg.token}`;
    // if (type === "organization") {
    //   newObject = client.upsertOganization(newObject, meta.recordUid);
    // }

    console.log(uri);
    newObject = prepareObject(msg, type);
    delete newObject.uid;
  } else {
    // Create the object if it does not exist
    method = "POST";
    uri = `https://${cfg.company_domain}.pipedrive.com/v1/${type}?api_token=${cfg.token}`;
    newObject = msg;
    delete newObject.uid;
    delete newObject.categories;
    delete newObject.relations;
  }

  try {
    const options = {
      method,
      uri,
      json: true,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
      },
      body: newObject,
    };

    const person = await request(options);
    return person;
  } catch (e) {
    return e;
  }
}

/**
 * This method fetches objects from Snazzy Contacts
 * depending on the value of count variable and type
 *
 * @param token - Snazzy Contacts token required for authentication
 * @param snapshot - current state of snapshot
 * @param count - amount of objects
 * @return {Object} - Array of person objects containing data and meta
 */
async function getEntries(snapshot: any, type: string, cfg: ComponentConfig) {
  cfg.token = cfg.token.trim();
  cfg.company_domain = cfg.company_domain.trim();

  let uri;

  uri = `https://${cfg.company_domain}.pipedrive.com/v1/${type}?api_token=${cfg.token}`;

  try {
    const requestOptions = {
      uri,
      json: true,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
      },
    };
    console.log(requestOptions);
    console.log(snapshot);

    let entries: any;
    entries = await fetchAll(requestOptions, snapshot);
    console.log(entries);

    if (!entries.result || !Array.isArray(entries.result)) {
      return "Expected records array.";
    }
    return entries;
  } catch (e) {
    throw new Error(e);
  }
}

module.exports = { getEntries, upsertObject };
