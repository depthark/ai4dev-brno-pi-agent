// Animated 3D memory map: the Qwen 3.6 GGUF splits, attention goes to the GPU, experts to RAM,
// buffers stack up, the hot-expert cache flies over PCIe. Numbers from llama.cpp's buffer report
// (2026-11-02). Writes img/memory.mp4 (+ poster). Run from the keynote folder: node anim/memory.mjs
import { render, preview, cam, box, wire, text, seg, lerp, easeOut, easeInOut, easeOutBack, clamp } from "./lib.mjs";

const W = 1920, H = 1080, DUR = 12.5;
const S = 230, TALL = 520;
const gpuScale = TALL / 12282, ramScale = TALL / 49094;
const GPU = [960 - 330, 850], RAM = [960 + 330, 850], MID = [960, 760];

// stack order bottom-up; t = when it appears (s)
const gpu = [
	{ id: "attn", name: "Attention + shared weights", note: "2,426 MiB · all 40 layers", mib: 2426, color: "#0A84FF", t: 4.6 },
	{ id: "kv", name: "KV cache + linear state", note: "680 + 188 MiB · 64k context, q8_0", mib: 868, color: "#64D2FF", t: 4.9 },
	{ id: "mtp", name: "MTP draft head", note: "344 MiB · drafts 2 tokens ahead", mib: 344, color: "#BF5AF2", t: 5.3 },
	{ id: "cmp", name: "Compute buffer", note: "738 MiB", mib: 738, color: "#5E6A8A", t: 5.7 },
	{ id: "win", name: "Windows + desktop", note: "~775 MiB", mib: 775, color: "#3A3A3C", t: 6.1 },
	{ id: "hot", name: "Hot expert cache", note: "6,399 MiB · ~34 % of experts", mib: 6399, color: "#FF9F0A", t: 9.0 },
];
const ram = [
	{ id: "exp", name: "All Qwen experts", note: "18.7 GB · 256 × 40 layers, mmap", mib: 18662, color: "#D9480F", t: 4.6 },
	{ id: "vl", name: "LFM3-VL-2B · vision", note: "1.9 GB · CPU", mib: 1900, color: "#30D158", t: 5.2 },
	{ id: "d1", name: "d1-2B · decisions", note: "1.0 GB · CPU", mib: 1000, color: "#FFD60A", t: 5.6 },
	{ id: "os", name: "Windows and apps", note: "~4.6 GB", mib: 4600, color: "#3A3A3C", t: 6.0 },
];
const GAP = 4;
const stackZ = (list, scale) => { let z = 0; return list.map((L) => { const r = z; z += L.mib * scale + GAP; return r; }); };
const gz = stackZ(gpu, gpuScale), rz = stackZ(ram, ramScale);

const fmt = (n) => Math.round(n).toLocaleString("en-US");

