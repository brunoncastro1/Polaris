export type Photo = { kind: "before" | "after" | "other"; room: string | null; url: string };

export type Visit = {
  id: string;
  title: string;
  site: string | null;
  siteAddress: string | null;
  status: "scheduled" | "completed";
  startsAt: string;
  clockIn: string | null;
  clockOut: string | null;
  team: string;
  tasks: string[];
  teamNote: string | null;
  photos: Photo[];
};

export type Invoice = {
  id: string;
  number: string;
  subject: string;
  issuedAt: string;
  dueAt: string | null;
  total: number;
  balance: number;
  status: string;
  paymentUrl: string | null;
};

export type Client = {
  name: string;          // company
  contactName: string;   // person signed in
  email: string;
  phone: string;
  address: string;
  plan: string;
  accessNotes: string;
  preferences: string;
  clientSince: string | null;
};

export type PortalData = { client: Client; visits: Visit[]; invoices: Invoice[] };
