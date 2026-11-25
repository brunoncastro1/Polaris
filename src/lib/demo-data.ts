import type { PortalData, Photo } from "./types";
import { sceneUri } from "./demo-scenes";

// Sample commercial client (a property manager with three buildings), used in demo mode only.
const photos = (rooms: string[], seed: number): Photo[] =>
  rooms.flatMap((room, i) => [
    { kind: "before" as const, room, url: sceneUri(room, true, seed + i) },
    { kind: "after" as const, room, url: sceneUri(room, false) },
  ]);

const S1 = { site: "Clark Street Medical Building", siteAddress: "2850 N Clark St, Chicago, IL 60657" };
const S2 = { site: "Lincoln Park Office Center", siteAddress: "2400 N Lincoln Ave, Chicago, IL 60614" };
const S3 = { site: "Belmont Lofts · common areas", siteAddress: "1100 W Belmont Ave, Chicago, IL 60657" };

export const demoData: PortalData = {
  client: {
    name: "Lakeshore Property Management",
    contactName: "Michael Reed",
    email: "demo@polaris.example",
    phone: "(312) 555-0148",
    address: "200 W Madison St, Suite 1200, Chicago, IL 60606",
    plan: "Custodial services · 3 buildings",
    accessNotes: "Key cards at each building's security desk · alarm codes on file",
    preferences: "Green-certified products in medical suites · report any maintenance issues by email",
    clientSince: "2025-04-01",
  },
  visits: [
    { id: "v8", ...S2, title: "Custodial service", status: "scheduled", startsAt: "2026-12-03T00:00:00Z", clockIn: null, clockOut: null, team: "Ana & Carlos", tasks: [], teamNote: null, photos: [] },
    { id: "v7", ...S1, title: "Custodial service", status: "scheduled", startsAt: "2026-12-04T00:00:00Z", clockIn: null, clockOut: null, team: "Ana & Carlos", tasks: [], teamNote: null, photos: [] },
    { id: "v6", ...S1, title: "Custodial service + hard floor care", status: "completed", startsAt: "2026-11-21T00:00:00Z", clockIn: "2026-11-21T00:04:00Z", clockOut: "2026-11-21T03:16:00Z", team: "Ana & Carlos",
      tasks: ["Lobby: glass doors and entry mats cleaned", "Reception and waiting areas dusted and disinfected", "Restrooms: fixtures sanitized, supplies restocked", "Break room: counters, sink, microwave and fridge exterior cleaned", "Trash and recycling removed from all suites", "Hard floors: auto-scrubbed and burnished, lobby and hallways", "Carpets vacuumed, offices and conference room", "High-touch points disinfected (handles, switches, elevator buttons)", "Spot cleaning of interior glass partitions"],
      teamNote: "Paper towel dispenser in the 2nd floor men's restroom is broken. We left a refill on the counter. Recommend a replacement.",
      photos: photos(["Lobby", "Restrooms", "Break room"], 3) },
    { id: "v5", ...S2, title: "Custodial service", status: "completed", startsAt: "2026-11-20T00:00:00Z", clockIn: "2026-11-20T00:01:00Z", clockOut: "2026-11-20T02:40:00Z", team: "Ana & Carlos",
      tasks: ["Restrooms sanitized and restocked", "Break room cleaned", "Trash and recycling removed", "Carpets vacuumed", "High-touch points disinfected"], teamNote: "All areas completed. No issues.", photos: photos(["Restrooms", "Break room"], 9) },
    { id: "v4", ...S3, title: "Common areas + carpet extraction", status: "completed", startsAt: "2026-11-15T15:00:00Z", clockIn: "2026-11-15T15:05:00Z", clockOut: "2026-11-15T19:30:00Z", team: "Carlos & Juliana",
      tasks: ["Hot-water extraction, lobby and 3 hallway runners", "Pre-treatment of stains at main entrance", "Mailroom and package area cleaned", "Elevator cabs: walls, doors and floors cleaned", "Air movers placed to speed drying"],
      teamNote: "Carpets will be fully dry in about 4 hours. Stain near the mailboxes was reduced by about 90%.", photos: photos(["Lobby"], 15) },
  ],
  invoices: [
    { id: "i4", number: "1048", subject: "Custodial services · November · 3 buildings", issuedAt: "2026-11-30", dueAt: "2026-12-15", total: 5860, balance: 5860, status: "awaiting_payment", paymentUrl: null },
    { id: "i3", number: "1044", subject: "Carpet extraction · Belmont Lofts", issuedAt: "2026-11-15", dueAt: "2026-11-30", total: 680, balance: 0, status: "paid", paymentUrl: null },
    { id: "i2", number: "1031", subject: "Custodial services · October · 3 buildings", issuedAt: "2026-10-31", dueAt: "2026-11-15", total: 5860, balance: 0, status: "paid", paymentUrl: null },
  ],
};
