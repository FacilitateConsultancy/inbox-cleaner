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

// ── Inbox Intelligence ──────────────────────────────────────────────────────

export type EmailCategory =
  | "Order Confirmation"
  | "Receipt"
  | "Shipping Update"
  | "Return & Refund"
  | "Newsletter"
  | "Promotion"
  | "Sale Alert"
  | "Travel"
  | "Finance"
  | "Social"
  | "Other";

export type RuleAction = "move" | "delete" | "delete-duplicates" | "unsubscribe" | "keep";

export interface CategoryGroup {
  category: EmailCategory;
  count: number;
  topSenders: string[];
  messageIds: string[];
  sampleSubjects: string[];          // up to 30 example subjects
  duplicateIds?: string[];           // IDs of duplicate emails (all but newest per sender)
  duplicateCount?: number;
  confidence: number;
  suggestedAction: RuleAction;
  suggestedFolder?: string;
}

export interface IntelligenceRule {
  id: string;
  category: EmailCategory;
  action: RuleAction;
  folder?: string;
  confidence: number;
  emailCount: number;
  enabled: boolean;
  description: string;
  messageIds?: string[];
  sampleSubjects?: string[];
}

export interface IntelligenceResult {
  categories: CategoryGroup[];
  suggestedRules: IntelligenceRule[];
  suggestedFolders: string[];
}
