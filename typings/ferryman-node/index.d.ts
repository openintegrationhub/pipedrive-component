declare namespace ferrymannode {
  interface MessagesModule {
    // I didn't include the emit function, because not even the other components seem to use them anyhow.
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

declare module "ferryman-node" {
  var messages: ferrymannode.MessagesModule;
}
