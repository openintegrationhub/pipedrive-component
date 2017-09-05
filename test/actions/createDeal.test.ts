const trigger = require("../../src/actions/createDeal");

import { messages } from "elasticio-node";
import { readFile } from "fs-extra";
import * as nock from "nock";

import { createDeal, CreateDealInMessage, } from "../../src/actions/createDeal";
import { createActivity, CreateActivityInMessage } from "../../src/actions/createActivity";
import { Deal } from '../../src/models/deal';
import { Status, Done } from '../../src/models/enums';
import { Note } from '../../src/models/note';
import { Organization } from '../../src/models/organization';
import { Person } from '../../src/models/person';
import { APIClient, APIResult } from '../../src/apiclient';
import { Activity } from '../../src/models/activity';
import { ComponentConfig } from '../../src/models/componentConfig';

describe("Call createDeal() and createActivity() in order", () => {
    let dealMessage = messages.newEmptyMessage();
    let activityMessage = messages.newEmptyMessage();

    // Careful! this object is common data for two tests beware side effects
    const data = {
        contact_name: 'Gordon Freeman',
        contact_email: 'gordon.freeman@blackmesa.com',
        contact_phone: '+01 2516/819813',
        role: 'Labrat',
        company: 'Black Mesa',
        company_size: '100-500',
        message: 'Can you integrate with the XEN based systems?',
        owner_id: 332632,
    };
    dealMessage.body = data as CreateDealInMessage;
    activityMessage.body = data as CreateActivityInMessage;

    const organization = {
        id: 42,
        name: data.company,
        owner_id: 332632,
    } as Organization;

    const person = {
        id: 12,
        name: data.contact_name,
        phone: new Array<string>(data.contact_phone),
        email: new Array<string>(data.contact_email),
        org_id: organization.id,
        owner_id: 332632,
    } as Person;

    const deal = {
        id: 99,
        title: 'Website: ' + data.company,
        person_id: person.id,
        org_id: organization.id,
        status: Status.Open,
    } as Deal;

    const note = {
        id: 123,
        deal_id: deal.id,
        content: 'Just a simple note. : Can you integrate with the XEN based systems?',
    } as Note;

    const activity = {
        subject: deal.title,
        person_id: person.id,
        done: Done.NotDone,
        deal_id: deal.id,
        type: 'task',
    } as Activity;

    const config = {
        company_domain: "aperture",
        token: "i-am-real-token-yes",
        deal_note: "Just a simple note."
    } as ComponentConfig;

    var self = this;
    beforeEach(() => {
        self.emit = jest.fn();
    });

    // Careful! the deal creation in this test should insert id values into the
    // message object which should be reused by the following test to test the
    // id value checks
    it("should create a person, a organization, a deal then an activity and a notice", async () => {
        expect.assertions(5);

        // Mock
        var createOrganizationAPI = nock("https://aperture.pipedrive.com/v1")
            .post("/organizations")
            .query({ 'api_token': config.token })
            .reply(200, { success: true, data: organization } as APIResult);
        var createContactAPI = nock("https://aperture.pipedrive.com/v1")
            .post("/persons")
            .query({ 'api_token': config.token })
            .reply(200, { success: true, data: person } as APIResult);
        var createDealAPI = nock("https://aperture.pipedrive.com/v1")
            .post("/deals")
            .query({ 'api_token': config.token })
            .reply(200, { success: true, data: deal } as APIResult);
        var createNoteAPI = nock("https://aperture.pipedrive.com/v1")
            .post("/notes")
            .query({ 'api_token': config.token })
            .reply(200, { success: true, data: note } as APIResult);
        var createActivityAPI = nock("https://aperture.pipedrive.com/v1")
            .post("/activities")
            .query({ 'api_token': config.token })
            .reply(200, { success: true, data: activity } as APIResult);

        // Act
        await createDeal.call(this, dealMessage, config, {});

        // Assert
        expect(createOrganizationAPI.isDone()).toBeTruthy();
        expect(createContactAPI.isDone()).toBeTruthy();
        expect(createDealAPI.isDone()).toBeTruthy();
        expect(createNoteAPI.isDone()).toBeTruthy();
        expect(createActivityAPI.isDone()).toBeTruthy();
    });

    // Careful! This test depends on the test above to create id values in the
    // shared message object, which are used to test the id checks
    it("should create a person, a organization, an activity then a notice", async () => {
        expect.assertions(2);

        // Mock
        var createNoteAPI = nock("https://aperture.pipedrive.com/v1")
            .post("/notes")
            .query({ 'api_token': config.token })
            .reply(200, { success: true, data: note } as APIResult);
        var createActivityAPI = nock("https://aperture.pipedrive.com/v1")
            .post("/activities")
            .query({ 'api_token': config.token })
            .reply(200, { success: true, data: activity } as APIResult);

        // Act
        await createActivity.call(this, activityMessage, config, {});

        // Assert
        expect(createNoteAPI.isDone()).toBeTruthy();
        expect(createActivityAPI.isDone()).toBeTruthy();
    });
});
