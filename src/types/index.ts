export interface EmailMessage {
  id: string;
  subject: string;
  receivedDateTime: string;
  sender: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
}

export interface SenderGroup {
  email: string;
  name: string;
  count: number;
  latestDate: string;
  messageIds: string[];
}

export type SenderAction = "keep" | "remove" | "unsubscribe" | "undecided";

export interface SenderDecision {
  [email: string]: SenderAction;
}
