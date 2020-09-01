//const request = require('request-promise').defaults({ simple: false, resolveWithFullResponse: true });

import { ComponentConfig } from "../models/componentConfig";
import { APIClient } from "../apiclient";

const BASE_URI = "https://api.pipedrive.com/v1/";
export const request = require("request-promise");

/**
 * This method fetches persons or organizations from Snazzy Contacts
 *
 * @param options - request options
 * @param snapshot - current state of snapshot
 * @return {Object} - Array of person objects containing data and meta
 */

async function fetchAll(options: {}, snapshot: { lastUpdated: Date }) {
  try {
    const result: any[] = [];

    const entries = await request.get(options);

    if (
      Object.entries(entries.body).length === 0 &&
      entries.body.constructor === Object
    ) {
      return false;
    }
    entries.body.data.filter((person: { lastUpdate: Date }) => {
      // Push only this objects which were updated after last function call
      if (person.lastUpdate > snapshot.lastUpdated) {
        return result.push(person);
      }
      return person;
    });

    // Sort the objects by lastUpdate
    result.sort(
      (a, b) => parseInt(a.lastUpdate, 10) - parseInt(b.lastUpdate, 10)
    );
    return {
      result,
      count: entries.body.meta.count,
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
  if (type === "person") {
    newObject = {
      dto: {
        firstName: msg.firstName ? msg.firstName : "",
        lastName: msg.lastName ? msg.lastName : "",
        middleName: msg.middleName ? msg.middleName : "",
        salutation: msg.salutation ? msg.salutation : "",
        title: msg.title ? msg.title : "",
        birthday: msg.birthday ? msg.birthday : "",
        nickname: msg.nickname ? msg.nickname : "",
        jobTitle: msg.jobTitle ? msg.jobTitle : "",
        gender: msg.gender ? msg.gender : "",
      },
    };
  } else {
    newObject = {
      dto: {
        name: msg.name ? msg.name : "",
        logo: msg.logo ? msg.logo : "",
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
  token: string,
  objectExists: boolean,
  type: string,
  meta: { recordUid: any },
  cfg: ComponentConfig
) {
  cfg.token = cfg.token.trim();
  cfg.company_domain = cfg.company_domain.trim();

  let client = new APIClient(cfg.company_domain, cfg.token);

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
    if (type === "organization") {
      newObject = client.upsertOganization(newObject, meta.recordUid);
    }
    newObject = prepareObject(msg, type);
    delete newObject.uid;
  } else {
    // Create the object if it does not exist
    method = "POST";
    uri = `${BASE_URI}/${type}`;
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
        Authorization: `Bearer ${token}`,
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
async function getEntries(
  snapshot: { lastUpdated: Date },
  count: number,
  type: string,
  cfg: ComponentConfig
) {
  cfg.token = cfg.token.trim();
  cfg.company_domain = cfg.company_domain.trim();

  let uri;

  if (count) {
    uri = `https://${cfg.company_domain}.pipedrive.com/v1/${type}?num=${count}`;
  } else {
    uri = `https://${cfg.company_domain}.pipedrive.com/v1/${type}`;
  }

  try {
    const requestOptions = {
      uri,
      json: true,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
      },
    };
    let entries: any;
    entries = await fetchAll(requestOptions, snapshot);

    if (!entries.result || !Array.isArray(entries.result)) {
      return "Expected records array.";
    }
    return entries;
  } catch (e) {
    throw new Error(e);
  }
}

module.exports = { getEntries, upsertObject };
