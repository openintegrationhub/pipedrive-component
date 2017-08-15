declare namespace elasticionode {
    interface MessagesModule {
        // We don't include the emit function, because not even the official
        // components seem to use then anyhow.
        newEmptyMessage(): Message;
        newMessageWithBody(body: any): Message;
    }

    interface Message {
        id: string;
        attachments: any;
        body: any;
        headers: any;
        metadata: any;
    }
}

declare module "elasticio-node" {
    var messages: elasticionode.MessagesModule;
}

