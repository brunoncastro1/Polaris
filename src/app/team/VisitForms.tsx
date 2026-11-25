"use client";

import { useActionState, useState } from "react";
import { finishTeamVisit, startTeamVisit, uploadTeamPhoto } from "./actions";

type Site = { id: string; name: string; address: string | null };

export function StartVisit({ sites }: { sites: Site[] }) {
  const [state, action, pending] = useActionState(startTeamVisit, {});
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState("");
  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Location is unavailable. You can still start the visit.");
      return;
    }
    setLocationStatus("Getting location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocation(coords); setLocationStatus("Location captured."); },
      () => setLocationStatus("Location was unavailable. You can still start the visit."),
      { timeout: 8000 },
    );
  }
  if (!sites.length) return <p className="panel">No buildings are assigned to you yet.</p>;
  return (
    <form className="panel team-form" action={action}>
      <label>Building<select name="site" required defaultValue={sites.length === 1 ? sites[0].id : ""}>
        <option value="" disabled>Select a building</option>
        {sites.map((site) => <option key={site.id} value={site.id}>{site.name}{site.address ? ` · ${site.address}` : ""}</option>)}
      </select></label>
      <input type="hidden" name="latitude" value={location?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={location?.longitude ?? ""} />
      <button type="button" className="btn ghost" onClick={requestLocation}>Add arrival location (optional)</button>
      {locationStatus && <small role="status">{locationStatus}</small>}
      {state.error && <p role="alert">{state.error}</p>}
      <button className="btn primary" disabled={pending}>{pending ? "Starting…" : "Start visit"}</button>
    </form>
  );
}

async function preparePhoto(file: File) {
  const image = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Photo processing is unavailable");
    for (const side of [1600, 1200, 900]) {
      const scale = Math.min(1, side / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
      if (blob && blob.size <= 750_000) return blob;
    }
    throw new Error("Photo is too large");
  } finally {
    image.close();
  }
}

function PhotoInput({ visitId, kind, saved }: { visitId: string; kind: "before" | "after"; saved: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const title = kind === "before" ? "Before photo" : "After photo";
  return (
    <div className="team-photo">
      {saved ? <p>{title} saved ✓</p> : <label>{title}
        <input type="file" accept="image/*" capture="environment" disabled={busy} onChange={async (event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          if (!file) return;
          setBusy(true);
          setError("");
          try {
            const form = new FormData();
            form.set("photo", await preparePhoto(file), `${kind}.jpg`);
            const result = await uploadTeamPhoto(visitId, kind, form);
            setError(result.error ?? "");
          } catch {
            setError("Couldn't read or upload this photo. Retake it and try again.");
          } finally {
            input.value = "";
            setBusy(false);
          }
        }} />
      </label>}
      {busy && <small role="status">Saving photo…</small>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function ActiveVisit({ id, checklist, before, after }: { id: string; checklist: string[]; before: boolean; after: boolean }) {
  const [state, action, pending] = useActionState(finishTeamVisit, {});
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  return (
    <section className="panel team-form">
      <PhotoInput visitId={id} kind="before" saved={before} />
      <form className="team-form" action={action}>
        <input type="hidden" name="visit" value={id} />
        <fieldset><legend>Cleaning checklist</legend>
          {[...new Set(checklist)].map((task) => <label key={task} className="team-task">
            <input type="checkbox" name="task" value={task} checked={selected.includes(task)}
              onChange={(event) => setSelected(event.target.checked ? [...selected, task] : selected.filter((item) => item !== task))} />
            {task}
          </label>)}
        </fieldset>
        <PhotoInput visitId={id} kind="after" saved={after} />
        <label>Note for the client (optional)<textarea name="note" maxLength={1000} rows={3}
          value={note} onChange={(event) => setNote(event.target.value)} /></label>
        {state.error && <p role="alert">{state.error}</p>}
        {state.message && <p role="status">{state.message}</p>}
        <button className="btn primary" disabled={pending || !before || !after || !selected.length}>
          {pending ? "Finishing…" : "Finish visit"}
        </button>
      </form>
    </section>
  );
}
