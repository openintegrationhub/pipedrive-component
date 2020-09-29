# pipedrive-component 

> Pipedrive component for Open Integration Hub. Based on elastic.io a [component](https://github.com/elasticio/pipedrive-component)


## Before you Begin

Before you can use the adapter you **must be a registered Pipedrive user**. Please visit the home page of [pipedrive.com](https://pipedrive.com) to sign up.
Any attempt to reach [ Pipedrive ](https://pipedrive.com) endpoints without registration will not be successful!

## Getting Started

### Authentication

You need to configure your company domain and access token to authenticate the pipedrive component for pipedrive.

# Actions

- Create person (`createPerson.ts`)
- Create organization(`createOrganization.ts`)
- Upsert organization(`upsertOrganization.ts`)
- Upsert Deal(`upsertDeal.ts`)
- Upsert Person(`upsertPerson.ts`)
- Upsert Activity(`upsertActivity.ts`)
- Create person (`createPerson.ts`)
- Delete organization(`deleteOrganization.ts`)
- Delete Person(`deletePerson.ts`)
- Delete Deal(`deleteDeal.ts`)
- Delete Activity(`deleteActivity.ts`)
- Create activity (`cretaeActivity.ts`)
- Create organization(`upsertOrganization.ts`)

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

### Delete Person

Delete Person action (deletePerson.ts) deletes an existing Person if it already exists.

### Delete Activity

Delete Activity action (deleteActivity.ts) deletes an existing Activity if it already exists.

### Delete Deal

Delete Deal action (deleteDeal.ts) deletes an existing Deal if it already exists.

# Triggers

- Get persons - polling (`getPersonsPolling.js`)
- Get organizations - polling (`getOrganizationsPolling.ts`)
- Get deals - polling (`getDealsPolling.ts`)
- Get activities - polling (`getActivitiesPolling.ts`)

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
Issue connecting the connector with the webhook site to test the triggers...

## TODOs

- Work on the webhooks part
- Test it with pipedrive-transformers and other component
- Code reviews

## License

Apache-2.0 © [elastic.io GmbH](https://www.elastic.io)
