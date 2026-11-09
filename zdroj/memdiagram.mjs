// Isometric 3D map of where Qwen3.6 and the small models live, from llama.cpp's own buffer
// report (qwen-load.log, 2026-11-02) and WattLlama's /api/live. Writes img/memmap.png.
import fs from "node:fs";
import sharp from "sharp";

const W = 2400, H = 1350;
const COS = Math.cos(Math.PI / 6), SIN = Math.sin(Math.PI / 6);
const P = (ox, oy) => (x, y, z) => [ox + (x - y) * COS, oy + (x + y) * SIN - z];

const shade = (hex, f) => {
	const n = parseInt(hex.slice(1), 16);
	const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
	return `rgb(${c.join(",")})`;
};
const pts = (a) => a.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ");
const text = (x, y, s, { size = 30, color = "#F4F6FB", weight = 600, anchor = "start" } = {}) =>
	`<text x="${x}" y="${y}" font-family="Segoe UI, Arial" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${s}</text>`;

function box(p, z, s, h, color, wire = false) {
	const a = p(0, 0, z + h), b = p(s, 0, z + h), c = p(s, s, z + h), e = p(0, s, z + h);
	const b0 = p(s, 0, z), c0 = p(s, s, z), e0 = p(0, s, z);
	if (wire) {
		const st = `fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="10 10" opacity="0.75"`;
		return `<polygon points="${pts([a, b, c, e])}" ${st}/><polygon points="${pts([e, c, c0, e0])}" ${st}/><polygon points="${pts([c, b, b0, c0])}" ${st}/>`;
	}
	const st = `stroke="rgba(255,255,255,0.22)" stroke-width="1.5"`;
	return `<polygon points="${pts([e, c, c0, e0])}" fill="${shade(color, 0.6)}" ${st}/>` +
		`<polygon points="${pts([c, b, b0, c0])}" fill="${shade(color, 0.85)}" ${st}/>` +
		`<polygon points="${pts([a, b, c, e])}" fill="${shade(color, 1.12)}" ${st}/>`;
}

/** Layers bottom-up; legend on `side` ("left" | "right") at legend x; returns svg. */
function tower(p, layers, { size, scale, total, frame, side, lx, title, sub, cx }) {
	let z = 0, svg = "", anchors = [];
	for (const L of layers) {
		const h = Math.max(L.mib * scale, 6);
		svg += box(p, z, size, h, L.color);
		anchors.push(side === "left" ? p(0, size, z + h / 2) : p(size, 0, z + h / 2));
		z += h + 5;
	}
	svg += box(p, 0, size, total * scale + 5 * layers.length, frame, true);
	// legend, top layer first
	const n = layers.length, gap = 100, top = 560 - ((n - 1) * gap) / 2;
	layers.map((L, i) => ({ L, a: anchors[i] })).reverse().forEach(({ L, a }, k) => {
		const y = top + k * gap;
		const edge = side === "left" ? lx + 470 : lx - 30;
		svg += `<path d="M${a[0]},${a[1]} L${edge},${y - 10}" stroke="${L.color}" stroke-width="2.5" fill="none" opacity="0.85"/>`;
		svg += `<circle cx="${a[0]}" cy="${a[1]}" r="7" fill="${L.color}" stroke="#07081A" stroke-width="3"/>`;
		const anchor = side === "left" ? "end" : "start";
		const tx = side === "left" ? lx + 450 : lx;
		svg += text(tx, y - 14, L.name, { size: 30, weight: 700, anchor });
		svg += text(tx, y + 22, L.note, { size: 24, color: "#AAB3D0", weight: 500, anchor });
	});
	svg += text(cx, 1225, title, { size: 40, weight: 800, anchor: "middle" });
	svg += text(cx, 1275, sub, { size: 28, color: "#AAB3D0", weight: 500, anchor: "middle" });
	return svg;
}

const vram = [
	{ name: "Attention + zdieľané váhy", note: "2 426 MiB · 40 vrstiev", mib: 2426, color: "#4F63FF" },
	{ name: "KV cache + lineárny stav", note: "680 + 188 MiB · 64k, q8_0", mib: 868, color: "#22C7E8" },
	{ name: "MTP draft hlava", note: "344 MiB · hádže 2 tokeny dopredu", mib: 344, color: "#B16CFF" },
	{ name: "Cache horúcich expertov", note: "6 399 MiB · ~34 % expertov", mib: 6399, color: "#FF7A2F" },
	{ name: "Výpočtový buffer", note: "738 MiB", mib: 738, color: "#8A97C8" },
	{ name: "Windows + plocha", note: "~775 MiB", mib: 775, color: "#4A5378" },
];
const ram = [
	{ name: "Všetci experti Qwenu", note: "18,7 GB · 256 × 40 vrstiev, mmap", mib: 18662, color: "#C2561F" },
	{ name: "LFM3-VL-2B · zrak", note: "1,9 GB · CPU, 4 vlákna", mib: 1900, color: "#2FD39A" },
	{ name: "d1-2B · rozhodnutia", note: "1,0 GB · CPU, 4 vlákna", mib: 1000, color: "#F5C542" },
	{ name: "Windows a aplikácie", note: "~4,6 GB", mib: 4600, color: "#4A5378" },
];

const S = 300, gpuX = 790, ramX = 1610, baseY = 880;
const gp = P(gpuX, baseY), rp = P(ramX, baseY);
const [ax, ay] = gp(S, 0, 470), [bx, by] = rp(0, S, 200);

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><radialGradient id="bg" cx="0.5" cy="0.4" r="0.75"><stop offset="0" stop-color="#1C2156"/><stop offset="1" stop-color="#06071A"/></radialGradient>
<linearGradient id="pcie" x1="0" x2="1"><stop offset="0" stop-color="#4F63FF"/><stop offset="1" stop-color="#FF7A2F"/></linearGradient>
<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="rgba(79,99,255,0.35)"/><stop offset="1" stop-color="rgba(79,99,255,0)"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<ellipse cx="${gpuX}" cy="${baseY + 150}" rx="360" ry="120" fill="url(#glow)"/>
<ellipse cx="${ramX}" cy="${baseY + 150}" rx="360" ry="120" fill="url(#glow)"/>`;
svg += tower(gp, vram, { size: S, scale: 640 / 12282, total: 12282, frame: "#4F63FF", side: "left", lx: 40, cx: gpuX, title: "RTX 4070 · 12 GB VRAM", sub: "obsadené 11 549 MiB" });
svg += tower(rp, ram, { size: S, scale: 640 / 49094, total: 49094, frame: "#FF7A2F", side: "right", lx: 1940, cx: ramX, title: "RAM · 48 GB DDR4", sub: "obsadené ~26 GB" });
svg += `<path d="M${ax},${ay} Q${(ax + bx) / 2},${ay - 260} ${bx},${by}" stroke="url(#pcie)" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="1 20"/>`;
svg += text((ax + bx) / 2, ay + 60, "PCIe 3.0 x16", { size: 30, weight: 800, anchor: "middle" });
svg += text((ax + bx) / 2, ay + 98, "studení experti", { size: 24, color: "#AAB3D0", weight: 500, anchor: "middle" });
svg += "</svg>";

fs.mkdirSync("img", { recursive: true });
await sharp(Buffer.from(svg)).png().toFile("img/memmap.png");
console.log("img/memmap.png");
