const trigger = require("../../src/triggers/getWTA");

import { getWTA, GetWTAConfig } from "../../src/triggers/getWTA";
import { messages } from "elasticio-node";
import * as nock from "nock";
import { readFile } from "fs-extra";
import { StatusResultError } from "../../src/utils";

describe("getWTA()", () => {
    const message = messages.newEmptyMessage();
    const config = {
        host: "mock.just-icc.com",
        username: "user1",
        password: "password1",
        startdate: "20170601",
        enddate: "20170614"
    } as GetWTAConfig;


    var self = this;
    beforeEach(() => {
        self.emit = jest.fn();
    });


    it("should request and read csv data", async () => {
        expect.assertions(1);

        // Mock
        var wtaAPI = nock("https://mock.just-icc.com")
            .get("/api/export/select/WorkingTimeAccounts/v1?startDate=20170601&endDate=20170614")
            .reply(200, {
                StatusToken: 42
            });
        let data = await readFile("test/getWTA.csv");
        var downloadAPI = nock("https://mock.just-icc.com")
            .get("/api/export/download/42")
            .reply(200, data);

        // Act
        // We need to bind the mocked this for the emit() function
        let result = await getWTA.call(this, {}, config, {});

        // Assert
        expect(self.emit.mock.calls.length).toEqual(9);
    });

    it("should throw an exception on 404", async () => {
        expect.assertions(1);

        // Mock
        var wtaAPI = nock("https://mock.just-icc.com")
            .get("/api/export/select/WorkingTimeAccounts/v1?startDate=20170601&endDate=20170614")
            .reply(200, {
                StatusToken: 42
            });
        let data = await readFile("test/getWTA.csv");
        var downloadAPI = nock("https://mock.just-icc.com")
            .get("/api/export/download/42")
            .reply(404, {
                "Status": "Error",
                "Message": "Just a mocked error"
            });

        // Act
        try {
            await getWTA(message, config, null);
        } catch (error) {
            expect(error).toBeInstanceOf(StatusResultError);
        }
    });
});
