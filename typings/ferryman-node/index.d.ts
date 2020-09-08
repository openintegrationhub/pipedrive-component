declare namespace ferrymannode {
  interface MessagesModule {
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

declare module "ferryman" {
  var messages: ferrymannode.MessagesModule;
}
