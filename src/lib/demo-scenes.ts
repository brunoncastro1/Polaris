// Illustrated stand-ins for real photos, used only in demo mode.
const palettes: Record<string, [string, string, string]> = {
  "Break room": ["#d9cbb4", "#a87b52", "#e9e3d6"],
  Restrooms: ["#cfe0e6", "#7aa0ad", "#f2f5f6"],
  Lobby: ["#dcd6cf", "#6b6f78", "#b9b2a8"],
};

export function sceneUri(room: string, dirty: boolean, seed = 1): string {
  const [wall, wood, floor] = palettes[room] ?? palettes["Break room"];
  let s = `<rect width="400" height="300" fill="${wall}"/><rect y="215" width="400" height="85" fill="${floor}"/>`;
  s += `<rect x="250" y="40" width="110" height="80" fill="#bfe0f2" stroke="#fff" stroke-width="6"/><line x1="305" y1="40" x2="305" y2="120" stroke="#fff" stroke-width="4"/>`;
  if (room === "Break room") s += `<rect x="20" y="150" width="210" height="70" fill="${wood}"/><rect x="20" y="140" width="210" height="12" fill="#eee"/><rect x="40" y="60" width="160" height="50" fill="${wood}" opacity=".85"/>`;
  else if (room === "Restrooms") s += `<rect x="20" y="170" width="200" height="50" rx="20" fill="#fff" stroke="#bcd"/><rect x="240" y="150" width="60" height="70" rx="8" fill="#fff" stroke="#bcd"/><rect x="40" y="50" width="120" height="90" fill="#e6f0f3" stroke="#fff" stroke-width="4"/>`;
  else s += `<rect x="30" y="150" width="200" height="60" rx="10" fill="#5c7d8a"/><rect x="30" y="130" width="200" height="35" rx="10" fill="#6d8f9c"/><rect x="260" y="180" width="80" height="35" fill="${wood}"/><rect x="60" y="50" width="100" height="65" fill="#e8c27a" stroke="#fff" stroke-width="5"/>`;
  if (dirty) {
    let r = seed * 9301;
    const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 14; i++) s += `<ellipse cx="${rnd() * 400}" cy="${150 + rnd() * 150}" rx="${6 + rnd() * 18}" ry="${3 + rnd() * 7}" fill="#6b5233" opacity="${0.25 + rnd() * 0.3}"/>`;
    for (let i = 0; i < 8; i++) s += `<rect x="${rnd() * 380}" y="${200 + rnd() * 80}" width="${10 + rnd() * 14}" height="${6 + rnd() * 8}" fill="${["#c44", "#448", "#aa6", "#777"][i % 4]}" opacity=".8"/>`;
    s += `<rect width="400" height="300" fill="#5a4a2a" opacity=".18"/>`;
  } else {
    const star = (x: number, y: number, k: number) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0-10L2-2 10 0 2 2 0 10-2 2-10 0-2-2z" fill="#fff"/>`;
    s += star(90, 140, 1.1) + star(300, 70, 0.9) + star(200, 240, 1.2) + star(330, 200, 0.7);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">${s}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
