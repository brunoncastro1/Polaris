import type { PortalData, Photo } from "./types";
import { sceneUri } from "./demo-scenes";

// Sample commercial client used in demo mode only.
const photos = (rooms: string[], seed: number): Photo[] =>
  rooms.flatMap((room, i) => [
    { kind: "before" as const, room, url: sceneUri(room, true, seed + i) },
    { kind: "after" as const, room, url: sceneUri(room, false) },
  ]);

export const demoData: PortalData = {
  client: {
    name: "Michael Reed · Lakeview Dental Group",
    email: "demo@polaris.example",
    phone: "(312) 555-0148",
    address: "2850 N Clark St, Suite 300, Chicago, IL 60657",
    plan: "Custodial services · 3x weekly",
    accessNotes: "Rear entrance, key card #14 · alarm code on file",
    preferences: "Green-certified products in treatment rooms · do not move items on front desk",
    clientSince: "2025-04-01",
  },
  visits: [
    { id: "v7", title: "Custodial service", status: "scheduled", startsAt: "2026-12-04T00:00:00Z", clockIn: null, clockOut: null, team: "Ana & Carlos", tasks: [], teamNote: null, photos: [] },
    { id: "v6", title: "Custodial service + hard floor care", status: "completed", startsAt: "2026-11-21T00:00:00Z", clockIn: "2026-11-21T00:04:00Z", clockOut: "2026-11-21T03:16:00Z", team: "Ana & Carlos",
      tasks: ["Lobby: glass doors and entry mats cleaned", "Reception desk and waiting area dusted and disinfected", "Restrooms: fixtures sanitized, supplies restocked", "Break room: counters, sink, microwave and fridge exterior cleaned", "Trash and recycling removed from all offices", "Hard floors: auto-scrubbed and burnished, lobby and hallway", "Carpets vacuumed, offices and conference room", "High-touch points disinfected (handles, switches, elevator buttons)", "Spot cleaning of interior glass partitions"],
      teamNote: "Paper towel dispenser in the 2nd floor men's restroom is broken. We left a refill on the counter. Recommend a replacement.",
      photos: photos(["Lobby", "Restrooms", "Break room"], 3) },
    { id: "v5", title: "Custodial service", status: "completed", startsAt: "2026-11-19T00:00:00Z", clockIn: "2026-11-19T00:01:00Z", clockOut: "2026-11-19T02:40:00Z", team: "Ana & Carlos",
      tasks: ["Restrooms sanitized and restocked", "Break room cleaned", "Trash and recycling removed", "Carpets vacuumed", "High-touch points disinfected"], teamNote: "All areas completed. No issues.", photos: photos(["Restrooms", "Break room"], 9) },
    { id: "v4", title: "Carpet extraction", status: "completed", startsAt: "2026-11-15T15:00:00Z", clockIn: "2026-11-15T15:05:00Z", clockOut: "2026-11-15T19:30:00Z", team: "Carlos & Juliana",
      tasks: ["Hot-water extraction, conference room and 6 offices", "Pre-treatment of stains at entrance", "Furniture moved and returned", "Air movers placed to speed drying"],
      teamNote: "Carpets will be fully dry in about 4 hours. Stain near the reception desk was reduced by about 90%.", photos: photos(["Lobby"], 15) },
  ],
  invoices: [
    { id: "i4", number: "1048", subject: "Custodial services · November", issuedAt: "2026-11-30", dueAt: "2026-12-15", total: 2340, balance: 2340, status: "awaiting_payment", paymentUrl: null },
    { id: "i3", number: "1044", subject: "Carpet extraction · Nov 15", issuedAt: "2026-11-15", dueAt: "2026-11-30", total: 680, balance: 0, status: "paid", paymentUrl: null },
    { id: "i2", number: "1031", subject: "Custodial services · October", issuedAt: "2026-10-31", dueAt: "2026-11-15", total: 2340, balance: 0, status: "paid", paymentUrl: null },
  ],
};
