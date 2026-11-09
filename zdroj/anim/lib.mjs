// Shared bits for the motion graphics: SVG frames rendered by sharp, encoded by ffmpeg (H.264).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
/** 0..1 progress of t inside [a, b]. */
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeOut = (k) => 1 - Math.pow(1 - k, 3);
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const easeOutBack = (k) => { const c = 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };

export const FONT = "Segoe UI, Helvetica Neue, Arial";
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
export const text = (x, y, s, { size = 30, color = "#F5F5F7", weight = 600, anchor = "start", opacity = 1, spacing = 0 } = {}) =>
	opacity <= 0.001 ? "" : `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" opacity="${opacity.toFixed(3)}" letter-spacing="${spacing}">${esc(s)}</text>`;

export const shade = (hex, f) => {
	const n = parseInt(hex.slice(1), 16);
	const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
	return `rgb(${c.join(",")})`;
};
export const pts = (a) => a.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");

/** Camera: azimuth a (rad), elevation e (rad), origin (ox, oy) on screen. x right, y depth, z up. */
export const cam = (a, e) => (ox, oy) => (x, y, z) => [ox + x * Math.cos(a) - y * Math.sin(a), oy + (x * Math.sin(a) + y * Math.cos(a)) * Math.sin(e) - z * Math.cos(e)];

/** Solid box with origin-centred footprint (side s), from z to z+h. Visible faces only. */
export function box(P, a, { cx = 0, cy = 0, s, z, h, color, opacity = 1, stroke = "rgba(255,255,255,0.28)" }) {
	if (opacity <= 0.001) return "";
	const r = s / 2;
	const c = (x, y, zz) => P(cx + x, cy + y, zz);
	const faces = [];
	const side = (nx, ny, quad, f) => { if (nx * Math.sin(a) + ny * Math.cos(a) > 0) faces.push([quad, f]); };
	side(1, 0, [c(r, -r, z), c(r, r, z), c(r, r, z + h), c(r, -r, z + h)], 0.78);
	side(-1, 0, [c(-r, -r, z), c(-r, r, z), c(-r, r, z + h), c(-r, -r, z + h)], 0.78);
	side(0, 1, [c(-r, r, z), c(r, r, z), c(r, r, z + h), c(-r, r, z + h)], 0.58);
	side(0, -1, [c(-r, -r, z), c(r, -r, z), c(r, -r, z + h), c(-r, -r, z + h)], 0.58);
	let svg = `<g opacity="${opacity.toFixed(3)}">`;
	for (const [q, f] of faces) svg += `<polygon points="${pts(q)}" fill="${shade(color, f)}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>`;
	svg += `<polygon points="${pts([c(-r, -r, z + h), c(r, -r, z + h), c(r, r, z + h), c(-r, r, z + h)])}" fill="${shade(color, 1.15)}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>`;
	return svg + "</g>";
}
/** Dashed capacity outline of a box. */
export function wire(P, { s, h, color, opacity = 1 }) {
	if (opacity <= 0.001) return "";
	const r = s / 2;
	const v = [[-r, -r], [r, -r], [r, r], [-r, r]];
	const st = `fill="none" stroke="${color}" stroke-width="2.2" stroke-dasharray="9 9" opacity="${(0.7 * opacity).toFixed(3)}"`;
	let svg = `<polygon points="${pts(v.map(([x, y]) => P(x, y, h)))}" ${st}/><polygon points="${pts(v.map(([x, y]) => P(x, y, 0)))}" ${st}/>`;
	for (const [x, y] of v) svg += `<line x1="${P(x, y, 0)[0].toFixed(1)}" y1="${P(x, y, 0)[1].toFixed(1)}" x2="${P(x, y, h)[0].toFixed(1)}" y2="${P(x, y, h)[1].toFixed(1)}" ${st}/>`;
	return svg;
}

/** Render frames (fn(t seconds) → svg string) and encode an MP4. Returns the output path. */
export async function render(name, { w, h, fps = 30, dur, frame, hold = 0, out = "img" }) {
	const dir = path.join("anim", "frames", name);
	fs.rmSync(dir, { recursive: true, force: true });
	fs.mkdirSync(dir, { recursive: true });
	const n = Math.round(dur * fps);
	const t0 = Date.now();
	for (let i = 0; i < n; i++) {
		const svg = frame(i / fps, i / n);
		await sharp(Buffer.from(svg)).png({ compressionLevel: 1 }).toFile(path.join(dir, `f${String(i).padStart(4, "0")}.png`));
		if (i === n - 1) fs.copyFileSync(path.join(dir, `f${String(i).padStart(4, "0")}.png`), path.join(out, `${name}-poster.png`));
		if (i === 0) fs.copyFileSync(path.join(dir, `f0000.png`), path.join(out, `${name}-first.png`));
	}
	const mp4 = path.join(out, `${name}.mp4`);
	const vf = hold > 0 ? ["-vf", `tpad=stop_mode=clone:stop_duration=${hold}`] : [];
	execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(fps), "-i", path.join(dir, "f%04d.png"), ...vf,
		"-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
	console.log(mp4, `${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s,`, (fs.statSync(mp4).size / 1e6).toFixed(1), "MB");
	return mp4;
}

/** Contact sheet of a few moments, for checking a motion graphic without encoding it. */
export async function preview(name, frame, times, { w, h }) {
	const cols = 3, tw = 640, th = Math.round((h / w) * tw);
	const tiles = await Promise.all(times.map(async (t) => sharp(Buffer.from(frame(t))).resize(tw, th).png().toBuffer()));
	const rows = Math.ceil(times.length / cols);
	await sharp({ create: { width: cols * tw, height: rows * th, channels: 3, background: "#222" } })
		.composite(tiles.map((input, i) => ({ input, left: (i % cols) * tw, top: Math.floor(i / cols) * th }))).png().toFile(`anim/${name}-preview.png`);
	console.log(`anim/${name}-preview.png`);
}
