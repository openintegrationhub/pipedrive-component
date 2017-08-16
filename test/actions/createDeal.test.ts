const trigger = require("../../src/actions/createDeal");

import { messages } from "elasticio-node";
import { readFile } from "fs-extra";
import * as nock from "nock";

import { createDeal, CreateDealConfig, CreateDealInMessage } from "../../src/actions/createDeal";
import { Deal } from '../../src/models/deal';
import { Status } from '../../src/models/enums';
import { Note } from '../../src/models/note';
import { Organisation } from '../../src/models/organisation';
import { Person } from '../../src/models/person';
import { APIClient, APIResult } from '../../src/apiclient';

describe("createDeal()", () => {
    let message = messages.newEmptyMessage();
    const data = {
        contact_name: 'Gordon Freeman',
        contact_email: 'gordon.freeman@blackmesa.com',
        contact_phone: '+01 2516/819813',
        role: 'Labrat',
        company: 'Black Mesa',
        company_size: '100-500',
        message: 'Can you integrate with the XEN based systems?',
    } as CreateDealInMessage;
    message.body = data;

    const organisation = {
        id: 42,
        name: data.company,
    } as Organisation;

    const person = {
        id: 12,
        name: data.contact_name,
        phone: new Array<string>(data.contact_phone),
        email: new Array<string>(data.contact_email),
        org_id: organisation.id,
    } as Person;

    const deal = {
        id: 99,
        title: 'Website: ' + data.company,
        person_id: person.id,
        org_id: organisation.id,
        status: Status.Open,
    } as Deal;

    const note = {
        id: 123,
        deal_id: deal.id,
        content: 'test content',
    } as Note;

    const config = {
        company_domain: "aperture",
        token: "i-am-real-token-yes"
    } as CreateDealConfig;

    var self = this;
    beforeEach(() => {
        self.emit = jest.fn();
    });

    it("should create a person, a company, a deal and a notice", async () => {
        expect.assertions(4);

        // Mock
        var createOrganisationAPI = nock("https://aperture.pipedrive.com/v1")
            .post("/organisations")
            .query({ 'api_token': config.token })
            .reply(200, { success: true, data: organisation } as APIResult);
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

        // Act
        await createDeal.call(this, message, config, {});

        // Assert
        expect(createOrganisationAPI.isDone()).toBeTruthy();
        expect(createContactAPI.isDone()).toBeTruthy();
        expect(createDealAPI.isDone()).toBeTruthy();
        expect(createNoteAPI.isDone()).toBeTruthy();
    });
});
