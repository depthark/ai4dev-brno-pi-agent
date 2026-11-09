// Mixture of Experts, animated: for every token the router lights 8 of 256 experts in each layer.
// 3D stack of layer grids on the right, the sentence being written underneath. 10 s seamless loop,
// baked three times (Keynote may not loop an imported movie). Writes img/moe.mp4.
import { render, preview, cam, text, pts, seg, easeOut, clamp } from "./lib.mjs";

const W = 1920, H = 1080, LOOP = 10;
const N = 16, CELL = 20, GAPC = 5, PITCH = CELL + GAPC, HALF = (N * PITCH) / 2;
const PLANES = [{ z: 0, label: "layer 40" }, { z: 120, label: "…" }, { z: 240, label: "layer 3" }, { z: 360, label: "layer 2" }, { z: 480, label: "layer 1" }];
const TOKENS = ["GLaDOS", " writes", " code", ",", " runs", " on", " a", " gaming", " PC", "."];
const TOK = LOOP / TOKENS.length;

// deterministic "router": 8 distinct experts per (token, layer)
let seed = 7;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const picks = TOKENS.map(() => PLANES.map(() => { const s = new Set(); while (s.size < 8) s.add(Math.floor(rnd() * 256)); return s; }));

function frame(time) {
	const t = time % LOOP;
	const ti = Math.floor(t / TOK), local = (t - ti * TOK) / TOK;
	const a = ((45 + 6 * Math.sin((2 * Math.PI * time) / LOOP)) * Math.PI) / 180, e = (31 * Math.PI) / 180;
	const P = cam(a, e)(1360, 880);
	const glowK = local < 0.15 ? easeOut(local / 0.15) : 1 - seg(local, 0.7, 1) * 0.85;
	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<radialGradient id="bg" cx="0.7" cy="0.55" r="0.6"><stop offset="0" stop-color="#1A1206"/><stop offset="0.75" stop-color="#030303"/><stop offset="1" stop-color="#000"/></radialGradient>
<radialGradient id="hot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="rgba(255,210,120,0.95)"/><stop offset="0.4" stop-color="rgba(255,159,10,0.45)"/><stop offset="1" stop-color="rgba(255,120,0,0)"/></radialGradient>
</defs><rect width="${W}" height="${H}" fill="url(#bg)"/>`;
	let lines = "";
	PLANES.forEach((pl, li) => {
		const lit = picks[ti][li];
		const depth = 0.45 + 0.55 * (li / (PLANES.length - 1));
		// plate under the grid
		const c = (x, y) => P(x, y, pl.z);
		svg += `<polygon points="${pts([c(-HALF - 14, -HALF - 14), c(HALF + 14, -HALF - 14), c(HALF + 14, HALF + 14), c(-HALF - 14, HALF + 14)])}" fill="rgba(255,255,255,${(0.035 * depth).toFixed(3)})" stroke="rgba(255,255,255,${(0.16 * depth).toFixed(3)})" stroke-width="1.5"/>`;
		let hot = "";
		for (let i = 0; i < 256; i++) {
			const gx = i % N, gy = Math.floor(i / N);
			const x0 = -HALF + gx * PITCH + GAPC / 2, y0 = -HALF + gy * PITCH + GAPC / 2;
			const q = [c(x0, y0), c(x0 + CELL, y0), c(x0 + CELL, y0 + CELL), c(x0, y0 + CELL)];
			if (lit.has(i)) {
				const k = glowK;
				hot += `<polygon points="${pts(q)}" fill="rgb(255,${Math.round(140 + 60 * k)},${Math.round(10 + 80 * k)})" opacity="${(0.35 + 0.65 * k * depth).toFixed(3)}"/>`;
				const [mx, my] = c(x0 + CELL / 2, y0 + CELL / 2);
				hot += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="${(26 * k + 6).toFixed(1)}" fill="url(#hot)" opacity="${(k * depth).toFixed(3)}"/>`;
				if (li === PLANES.length - 1) lines += `<line x1="1360" y1="150" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="rgba(255,180,60,${(0.55 * k).toFixed(3)})" stroke-width="1.6"/>`;
			} else svg += `<polygon points="${pts(q)}" fill="rgba(70,72,84,${(0.55 * depth).toFixed(3)})"/>`;
		}
		svg += hot;
		const [lx, ly] = c(HALF + 30, -HALF);
		svg += text(lx + 18, ly + 8, pl.label, { size: 22, color: "#8E8E93", weight: 600, opacity: depth });
	});
	// router node at the top and the beams to the first layer
	svg += lines;
	svg += `<circle cx="1360" cy="150" r="${(14 + 6 * glowK).toFixed(1)}" fill="url(#hot)"/><circle cx="1360" cy="150" r="7" fill="#FFF4D6"/>`;
	svg += text(1360, 106, "router picks 8 of 256", { size: 26, weight: 700, anchor: "middle", color: "#FFD08A" });

	// the sentence, token by token
	let x = 110;
	const y = 1000;
	const fadeAll = 1 - seg(t, LOOP - 0.35, LOOP);
	TOKENS.forEach((tok, i) => {
		if (i > ti) return;
		const lead = tok.startsWith(" ") ? 12 : 0, word = tok.trim(), w = word.length * 17.5 + 4;
		x += lead;
		const cur = i === ti;
		const k = cur ? easeOut(clamp(local / 0.2)) : 1;
		if (cur) svg += `<rect x="${x - 4}" y="${y - 34}" width="${w + 8}" height="46" rx="10" fill="rgba(255,159,10,${(0.28 * k).toFixed(3)})" stroke="rgba(255,159,10,${(0.8 * k).toFixed(3)})" stroke-width="1.5"/>`;
		svg += `<text x="${x}" y="${y}" font-family="Segoe UI, Helvetica Neue, Arial" font-size="32" font-weight="${cur ? 700 : 500}" fill="${cur ? "#FFFFFF" : "#A1A1A6"}" opacity="${(k * fadeAll).toFixed(3)}" >${word}</text>`;
		x += w;
	});
	return svg + "</svg>";
}

if (process.env.PREVIEW) await preview("moe", frame, [0.1, 0.3, 0.9, 3.2, 5.5, 9.6], { w: W, h: H });
else await render("moe", { w: W, h: H, dur: LOOP * 3, frame });
