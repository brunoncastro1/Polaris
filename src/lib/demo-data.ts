import type { PortalData, Photo } from "./types";
import { sceneUri } from "./demo-scenes";

const photos = (rooms: string[], seed: number): Photo[] =>
  rooms.flatMap((room, i) => [
    { kind: "before" as const, room, url: sceneUri(room, true, seed + i) },
    { kind: "after" as const, room, url: sceneUri(room, false) },
  ]);

export const demoData: PortalData = {
  client: {
    name: "Sarah Mitchell",
    email: "demo@polaris.example",
    phone: "(508) 555-0142",
    address: "84 Pleasant St, Framingham, MA 01701",
    plan: "Biweekly deep clean",
    accessNotes: "Lockbox at side door · code on file",
    preferences: "Unscented products in bedrooms · 1 friendly dog",
    clientSince: "2025-03-01",
  },
  visits: [
    { id: "v7", title: "Biweekly deep clean", status: "scheduled", startsAt: "2026-12-04T14:00:00Z", clockIn: null, clockOut: null, team: "Ana", tasks: [], teamNote: null, photos: [] },
    { id: "v6", title: "Biweekly deep clean", status: "completed", startsAt: "2026-11-20T14:00:00Z", clockIn: "2026-11-20T14:02:00Z", clockOut: "2026-11-20T17:14:00Z", team: "Ana",
      tasks: ["Kitchen: counters, backsplash, sink and faucet scrubbed", "Oven and microwave interior degreased", "Stovetop and range hood cleaned", "Bathroom: shower glass descaled, tub and tile scrubbed", "Toilet sanitized inside and out", "Floors vacuumed and mopped, all rooms", "Baseboards dusted, living room", "Beds made with fresh linens (2)", "Trash taken out, bins relined"],
      teamNote: "Range hood filter is wearing out. We recommend replacing it soon. Left your mail on the kitchen table.",
      photos: photos(["Kitchen", "Bathroom", "Living room"], 3) },
    { id: "v5", title: "Biweekly deep clean", status: "completed", startsAt: "2026-11-06T14:00:00Z", clockIn: "2026-11-06T14:00:00Z", clockOut: "2026-11-06T16:48:00Z", team: "Ana",
      tasks: ["Kitchen counters and sink", "Bathroom full clean", "Floors vacuumed and mopped", "Dusting, all rooms", "Trash out"], teamNote: "All good. Your dog was happy to see us.", photos: photos(["Kitchen", "Bathroom"], 9) },
    { id: "v4", title: "Deep clean + fridge", status: "completed", startsAt: "2026-10-23T13:00:00Z", clockIn: "2026-10-23T13:10:00Z", clockOut: "2026-10-23T16:30:00Z", team: "Ana",
      tasks: ["Refrigerator emptied, shelves washed (add-on)", "Kitchen counters and sink", "Bathroom full clean", "Floors vacuumed and mopped", "Windowsills wiped"],
      teamNote: "Expired items from the fridge are in a bag by the door for you to check.", photos: photos(["Kitchen", "Living room"], 15) },
  ],
  invoices: [
    { id: "i4", number: "1048", subject: "Deep clean · Nov 20", issuedAt: "2026-11-20", dueAt: "2026-12-04", total: 185, balance: 185, status: "awaiting_payment", paymentUrl: null },
    { id: "i3", number: "1041", subject: "Deep clean · Nov 6", issuedAt: "2026-11-06", dueAt: "2026-11-20", total: 185, balance: 0, status: "paid", paymentUrl: null },
    { id: "i2", number: "1033", subject: "Deep clean + fridge · Oct 23", issuedAt: "2026-10-23", dueAt: "2026-11-06", total: 230, balance: 0, status: "paid", paymentUrl: null },
  ],
};
