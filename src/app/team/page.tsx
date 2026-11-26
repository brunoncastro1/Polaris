import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import { fmtTime } from "@/lib/format";
import { teamMember } from "@/lib/team";
import { signOut } from "../login/actions";
import { ActiveVisit, StartVisit } from "./VisitForms";

// Always render per request: the page depends on who is signed in.
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const member = await teamMember();
  if (!member) redirect("/login");

  const [{ data: assignments, error: assignmentsError }, { data: draft, error: draftError }] = await Promise.all([
    member.db.from("team_assignments").select("team_sites(id, name, address)").eq("user_id", member.id),
    member.db.from("team_visits").select("id, site_id, checklist, clock_in").eq("user_id", member.id)
      .is("published_visit_id", null).maybeSingle(),
  ]);
  const sites = (assignments ?? []).flatMap((row) => {
    const site = row.team_sites as unknown as { id: string; name: string; address: string | null } | null;
    return site ? [site] : [];
  });
  const site = sites.find((item) => item.id === draft?.site_id);
  const photos = draft && site ? await member.db.storage.from("visit-photos").list(`team/${draft.id}`) : null;
  const { data: lastVisit } = !draft ? await member.db.from("team_visits")
    .select("visits(clock_out, email_sent_at)").eq("user_id", member.id).not("published_visit_id", "is", null)
    .order("clock_in", { ascending: false }).limit(1).maybeSingle() : { data: null };
  const published = lastVisit?.visits as unknown as { clock_out: string; email_sent_at: string | null } | null;

  return <>
    <header className="top"><div className="wrap">
      <Logo /><form action={signOut}><button className="btn ghost">Log out</button></form>
    </div></header>
    <main className="wrap team-page">
      <h1>Team visits</h1>
      <p className="sub">{member.name}</p>
      {assignmentsError || draftError || photos?.error ? <p role="alert">Couldn't load your visit. Refresh to try again.</p>
        : draft ? site ? <>
          <h2>{site.name}</h2><p>Started at {fmtTime(draft.clock_in)}</p>
          <ActiveVisit key={draft.id} id={draft.id} checklist={draft.checklist}
            photos={photos?.data?.map((photo) => photo.name) ?? []} />
        </> : <p role="alert">Ask your administrator to restore the building assignment to finish this visit.</p>
        : <>
          {published && <p role="status">Last visit published at {fmtTime(published.clock_out)}.
            {published.email_sent_at ? " Email sent." : " Email pending."}</p>}
          <StartVisit sites={sites} />
        </>}
    </main>
  </>;
}
