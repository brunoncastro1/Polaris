"use server";

import { revalidatePath } from "next/cache";
import { sendVisitEmail } from "@/lib/email";
import { teamMember } from "@/lib/team";

export type VisitState = { error?: string; message?: string };
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export async function startTeamVisit(_: VisitState, form: FormData): Promise<VisitState> {
  const member = await teamMember();
  const siteId = String(form.get("site") ?? "");
  if (!member || !uuid.test(siteId)) return { error: "Choose an assigned building." };

  const { data: assignment } = await member.db.from("team_assignments")
    .select("site_id, team_sites(checklist)").eq("user_id", member.id).eq("site_id", siteId).maybeSingle();
  const site = assignment?.team_sites as unknown as { checklist: string[] } | null;
  if (!site) return { error: "Choose an assigned building." };

  const rawLatitude = form.get("latitude");
  const rawLongitude = form.get("longitude");
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);
  const hasLocation = Boolean(rawLatitude && rawLongitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  const { error } = await member.db.from("team_visits").insert({
    user_id: member.id, site_id: siteId, checklist: site.checklist,
    latitude: hasLocation ? latitude : null, longitude: hasLocation ? longitude : null,
  });
  if (error && error.code !== "23505") return { error: "Couldn't start the visit. Please try again." };
  revalidatePath("/team");
  return {};
}

export async function uploadTeamPhoto(visitId: string, kind: "before" | "after", form: FormData): Promise<VisitState> {
  const member = await teamMember();
  const file = form.get("photo");
  if (!member || !uuid.test(visitId) || (kind !== "before" && kind !== "after")) return { error: "Visit unavailable." };
  if (!(file instanceof File) || file.size < 4 || file.size > 750_000 || file.type !== "image/jpeg") {
    return { error: "Choose a JPEG photo under 750 KB." };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return { error: "Choose a valid JPEG photo." };

  const { data: draft } = await member.db.from("team_visits").select("site_id").eq("id", visitId)
    .eq("user_id", member.id).is("published_visit_id", null).maybeSingle();
  if (!draft) return { error: "Visit unavailable." };
  const { data: assignment } = await member.db.from("team_assignments").select("site_id")
    .eq("user_id", member.id).eq("site_id", draft.site_id).maybeSingle();
  if (!assignment) return { error: "Visit unavailable." };

  const { error } = await member.db.storage.from("visit-photos").upload(`team/${visitId}/${kind}.jpg`, bytes, {
    contentType: "image/jpeg", upsert: false,
  });
  if (error) {
    const { data: existing } = await member.db.storage.from("visit-photos").exists(`team/${visitId}/${kind}.jpg`);
    if (!existing) return { error: "Couldn't save the photo. Please try again." };
  }
  revalidatePath("/team");
  return {};
}

export async function finishTeamVisit(_: VisitState, form: FormData): Promise<VisitState> {
  const member = await teamMember();
  const id = String(form.get("visit") ?? "");
  if (!member || !uuid.test(id)) return { error: "Visit unavailable." };
  const tasks = form.getAll("task").map(String);
  const note = String(form.get("note") ?? "").trim();
  if (!tasks.length || note.length > 1000) return { error: "Check at least one item and keep the note under 1,000 characters." };

  const { data: visitId, error } = await member.db.rpc("publish_team_visit", {
    p_user: member.id, p_draft: id, p_tasks: tasks, p_note: note,
  });
  if (error || !visitId) return { error: "Couldn't finish the visit. Confirm both photos are saved and try again." };

  revalidatePath("/team");
  revalidatePath("/portal", "layout");
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return { message: "Visit published. Email is not configured." };
  try {
    const result = await sendVisitEmail(visitId);
    return { message: result.sent ? "Visit published and email sent." : "Visit published. No new email was sent." };
  } catch {
    console.error("Team visit email failed", visitId);
    return { message: "Visit published. Email could not be sent. An administrator can retry." };
  }
}
