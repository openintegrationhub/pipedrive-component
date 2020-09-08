# pipedrive-component [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

> elastic.io integration component for Pipedriver

# pipedrive-component

pipedrive Component component for the [elastic.io platform](http://www.elastic.io &#34;elastic.io platform&#34;)

## Before you Begin

Before you can use the adapter you **must be a registered Pipedrive user**. Please visit the home page of [pipedrive.com](https://pipedrive.com) to sign up.
Any attempt to reach [ Pipedrive ](https://pipedrive.com) endpoints without registration will not be successful!

## Getting Started

### Authentication

You need to configure your company domain and access token to authenticate the pipedrive component for pipedrive.

# Actions

### Create Deals

You can create deals with the help of the createDeal action. It will automatically create an organisation, a contact, a deal and a notice for the deal for you.

### Create Organization

You can create organizations with the help of the createOrganization action.

### Create Activity

You can create activities with the help of the createActivity action.

### Create Person

You can create person with the help of the createPerson action.

### Create Note

You can create notes with the help of the createNote action.

### Upsert organization

Upsert organization action (upsertOrganization.ts) updates an existing organization if it already exists. Otherwise it creates a new one.

### Delete organization

Delete organization action (deleteOrganization.ts) deletes an existing organization if it already exists.

# Triggers

### Get organizations

Get organizations trigger (getOrganizationsPolling.ts) performs a request which fetch all organizations saved by a user in Pipedrive.

### Get activities

Get activities trigger (getActivitiesPolling.ts) performs a request which fetch all activities saved by a user in Pipedrive.

### Get deals

Get deals trigger (getDealsPolling.ts) performs a request which fetch all deals saved by a user in Pipedrive.

### Get persons

Get persons trigger (getPersonsPolling.ts) performs a request which fetch all persons saved by a user in Pipedrive.

## Known issues

No known issues are there yet.

## TODOs

- Write more actions / triggers.

## License

Apache-2.0 © [elastic.io GmbH](https://www.elastic.io)

[travis-image]: https://travis-ci.org/elasticio/pipedrive-component.svg?branch=master
[travis-url]: https://travis-ci.org/elasticio/pipedrive-component
[daviddm-image]: https://david-dm.org/elasticio/pipedrive-component.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/elasticio/pipedrive-component