function frame(t) {
	const a = ((30 + 12 * easeInOut(clamp(t / DUR))) * Math.PI) / 180, e = (27 * Math.PI) / 180;
	const C = cam(a, e);
	const Pg = C(...GPU), Pr = C(...RAM);
	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<radialGradient id="bg" cx="0.5" cy="0.55" r="0.62"><stop offset="0" stop-color="#0D1430"/><stop offset="0.7" stop-color="#03040A"/><stop offset="1" stop-color="#000"/></radialGradient>
<radialGradient id="gb" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="rgba(10,132,255,0.45)"/><stop offset="1" stop-color="rgba(10,132,255,0)"/></radialGradient>
<radialGradient id="go" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="rgba(255,120,20,0.38)"/><stop offset="1" stop-color="rgba(255,120,20,0)"/></radialGradient>
<radialGradient id="dot" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF4D6"/><stop offset="0.35" stop-color="rgba(255,170,40,0.9)"/><stop offset="1" stop-color="rgba(255,140,20,0)"/></radialGradient>
<linearGradient id="pcie" x1="1" x2="0"><stop offset="0" stop-color="#D9480F"/><stop offset="1" stop-color="#0A84FF"/></linearGradient>
</defs><rect width="${W}" height="${H}" fill="url(#bg)"/>`;

	// tower stage: glow, capacity outline, titles
	const stage = easeOut(seg(t, 2.4, 3.2));
	svg += `<ellipse cx="${GPU[0]}" cy="${GPU[1] + 30}" rx="300" ry="95" fill="url(#gb)" opacity="${stage}"/>`;
	svg += `<ellipse cx="${RAM[0]}" cy="${RAM[1] + 30}" rx="300" ry="95" fill="url(#go)" opacity="${stage}"/>`;
	svg += wire(Pg, { s: S + 16, h: TALL + 6 * GAP, color: "#0A84FF", opacity: stage });
	svg += wire(Pr, { s: S + 16, h: TALL + 4 * GAP, color: "#FF9F0A", opacity: stage });

	// the GGUF file in the middle, then its two parts fly to their towers
	const appear = easeOut(seg(t, 0.1, 1.1));
	const split = easeInOut(seg(t, 1.2, 2.2));
	const fly = easeInOut(seg(t, 3.0, 4.6));
	const flyPart = (P0list, target, scaleTo, zBase, mib, color, liftSplit) => {
		const h = mib * lerp(ramScale, scaleTo, fly);
		const ox = lerp(MID[0], target[0], fly), oy = lerp(MID[1] - 40 * (1 - appear), target[1], fly);
		const arc = Math.sin(Math.PI * fly) * 160;
		const z = lerp(zBase + liftSplit * split * 60, 0, fly) + arc;
		return box(C(ox, oy), a, { s: S, z, h, color, opacity: appear });
	};
	const landed = t >= 4.6;
	if (!landed) {
		svg += flyPart(null, RAM, ramScale, 0, 18662, "#D9480F", 0);
		svg += flyPart(null, GPU, gpuScale, 18662 * ramScale + GAP, 2426, "#0A84FF", 1);
		// labels next to the file
		const lo = appear * (1 - seg(t, 2.6, 3.0));
		svg += text(MID[0], 390, "Qwen 3.6 35B-A3B  ·  21.1 GiB", { size: 40, weight: 700, anchor: "middle", opacity: lo });
		svg += text(MID[0], 435, "one GGUF file, Q4_K_M", { size: 26, color: "#A1A1A6", weight: 500, anchor: "middle", opacity: lo });
		const so = split * (1 - seg(t, 2.6, 3.0));
		svg += text(MID[0] + 250, 545, "attention + shared: 2.4 GB", { size: 28, weight: 700, color: "#64A8FF", opacity: so });
		svg += text(MID[0] + 250, 690, "experts: 18.7 GB", { size: 28, weight: 700, color: "#FF8A3D", opacity: so });
		svg += text(MID[0] + 250, 725, "only 8 of 256 in use", { size: 22, weight: 500, color: "#A1A1A6", opacity: so });
	}

	// stacks
	const legend = (L, y, P, side, zMid, k) => {
		if (k <= 0) return "";
		const r = S / 2;
		const [axp, ayp] = side === "left" ? P(0, r, zMid) : P(r, 0, zMid);
		const ex = side === "left" ? 430 : W - 430;
		const tx = side === "left" ? 70 : W - 70;
		const anchor = side === "left" ? "start" : "end";
		let s = `<g opacity="${k.toFixed(3)}"><path d="M${axp.toFixed(1)},${ayp.toFixed(1)} L${ex},${y - 9}" stroke="${L.color === "#3A3A3C" ? "#6E6E73" : L.color}" stroke-width="2" fill="none" opacity="0.8"/>`;
		s += `<circle cx="${axp.toFixed(1)}" cy="${ayp.toFixed(1)}" r="6" fill="${L.color === "#3A3A3C" ? "#6E6E73" : L.color}" stroke="#000" stroke-width="3"/></g>`;
		s += text(tx, y - 14, L.name, { size: 27, weight: 700, anchor, opacity: k });
		s += text(tx, y + 18, L.note, { size: 21, color: "#A1A1A6", weight: 500, anchor, opacity: k });
		return s;
	};
	const drawStack = (list, zs, P, scale, side) => {
		let s = "", leg = "";
		// legend rows sit next to their layer, pushed apart so they never overlap (top of the stack first)
		const r0 = S / 2;
		const want = list.map((L, i) => (side === "left" ? P(0, r0, zs[i] + (L.mib * scale) / 2) : P(r0, 0, zs[i] + (L.mib * scale) / 2))[1]);
		const ys = [], idx = [...list.keys()].sort((x, y) => want[x] - want[y]);
		let prev = -1e9;
		for (const i of idx) { ys[i] = Math.max(want[i], prev + 74); prev = ys[i]; }
		const over = prev - 880;
		if (over > 0) for (const i of idx) ys[i] -= over;
		list.forEach((L, i) => {
			if (L.id === "attn" || L.id === "exp") { if (!landed) return; }
			let k;
			if (L.id === "hot") k = t >= 9.0 ? 1 : 0;
			else if (L.id === "attn" || L.id === "exp") k = 1;
			else k = easeOutBack(seg(t, L.t, L.t + 0.55));
			if (k <= 0) return;
			const hFull = L.mib * scale;
			const h = Math.max(1, hFull * (L.id === "attn" || L.id === "exp" || L.id === "hot" ? 1 : clamp(k, 0, 1.08)));
			const drop = L.id === "attn" || L.id === "exp" || L.id === "hot" ? 0 : (1 - clamp(k)) * 90;
			s += box(P, a, { s: S, z: zs[i] + drop, h, color: L.color, opacity: clamp(k * 1.5) });
			const lk = L.id === "hot" ? easeOut(seg(t, 9.0, 9.5)) : easeOut(seg(t, L.t + 0.15, L.t + 0.7));
			leg += legend(L, ys[i] + 9, P, side, zs[i] + hFull / 2, lk);
		});
		return s + leg;
	};
	svg += drawStack(gpu, gz, Pg, gpuScale, "left");
	svg += drawStack(ram, rz, Pr, ramScale, "right");

	// PCIe link + streaming experts (RAM → GPU)
	const link = easeOut(seg(t, 6.4, 7.0));
	const r = S / 2;
	const A = Pr(-r, 0, rz[0] + 18662 * ramScale * 0.8), B = Pg(r, 0, gz[5] + 120);
	const ctl = [(A[0] + B[0]) / 2, Math.min(A[1], B[1]) - 230];
	const q = (k) => [(1 - k) ** 2 * A[0] + 2 * (1 - k) * k * ctl[0] + k * k * B[0], (1 - k) ** 2 * A[1] + 2 * (1 - k) * k * ctl[1] + k * k * B[1]];
	if (link > 0) {
		svg += `<path d="M${A[0].toFixed(1)},${A[1].toFixed(1)} Q${ctl[0].toFixed(1)},${ctl[1].toFixed(1)} ${B[0].toFixed(1)},${B[1].toFixed(1)}" stroke="url(#pcie)" stroke-width="5" fill="none" stroke-linecap="round" opacity="${(0.55 * link).toFixed(3)}" stroke-dasharray="2 14"/>`;
		for (let i = 0; i < 9; i++) {
			const k = ((t - 6.4) * 0.42 + i / 9) % 1;
			const [px, py] = q(k);
			const o = link * Math.sin(Math.PI * k);
			svg += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(10 + 6 * Math.sin(Math.PI * k)).toFixed(1)}" fill="url(#dot)" opacity="${o.toFixed(3)}"/>`;
		}
		const top = q(0.5);
		svg += text(top[0], top[1] - 30, "PCIe 3.0 x16", { size: 28, weight: 800, anchor: "middle", opacity: link });
		svg += text(top[0], top[1] + 4, "cold experts on demand", { size: 21, color: "#A1A1A6", weight: 500, anchor: "middle", opacity: link });
	}
	// the hot-expert copy travelling over the link
	const hc = easeInOut(seg(t, 7.0, 9.0));
	if (hc > 0 && hc < 1) {
		const [px, py] = q(hc);
		const h = 6399 * lerp(ramScale, gpuScale, hc);
		const P = C(px, py + 60);
		svg += box(P, a, { s: lerp(S * 0.5, S, hc), z: -h / 2, h, color: "#FF9F0A", opacity: 0.95 });
	}

	// titles and counters under the towers
	const used = (list, zs, t) => list.reduce((s, L) => s + (t >= L.t + 0.3 ? L.mib : 0), 0);
	const cnt = easeOut(seg(t, 9.2, 11.0));
	const gUsed = Math.min(used(gpu, gz, t), lerp(used(gpu.slice(0, 5), gz, t), 11549, cnt));
	const rUsed = used(ram, rz, t);
	svg += text(GPU[0], 965, "RTX 4070 · 12 GB VRAM", { size: 34, weight: 800, anchor: "middle", opacity: stage });
	svg += text(GPU[0], 1008, `used ${fmt(t >= 9.2 ? lerp(gpu.slice(0, 5).reduce((s, L) => s + L.mib, 0), 11549, cnt) : gUsed)} / 12,282 MiB`, { size: 24, color: "#A1A1A6", weight: 500, anchor: "middle", opacity: stage });
	svg += text(RAM[0], 965, "RAM · 48 GB DDR4", { size: 34, weight: 800, anchor: "middle", opacity: stage });
	svg += text(RAM[0], 1008, `used ~${(rUsed / 1024).toFixed(0)} / 48 GB`, { size: 24, color: "#A1A1A6", weight: 500, anchor: "middle", opacity: stage });
	return svg + "</svg>";
}

if (process.env.PREVIEW) await preview("memory", frame, [0.8, 2.0, 3.8, 5.0, 6.5, 8.0, 9.5, 11, 12.4], { w: W, h: H });
else await render("memory", { w: W, h: H, dur: DUR, frame });
