// "GLaDOS – my personal pi agent" (AI 4 DEV Brno, 12. 11. 2026), Keynote edition. Slides in English,
// speaker notes in Slovak (the presenter's outline is Slovak too).
// Apple-keynote look: pure black, one idea per slide, huge type with gradient numbers, dark tiles,
// motion graphics as H.264 movies (anim/*.mjs), content that builds in by itself after each
// transition (no extra clicks: one press of the presenter = one slide). node build.js
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const JSZip = require("jszip");
const { applyTheme } = require(fs.existsSync(path.join(__dirname, "apply_theme.js")) ? "./apply_theme.js"
	: "C:/Users/chyli_rkuyf82/.claude/skills/synced/8091bcd0-5dca-4e53-825b-3be6228d232d_180caafc-c98f-4b11-90ca-2c0bc418c237/pptx/scripts/apply_theme.js");

const IMG = (f) => path.join(__dirname, "img", f);
const UP = (f) => (fs.existsSync(path.join(__dirname, "up", f)) ? path.join(__dirname, "up", f) : path.join(__dirname, "..", "up", f));
const OUT = path.join(__dirname, "Pi-agent-Keynote.pptx");
// The cover star: your own clip as img/glados.mp4 wins over the original eye animation.
const HERO = fs.existsSync(IMG("glados.mp4")) ? IMG("glados.mp4") : IMG("eye.mp4");
const HERO_POSTER = fs.existsSync(IMG("glados-poster.png")) ? IMG("glados-poster.png") : IMG("eye-first.png");

const FONT = "Helvetica Neue";
const THEME = {
	name: "GLaDOS Black",
	headFontFace: FONT,
	bodyFontFace: FONT,
	colors: {
		dk1: "000000", lt1: "F5F5F7", dk2: "1C1C1E", lt2: "A1A1A6",
		accent1: "FF9F0A", accent2: "0A84FF", accent3: "30D158", accent4: "BF5AF2", accent5: "FF375F", accent6: "64D2FF",
		hlink: "64D2FF", folHlink: "BF5AF2",
	},
};
const BG = "000000", TILE = "1C1C1E", TILE2 = "2C2C2E", WHITE = "F5F5F7", GRAY = "86868B", GRAY2 = "A1A1A6", LINE = "38383A";
// Section colour: accent for small text + a two-stop gradient for hero type. `grad` is a sentinel
// colour that post-processing turns into a real gradient fill on the text run.
const SEC = {
	intro: { acc: "FF9F0A", grad: "0A0B01", from: "FFD60A", to: "FF6A3D" },
	infer: { acc: "0A84FF", grad: "0A0B02", from: "64D2FF", to: "5E5CE6" },
	agent: { acc: "30D158", grad: "0A0B03", from: "A8F0B5", to: "30D158" },
	discord: { acc: "BF5AF2", grad: "0A0B04", from: "E0A5FF", to: "7D5CFF" },
	senses: { acc: "FF375F", grad: "0A0B05", from: "FF9FB2", to: "BF5AF2" },
	reality: { acc: "FF453A", grad: "0A0B06", from: "FFB340", to: "FF453A" },
};
const W = 13.333, H = 7.5, M = 0.75;

// ------------------------------------------------------------------ generated art helpers
const GEN = path.join(__dirname, "gen");
fs.mkdirSync(GEN, { recursive: true });

/** Photo melted into black: hard black on the left, soft vignette on the other edges. */
async function melt(src, name, { side = "left", stop = 0.5 } = {}) {
	const f = path.join(GEN, `melt-${name}.jpg`);
	const x1 = side === "left" ? 0 : 1, x2 = 1 - x1;
	const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><defs>
<linearGradient id="h" x1="${x1}" x2="${x2}"><stop offset="0" stop-color="#000" stop-opacity="1"/><stop offset="${stop * 0.55}" stop-color="#000" stop-opacity="0.92"/><stop offset="${stop}" stop-color="#000" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<radialGradient id="v" cx="0.62" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient></defs>
<rect width="1920" height="1080" fill="url(#h)"/><rect width="1920" height="1080" fill="url(#v)"/></svg>`;
	await sharp(src).resize(1920, 1080, { fit: "cover" }).composite([{ input: Buffer.from(mask) }]).jpeg({ quality: 92 }).toFile(f);
	return f;
}
/** Rounded-corner copy of a picture (`pos` picks the crop; "contain" keeps the whole frame). */
async function rounded(src, name, w, h, r = 40, pos = "centre") {
	const f = path.join(GEN, `rd-${name}.png`);
	const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`);
	await sharp(src).resize(w, h, { fit: "cover", position: pos }).composite([{ input: mask, blend: "dest-in" }]).png().toFile(f);
	return f;
}
/** Black -> transparent, left to right: melts the left edge of the divider art into the slide. */
async function fadeLeft() {
	const f = path.join(GEN, "fade-left.png");
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="1500"><defs><linearGradient id="g"><stop offset="0" stop-color="#000"/><stop offset="0.35" stop-color="#000" stop-opacity="0.85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs><rect width="840" height="1500" fill="url(#g)"/></svg>`;
	await sharp(Buffer.from(svg)).png().toFile(f);
	return f;
}
// The rounded() names used by a divider's next slide, so both get the same file.
const ART = { infer: "hw", senses: "voice" };
const b64 = (f) => `data:image/png;base64,${fs.readFileSync(f).toString("base64")}`;

// ------------------------------------------------------------------ deck
(async () => {
	const pres = new pptxgen();
	pres.layout = "LAYOUT_WIDE";
	pres.title = "GLaDOS – my personal pi agent";
	pres.author = "Lukas Chylik";
	pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

	pres.defineSlideMaster({
		title: "CONTENT",
		background: { color: BG },
		objects: [{ text: { text: "GLaDOS · my personal pi agent", options: { x: M, y: 7.0, w: 5, h: 0.25, fontSize: 9, color: "48484A", fontFace: FONT, margin: 0 } } }],
		slideNumber: { x: 12.0, y: 7.0, w: 0.58, h: 0.25, fontSize: 9, color: "48484A", fontFace: FONT, align: "right" },
	});
	pres.defineSlideMaster({ title: "BLANK", background: { color: BG }, objects: [] });

	const S = []; // per slide: transition, movies
	let cur;
	const add = (sec, section, opts = {}) => {
		const slide = pres.addSlide({ masterName: opts.blank ? "BLANK" : "CONTENT", sectionTitle: section });
		slide.background = { color: BG };
		cur = { transition: opts.transition || "fade", movies: [] };
		S.push(cur);
		return slide;
	};
	const T = (slide, text, o) => slide.addText(text, { fontFace: FONT, margin: 0, isTextBox: true, valign: "top", color: WHITE, ...o });
	const eyebrow = (s, sec, text, o = {}) => T(s, text, { x: M, y: 0.62, w: 10, h: 0.35, fontSize: 15, bold: true, color: SEC[sec].acc, objectName: "eyebrow", ...o });
	const title = (s, text, o = {}) => T(s, text, { x: M, y: 0.98, w: o.w || 11.8, h: o.h || 1.0, fontSize: o.size || 44, bold: true, objectName: "title", ...o });
	const tile = (s, x, y, w, h, o = {}) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: o.r ?? 0.2, fill: { color: o.fill || TILE, transparency: o.transparency || 0 }, line: { color: o.fill || TILE, transparency: o.transparency || 0, width: 0 }, objectName: o.name });
	/** Tile with a heading and a line of grey text; `b` = build group. */
	const feature = (s, x, y, w, h, head, text, b, o = {}) => {
		tile(s, x, y, w, h, { name: `b${b}`, fill: o.fill });
		T(s, head, { x: x + 0.3, y: y + (o.top ?? 0.26), w: w - 0.6, h: (o.gap ?? 0.5) - 0.02, fontSize: o.hs || 20, bold: true, color: o.hc || WHITE, objectName: `b${b}` });
		T(s, text, { x: x + 0.3, y: y + (o.top ?? 0.26) + (o.gap ?? 0.5), w: w - 0.6, h: Math.max(0.35, h - (o.top ?? 0.26) - (o.gap ?? 0.5) - 0.15), fontSize: o.ts || 15, color: o.tc || GRAY2, objectName: `b${b}` });
	};
	/** Big number (gradient) with a small label under it. */
	const stat = (s, sec, x, y, w, big, small, b, o = {}) => {
		if (o.tile !== false) tile(s, x, y, w, o.h || 2.0, { name: `b${b}` });
		const pad = o.tile === false ? 0 : 0.32;
		T(s, big, { x: x + pad, y: y + (o.tile === false ? 0 : 0.28), w: w - 2 * pad, h: o.bh || 1.0, fontSize: o.size || 54, bold: true, color: o.white ? WHITE : SEC[sec].grad, objectName: `b${b}`, fit: "shrink" });
		T(s, small, { x: x + pad, y: y + (o.tile === false ? 0 : 0.28) + (o.bh || 1.0) + 0.05, w: w - 2 * pad, h: 0.7, fontSize: o.ss || 16, color: GRAY2, objectName: `b${b}` });
	};
	const live = (s, sec) => {
		s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 10.95, y: 0.58, w: 1.63, h: 0.42, rectRadius: 0.21, fill: { color: SEC[sec].acc, transparency: 82 }, line: { color: SEC[sec].acc, width: 1 }, objectName: "live" });
		T(s, "● LIVE DEMO", { x: 10.95, y: 0.58, w: 1.63, h: 0.42, fontSize: 12, bold: true, color: SEC[sec].acc, align: "center", valign: "middle", objectName: "live" });
	};
	/** Movie: autoplay after the transition; loop for ambient ones. */
	const movie = (s, file, poster, o) => {
		const name = o.name || `movie${cur.movies.length + 1}`;
		s.addMedia({ type: "video", path: file, cover: b64(poster), x: o.x, y: o.y, w: o.w, h: o.h, objectName: name });
		cur.movies.push({ name, loop: !!o.loop, dur: o.dur || 10000 });
	};
	/** Milestone card for the model history: date, name, big number, label, facts. */
	const milestone = (s, x, y, w, h, b, [date, name, big, label, facts], o = {}) => {
		tile(s, x, y, w, h, { name: `b${b}` });
		const X = x + 0.28, Wd = w - 0.56;
		T(s, date, { x: X, y: y + 0.24, w: Wd, h: 0.3, fontSize: 12, bold: true, color: SEC.infer.acc, objectName: `b${b}` });
		T(s, name, { x: X, y: y + 0.56, w: Wd, h: 0.45, fontSize: o.ns || 20, bold: true, fit: "shrink", objectName: `b${b}` });
		T(s, big, { x: X, y: y + 1.05, w: Wd, h: 0.72, fontSize: o.bs || 36, bold: true, color: SEC.infer.grad, objectName: `b${b}` });
		T(s, label, { x: X, y: y + 1.8, w: Wd, h: 0.4, fontSize: 13, color: GRAY2, objectName: `b${b}` });
		T(s, facts.map((f, i) => ({ text: f, options: { bullet: { indent: 12 }, breakLine: i < facts.length - 1, paraSpaceAfter: 5 } })), { x: X, y: y + 2.3, w: Wd, h: h - 2.45, fontSize: o.fs || 13, color: WHITE, objectName: `b${b}` });
	};
	const code = (s, runs, o) => T(s, runs, { fontFace: "Menlo", fontSize: 16, ...o });
	const quote = (s, text, o = {}) => T(s, text, { x: M, y: 6.25, w: 11.8, h: 0.45, fontSize: 16, italic: true, color: GRAY, ...o });

	// ============================================================ 1 · INTRO
	pres.addSection({ title: "Intro" });
	{ // cover — GLaDOS (movie) right, title left
		const s = add("intro", "Intro", { blank: true });
		movie(s, HERO, HERO_POSTER, { x: 6.95, y: 0.7, w: 6.1, h: 6.1, loop: true, dur: 60000, name: "!!hero" });
		T(s, "AI 4 DEV · Brno · 12 Nov 2026", { x: M, y: 2.0, w: 6, h: 0.4, fontSize: 16, bold: true, color: GRAY2, objectName: "b1" });
		T(s, "GLaDOS", { x: M, y: 2.5, w: 6.2, h: 1.55, fontSize: 100, bold: true, color: SEC.intro.grad, objectName: "!!title" });
		T(s, "my personal pi agent", { x: M, y: 4.05, w: 6.2, h: 0.65, fontSize: 34, bold: true, objectName: "b2" });
		T(s, "A local AI agent on a gaming PC. Discord, voice, vision, images and full computer control.", { x: M, y: 4.85, w: 5.6, h: 0.9, fontSize: 18, color: GRAY2, objectName: "b3" });
		T(s, "Lukas Chylik  ·  github.com/depthark", { x: M, y: 6.2, w: 6, h: 0.4, fontSize: 15, color: GRAY, objectName: "b4" });
		s.addNotes("Ahojte, som Lukáš. Toto je GLaDOS, môj osobný pi agent. Beží celý doma na hernom PC: žiadne API, nič neodchádza do cloudu. Áno, je pomenovaná podľa umelej inteligencie z Portalu, a áno, osobnosť má podobnú. Pripravte si mobily, budeme skúšať naživo.");
	}
	{ // agenda — the eye shrinks to the corner (Morph)
		const s = add("intro", "Intro", { transition: "morph" });
		movie(s, HERO, HERO_POSTER, { x: 9.55, y: 0.55, w: 3.1, h: 3.1, loop: true, dur: 60000, name: "!!hero" });
		eyebrow(s, "intro", "Test plan");
		title(s, "Six test chambers", { w: 8.5 });
		const items = [["01", "GLaDOS and the stack", "intro"], ["02", "Inference: 35B in 12 GB", "infer"], ["03", "Qwen 3.6 and pi", "agent"], ["04", "Discord and the decision model", "discord"], ["05", "Voice, vision, images, browser, desktop", "senses"], ["06", "What broke and what it costs", "reality"]];
		items.forEach(([n, t, sec], i) => {
			const y = 2.3 + i * 0.7;
			T(s, n, { x: M, y, w: 0.9, h: 0.55, fontSize: 26, bold: true, color: SEC[sec].grad, valign: "middle", objectName: `b${i + 1}` });
			T(s, t, { x: M + 1.0, y, w: 8, h: 0.55, fontSize: 26, valign: "middle", objectName: `b${i + 1}` });
		});
		T(s, "6 live demos\n“The tests are safe. Mostly.” — GLaDOS", { x: 9.55, y: 3.95, w: 3.1, h: 1.0, fontSize: 14, color: GRAY, align: "center", objectName: "b7" });
		s.addNotes("Šesť komôr, ako to volá GLaDOS. Kto to je a z čoho sa skladá. Technika: ako sa 35-miliardový model zmestí do 12 GB grafiky. Qwen a pi. Discord a rozhodovací model d1. Potom zábava: hlas, zrak, obrázky, prehliadač a desktop naživo. Na koniec poctivo: čo sa pokazilo a koľko to stojí.");
	}
	{ // the one-liner
		const s = add("intro", "Intro", { blank: true });
		T(s, "One gaming PC.", { x: M, y: 1.75, w: 11.8, h: 1.1, fontSize: 64, bold: true, align: "center", objectName: "b1" });
		T(s, "Six AI models.", { x: M, y: 2.85, w: 11.8, h: 1.1, fontSize: 64, bold: true, align: "center", objectName: "b2" });
		T(s, "Zero API bills.", { x: M, y: 3.95, w: 11.8, h: 1.1, fontSize: 64, bold: true, align: "center", color: SEC.intro.grad, objectName: "b3" });
		T(s, "I run it from Discord. Phone or PC, 24/7.", { x: M, y: 5.35, w: 11.8, h: 0.5, fontSize: 22, color: GRAY2, align: "center", objectName: "b4" });
		s.addNotes("GLaDOS píšem na Discorde z mobilu aj z PC, v ktoromkoľvek kanáli môjho servera. Za tým je jedno herné PC a šesť lokálnych modelov: veľký jazykový, malý rozhodovací, zrak, reč a dva na obrázky. Za API neplatím nič, len elektrinu. Beží non-stop: ráno pošle AI novinky, cez deň robí veci na pozadí.");
	}
	{ // architecture
		const s = add("intro", "Intro");
		eyebrow(s, "intro", "Architecture");
		title(s, "Four layers, one PC");
		const boxes = [["Discord", "text · voice · images"], ["Bridge", "Node + discord.js"], ["pi agent", "tools · skills"], ["llama.cpp", "router :8080"]];
		s.addShape(pres.shapes.LINE, { x: M + 1.4, y: 2.95, w: 9.0, h: 0, line: { color: LINE, width: 2 }, objectName: "b1" });
		boxes.forEach(([h, t], i) => {
			const x = M + i * 3.05, last = i === 3;
			tile(s, x, 2.2, 2.75, 1.5, { name: `b${i + 1}`, fill: last ? "FF9F0A" : TILE });
			T(s, h, { x: x + 0.28, y: 2.42, w: 2.3, h: 0.5, fontSize: 24, bold: true, color: last ? "000000" : WHITE, objectName: `b${i + 1}` });
			T(s, t, { x: x + 0.28, y: 2.98, w: 2.3, h: 0.5, fontSize: 15, color: last ? "3A2A00" : GRAY2, objectName: `b${i + 1}` });
		});
		[["Models", "Qwen 3.6 35B · d1-2B · LFM3-VL\nQwen-Image 2.1 · Whistle"], ["Hands", "bash · agent-browser\nagent-desktop · GitHub"], ["In the background", "AI brief · CSS news · free games\ncinema · watchdog · WattLlama"]].forEach(([h, t], i) =>
			feature(s, M + i * 4.03, 4.15, 3.79, 2.0, h, t, 5 + i, { hc: SEC.intro.acc, ts: 14 }));
		s.addNotes("Štyri vrstvy. Discord je rozhranie. Bridge je Node aplikácia s discord.js, z každej správy spraví požiadavku pre agenta a pre každý kanál drží konverzáciu. Agent je pi cez SDK. Dole je llama.cpp v režime routera: jeden server na :8080, ktorý načítava a uvoľňuje modely. Popri tom naplánované úlohy: AI brief, CSS novinky, hry zadarmo, kino, watchdog a WattLlama na meranie spotreby.");
	}
	{ // Herdr — the terminal pi lives in
		const s = add("intro", "Intro");
		eyebrow(s, "intro", "Terminal");
		title(s, "Herdr: mission control for agents");
		[["Many agents at once", "panes, tabs, workspaces: pi, Claude Code, OpenCode"], ["Knows who is waiting for me", "working · done · blocked on an approval, plus a notification"], ["Nothing gets lost", "survives a closed window; a restart resumes the session"], ["Starts with the PC", "Windows Terminal → Herdr → pi, zero clicks"]].forEach(([h, t], i) =>
			feature(s, M, 2.0 + i * 1.05, 6.1, 0.95, h, t, i + 1, { hs: 18, ts: 14, top: 0.14, gap: 0.4 }));
		tile(s, 7.15, 2.0, 5.43, 4.1, { name: "b5", fill: "0B0B0C" });
		T(s, "The pi extension", { x: 7.5, y: 2.22, w: 4.8, h: 0.4, fontSize: 15, bold: true, color: SEC.intro.acc, objectName: "b5" });
		const G = "FFD60A", Cm = "6E6E73";
		code(s, [
			{ text: "// herdr-agent-state.ts", options: { color: Cm, breakLine: true } },
			{ text: "pi.on(", options: { color: WHITE } }, { text: "\"session_start\"", options: { color: G } }, { text: ")", options: { color: WHITE, breakLine: true } },
			{ text: "  // reports the session ID", options: { color: Cm, breakLine: true } },
			{ text: "pi.on(", options: { color: WHITE } }, { text: "\"agent_start\"", options: { color: G } }, { text: ")", options: { color: WHITE, breakLine: true } },
			{ text: "  // → working", options: { color: Cm, breakLine: true } },
			{ text: "pi.on(", options: { color: WHITE } }, { text: "\"agent_settled\"", options: { color: G } }, { text: ")", options: { color: WHITE, breakLine: true } },
			{ text: "  // → idle / done", options: { color: Cm, breakLine: true } },
			{ text: "ui.custom({ blocked })", options: { color: WHITE, breakLine: true } },
			{ text: "  // → blocked on an approval", options: { color: Cm } },
		], { x: 7.5, y: 2.72, w: 4.85, h: 2.6, fontSize: 14, objectName: "b5" });
		T(s, "Outside Herdr it does nothing, so GLaDOS on Discord is unaffected.", { x: 7.5, y: 5.05, w: 4.85, h: 0.6, fontSize: 13, color: GRAY2, objectName: "b5" });
		quote(s, "Warp → Herdr · open source, Apache 2.0 · since 3 Nov 2026", { objectName: "b6" });
		s.addNotes("Kde pi vlastne beží, keď nie je v Discorde: v Herdri. Je to open-source multiplexer pre coding agentov, niečo ako tmux, ale vie, čo agenti robia. Mám v ňom viac agentov naraz a pri každom vidím, či pracuje, skončil, alebo čaká, kým mu niečo schválim, a príde mi notifikácia. Session beží aj po zatvorení okna. Pri štarte PC sa sám otvorí Windows Terminal, v ňom Herdr a v ňom pi. Pi mu cez malú extension hlási svoj stav: začiatok, koniec, otázku na schválenie a ID session, takže po reštarte sa vráti tá istá konverzácia. Mimo Herdru extension nerobí nič, preto GLaDOS v Discorde neovplyvní. Prešiel som naň z Warpu 3. novembra.");
	}
	{ // models
		const s = add("intro", "Intro");
		eyebrow(s, "intro", "Inventory");
		title(s, "Every model, one PC");
		const hdr = (t, al = "left") => ({ text: t, options: { bold: true, color: GRAY, fontSize: 12, align: al, fill: { color: BG } } });
		const r = (cells) => cells.map((t, i) => ({ text: t, options: { color: i === 0 ? WHITE : GRAY2, bold: i === 0, fontSize: 14, align: i >= 2 && i <= 4 ? "right" : "left", fill: { color: TILE } } }));
		const rows = [
			[hdr("MODEL"), hdr("ROLE"), hdr("DISK", "right"), hdr("VRAM", "right"), hdr("RAM", "right"), hdr("WHEN IT RUNS")],
			r(["Qwen 3.6 35B-A3B (MTP)", "brain: chat, tools, news", "22.7 GB", "10.8 GB", "~19 GB*", "always · GPU + 8 cores"]),
			r(["LiquidAI d1-2B", "decides: yes/no, choice, score", "1.1 GB", "0", "1.0 GB", "always · CPU, 1–4 s"]),
			r(["LiquidAI LFM3-VL-2B", "vision: describes chat images", "1.3 GB", "0", "1.9 GB", "always · CPU, ~20 s"]),
			r(["Qwen-Image 2.1 + Turbo", "draws and edits images", "8.4 GB", "~6 GB", "~15 GB", "while drawing · 20–80 s"]),
			r(["Qwen3-VL-8B + VAE", "reads the prompt, decodes pixels", "6.9 GB", "shared", "shared", "with Qwen-Image"]),
			r(["Cactus Whistle", "voice note to text (English)", "17 MB", "0", "tiny", "per voice note · 0.3 s"]),
		];
		s.addTable(rows, { x: M, y: 2.05, w: 11.83, colW: [2.85, 3.2, 1.12, 1.12, 1.12, 2.42], rowH: 0.5, fontFace: FONT, border: { type: "solid", color: BG, pt: 3 }, margin: [0.05, 0.14, 0.05, 0.14], valign: "middle", objectName: "b1" });
		T(s, "* experts in RAM are a memory-mapped file (mmap): 18.7 GB from disk, the rest is buffers", { x: M, y: 5.72, w: 8, h: 0.3, fontSize: 12, color: GRAY, objectName: "b2" });
		[["~40 GB", "on disk"], ["11.5 / 12 GB", "VRAM at idle"], ["~26 / 48 GB", "RAM, whole PC"]].forEach(([b, t], i) =>
			T(s, [{ text: b + "  ", options: { bold: true, color: SEC.intro.grad, fontSize: 24 } }, { text: t, options: { color: GRAY2, fontSize: 15 } }], { x: M + i * 4.0, y: 6.2, w: 3.9, h: 0.5, objectName: `b${3 + i}` }));
		s.addNotes("Celý inventár, namerané. Qwen 3.6 je mozog. d1 rozhoduje bez písania textu, LFM3-VL je zrak, oba na procesore. Kreslenie sa s Qwenom na kartu nezmestí, preto sa striedajú. Whistle má 17 MB. Spolu ~40 GB na disku, v pokoji 11,5 z 12 GB VRAM.");
	}

	// ============================================================ 2 · INFERENCE
	const divider = async (sec, section, num, head, sub, img, notes, o = {}) => {
		pres.addSection({ title: section });
		const s = add(sec, section, { blank: true, transition: "fade" });
		// The SAME file as the art on the next slide (rounded square), only bigger: Keynote's Magic
		// Move pairs identical images only, so it now glides into the corner instead of dissolving.
		// A separate black gradient melts its left edge into the slide and simply fades out.
		const art = await rounded(img, ART[sec], 1100, 1100, 60, "right");
		s.addImage({ path: art, x: W - 7.2, y: 0.15, w: 7.2, h: 7.2, objectName: `!!art-${sec}` });
		s.addImage({ path: await fadeLeft(), x: W - 7.25, y: 0, w: 4.2, h: H, objectName: "melt" });
		T(s, num, { x: M, y: 1.9, w: 3, h: 0.6, fontSize: 28, bold: true, color: SEC[sec].grad, objectName: "b1" });
		T(s, head, { x: M, y: 2.55, w: 7.2, h: 2.1, fontSize: 60, bold: true, objectName: "!!title" });
		T(s, sub, { x: M, y: 4.95, w: 6.2, h: 0.9, fontSize: 22, color: GRAY2, objectName: "b2" });
		s.addNotes(notes);
		return s;
	};
	await divider("infer", "Inference", "02", "Inference\non a gaming PC", "How a 35B model fits into a 12 GB GPU.", IMG("hardware2.png"), "Prvá technická časť: ako dostať veľký model do herného PC.");
	{ // hardware — Apple spec sheet
		const s = add("infer", "Inference", { transition: "morph" });
		s.addImage({ path: await rounded(IMG("hardware2.png"), "hw", 1100, 1100, 60, "right"), x: 7.75, y: 0.95, w: 4.85, h: 4.85, objectName: "!!art-infer" });
		eyebrow(s, "infer", "Hardware");
		title(s, "The lab = a gaming PC", { w: 7, size: 36 });
		[["RTX 4070", "12 GB VRAM"], ["i7-9700K", "8 cores, 9th gen"], ["48 GB", "DDR4-2400"], ["PCIe 3.0", "x16 · this will matter"]].forEach(([b, t], i) => {
			const x = M + (i % 2) * 3.4, y = 2.3 + Math.floor(i / 2) * 1.75;
			T(s, b, { x, y, w: 3.2, h: 0.8, fontSize: 40, bold: true, color: SEC.infer.grad, objectName: `b${i + 1}` });
			T(s, t, { x, y: y + 0.8, w: 3.2, h: 0.5, fontSize: 17, color: GRAY2, objectName: `b${i + 1}` });
		});
		quote(s, "“It is not a data center. It is a gaming PC that no longer plays games.” — GLaDOS", { objectName: "b5" });
		s.addNotes("Žiadny server. RTX 4070 s 12 GB, i7-9700K deviatej generácie, 48 GB RAM (bežia na 2400 MHz). Doska má len PCIe 3.0, to bude dôležité. Otázka: ako sa sem zmestí model, ktorý má sám 21 GB?");
	}
	{ // model history 1/2 — finding a brain that fits
		const s = add("infer", "Inference");
		eyebrow(s, "infer", "Model history · 1 / 2");
		title(s, "Finding a brain that fits 12 GB");
		[
			["UNTIL JUN 2026", "Qwen2.5-14B", "dense", "whole model on the GPU", ["weak answers, previous generation", "fine for chat, lost in tool chains"]],
			["JUN – SEP 2026", "Qwen3-14B", "~25 tok/s", "dense · 11.9 GB VRAM · 32k context", ["thought ~300 tokens per reply → reasoning-budget = 0", "called a real search result “speculation” → SOUL.md: tool output is ground truth", "fumbled agent-browser (> 280 s) → wrapped as a tool: 0.4–1.1 s"]],
			["5 SEP 2026", "Qwen3.6-35B-A3B", "34.5 tok/s", "MoE · 35B total, 3B active per token", ["a dense 27B would not fit one 12 GB card", "I predicted 12–18 tok/s; only 2 KV heads made it 34.5", "first replies came back empty: it ignores reasoning-budget → reasoning = off"]],
		].forEach((m, i) => milestone(s, M + i * 4.0, 1.95, 3.83, 4.75, i + 1, m));
		s.addNotes("Ako som sa k tomuto modelu dopracoval, krok za krokom. Začiatok: Qwen2.5-14B-Instruct, hustý model celý na grafike. Na chat stačil, ale v reťazcoch nástrojov sa strácal a odpovede boli slabé. V júni Qwen3-14B: stále dense, 11,9 GB VRAM, 32k kontext, okolo 25 tokenov za sekundu. Tri lekcie z neho: premýšľal asi 300 tokenov pred každou odpoveďou, tak som zapol reasoning-budget 0. Keď našiel skutočný článok o GPT-6, nazval ho špekuláciou, lebo bol novší než jeho tréning, preto má SOUL.md pravidlo, že výstup nástroja je pravda. A viackrokové ovládanie agent-browsera cez shell trvalo cez 280 sekúnd, tak som ho zabalil ako nástroj a je to 0,4 až 1,1 sekundy. Piateho septembra prechod na Qwen 3.6. Hustý 27B by sa na jednu 12 GB kartu nezmestil, kamoš ho púšťa na dvoch grafikách. Zvolil som MoE verziu 35B-A3B. Odhadoval som 12 až 18 tokenov za sekundu, reálne 34,5, lebo má len 2 KV hlavičky a malú KV cache. Prvé odpovede ale prišli prázdne: Qwen 3.6 ignoruje reasoning-budget, celú odpoveď dal do premýšľania a Discord dostal prázdnu správu. Pomohol až nový prepínač reasoning off.");
	}
	{ // MoE — movie
		const s = add("infer", "Inference", { blank: true });
		movie(s, IMG("moe.mp4"), IMG("moe-first.png"), { x: 0, y: 0, w: W, h: H, loop: true, dur: 30000 });
		eyebrow(s, "infer", "Mixture of Experts");
		T(s, "35 billion\nparameters.\n3 billion\nper token.", { x: M, y: 1.0, w: 5.6, h: 3.4, fontSize: 44, bold: true, objectName: "title" });
		stat(s, "infer", M, 4.55, 2.6, "8 / 256", "experts per token in each of the 40 layers", 1, { tile: false, size: 40, bh: 0.75, ss: 15 });
		stat(s, "infer", M + 2.85, 4.55, 2.6, "21.1 GiB", "the whole model, Q4_K_M, 5.1 bits per weight", 2, { tile: false, size: 40, bh: 0.75, ss: 15 });
		s.addNotes("Trik je architektúra. Qwen 3.6 je Mixture of Experts: v každej zo 40 vrstiev je 256 expertov a pre každý token router vyberie osem — presne to svieti na animácii. Model má 35,5 miliardy parametrov, počíta sa s ~3 miliardami. To, čo sa používa stále (attention a KV cache), dám na grafiku. Expertov do RAM.");
	}
	{ // memory map — movie
		const s = add("infer", "Inference", { blank: true });
		movie(s, IMG("memory.mp4"), IMG("memory-first.png"), { x: 0, y: 0, w: W, h: H, dur: 12500 });
		eyebrow(s, "infer", "What runs where");
		title(s, "Attention on the GPU. Experts in RAM.", { size: 36, w: 11 });
		T(s, "Measured: llama.cpp buffer report, 2 Nov 2026", { x: M, y: 1.62, w: 9, h: 0.4, fontSize: 16, color: GRAY, objectName: "sub" });
		s.addNotes("Toto je skutočné rozloženie, z výpisu llama.cpp pri štarte. Súbor má 21,1 GiB: attention a zdieľané váhy sú len 2,4 GB, zvyšok, 18,7 GB, sú experti. Attention ide na grafiku, s KV cache pre 64k tokenov — len 680 MB, lebo len 10 zo 40 vrstiev má plnú attention, ostatné sú lineárne s malým stavom 188 MB. MTP hlava 344 MB. Všetci experti ležia v RAM ako mapovaný súbor, vedľa nich d1 a zrak. A najväčší kus grafiky, 6,4 GB, je cache horúcich expertov — asi tretina. Studení prídu cez PCIe 3.0, keď ich treba. Spolu 11,5 z 12 GB.");
	}
	{ // model history 2/2 — then making it fast
		const s = add("infer", "Inference");
		eyebrow(s, "infer", "Model history · 2 / 2");
		title(s, "Then making it fast");
		[
			["5 SEP", "n-cpu-moe = 24", "34.5 tok/s", "experts of 24 layers in RAM", ["20 is a cliff: VRAM full, the driver pages, 14.9 tok/s"]],
			["27 SEP", "MTP variant + 64k", "+44 %", "code 36.5 → 52.4 tok/s", ["same weights plus a 0.5 GB draft head", "3 drafts gave nothing more"]],
			["27 SEP", "ubatch = 2048", "2× prefill", "338 → 656 tok/s at 19k", ["experts cross PCIe once per batch", "ubatch 4096 collapses to 154"]],
			["16 OCT", "moe-cache = 6400", "56 tok/s", "code · at 50k: 40 → 49", ["new in llama.cpp v0.7.0", "6,900 MiB overflows at 50k"]],
		].forEach((m, i) => milestone(s, M + i * 3.0, 1.95, 2.83, 4.0, i + 1, m, { ns: 17, bs: 32 }));
		T(s, "Tried and dropped: KAT-Coder-V2.5 (41.9 tok/s, worse on agent tasks) · thinking mode (24 tok/s, ~10k tokens per task) · Kaggle TPU (platform bug)", { x: M, y: 6.15, w: 11.83, h: 0.55, fontSize: 14, italic: true, color: GRAY, objectName: "b5" });
		s.addNotes("Keď model sedel, prišlo ladenie. Pravidlo: každý krok zmerať a nechať len to, čo je rýchlejšie. Piateho septembra n-cpu-moe 24: experti z 24 vrstiev v RAM, 34,5 tokenu za sekundu pri 11,4 GB. Pri 20 je útes: grafika je plná, ovládač začne swapovať a rýchlosť padne na 14,9. Dvadsiateho siedmeho septembra MTP verzia toho istého modelu: rovnaké váhy, navyše pol gigabajtu draft hlavy. Kód z 36,5 na 52,4, plus 44 percent, a zároveň kontext 64k. Tri tipy dopredu už nepridali nič. V ten istý deň ubatch 2048: experti idú cez PCIe raz za dávku, takže väčšia dávka znamená menej prenosov a prefill dvojnásobný, z 338 na 656. Pri 4096 sa to zrúti na 154. Šestnásteho októbra priniesol llama.cpp v0.7.0 cache expertov na GPU: všetci experti v RAM a 6,4 GB horúcich na karte, kód 56 tokenov za sekundu, generovanie pri 50k z 40 na 49. 6,9 GB pri dlhom kontexte pretečie. Čo som vyskúšal a zahodil: KAT-Coder-V2.5, doučený Qwen na kód, len 41,9 tok/s a horší v agentických úlohách. Režim premýšľania: 24 tok/s a asi 10-tisíc tokenov na úlohu. A 27B model na Kaggle TPU, ktorý stroskotal na chybe platformy.");
	}
	{ // tuning chart
		const s = add("infer", "Inference");
		eyebrow(s, "infer", "Tuning");
		title(s, "Six runs, one winner");
		const labels = ["26 layers\nno cache", "30 + 1 GB", "34 + 3 GB", "40 + 5 GB", "40 + 6.4 GB", "40 + 6.9 GB"];
		s.addChart(pres.charts.BAR, [
			{ name: "code, tok/s", labels, values: [45.4, 27.9, 39.7, 45.6, 55.9, 58.0] },
			{ name: "generation at 50k, tok/s", labels, values: [40.5, 24.6, 37.3, 41.4, 48.7, 33.6] },
		], {
			x: M - 0.1, y: 2.0, w: 8.4, h: 4.6, barDir: "col", barGapWidthPct: 55, chartColors: ["0A84FF", "5E5CE6"],
			showValue: true, dataLabelPosition: "outEnd", dataLabelColor: "A1A1A6", dataLabelFontSize: 11, dataLabelFontFace: "+mn-lt",
			catAxisLabelColor: "86868B", catAxisLabelFontSize: 11, catAxisLabelFontFace: "+mn-lt", catAxisLineShow: false, valAxisHidden: true,
			valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: true, legendPos: "b", legendColor: "A1A1A6", legendFontSize: 12, legendFontFace: "+mn-lt",
			showTitle: false, objectName: "b1",
		});
		tile(s, 9.25, 2.0, 3.33, 4.6, { name: "b2" });
		T(s, [
			{ text: "40 + 6.4 GB", options: { bold: true, color: SEC.infer.grad, fontSize: 30, breakLine: true } },
			{ text: "the winner", options: { color: GRAY2, fontSize: 15, breakLine: true } },
			{ text: " ", options: { fontSize: 10, breakLine: true } },
			{ text: "All experts in RAM + an LRU cache on the GPU beats the old “26 layers on the card”.", options: { color: WHITE, fontSize: 15, breakLine: true } },
			{ text: " ", options: { fontSize: 10, breakLine: true } },
			{ text: "6.9 GB is faster on short prompts, but at 50k context VRAM overflows: 48.7 → 33.6 tok/s.", options: { color: GRAY2, fontSize: 14 } },
		], { x: 9.55, y: 2.3, w: 2.75, h: 4.1, objectName: "b2" });
		s.addNotes("Toto je ladenie z 16. októbra, llama.cpp b11669. Prvý stĺpec je pôvodné nastavenie: 26 vrstiev expertov v RAM, zvyšok na karte. Malá cache prehráva, ale všetci experti v RAM plus 6,4 GB LRU cache na GPU dá 55,9 tok/s pri kóde. Pri 6,9 GB je kód ešte rýchlejší, ale pri 50-tisícovom kontexte grafike dôjde pamäť a generovanie padne na 33,6. Preto 6400.");
	}
	{ // MTP — movie
		const s = add("infer", "Inference", { blank: true });
		movie(s, IMG("mtp.mp4"), IMG("mtp-first.png"), { x: 0, y: 0, w: W, h: H, loop: true, dur: 24000 });
		eyebrow(s, "infer", "Multi-token prediction");
		T(s, "+44 %", { x: M, y: 0.95, w: 6, h: 1.9, fontSize: 120, bold: true, color: SEC.infer.grad, objectName: "big" });
		T(s, "faster code generation.\nThe model drafts two tokens ahead.", { x: 6.7, y: 1.35, w: 5.9, h: 1.2, fontSize: 24, color: WHITE, objectName: "b1" });
		T(s, "spec-type = draft-mtp · same model, same GPU", { x: 6.7, y: 2.45, w: 5.9, h: 0.4, fontSize: 15, color: GRAY, objectName: "b2" });
		s.addNotes("Moje obľúbené číslo. Qwen 3.6 má vlastnú MTP hlavu: popri tokene si tipne ďalšie dva a llama.cpp ich overí v jednom kroku. Keď tip sedí, máte viac tokenov za cenu jedného — na animácii zelené; keď nesedí, zahodí sa, červené. Pri kóde plus 44 percent, z 36,5 na 52,4 tokenu za sekundu. Jeden parameter.");
	}
	{ // parameters
		const s = add("infer", "Inference");
		eyebrow(s, "infer", "models.ini");
		title(s, "The parameters, and why these");
		const rows = [["n-cpu-moe = 40", "all experts to RAM, the GPU stays for attention"], ["moe-cache-mib = 6400", "expert cache on the GPU; 6900 already floods VRAM"], ["ctx-size = 65536", "64k context; the KV cache is small on a hybrid (680 MB)"], ["cache-type-k/v = q8_0", "half-size KV cache, same quality, 2× faster than f16"], ["batch 4096 / ubatch 2048", "experts cross PCIe once per 2048 tokens: 2× prefill"], ["spec-type = draft-mtp", "MTP head, 2 tokens ahead: +44 % on code"], ["reasoning = off", "Qwen ignores reasoning-budget, this turns it off"], ["--models-max 3", "Qwen on the GPU, d1 and LFM3-VL on the CPU, all at once"]]
			.map(([k, v]) => [{ text: k, options: { fontFace: "Menlo", bold: true, color: "64D2FF", fontSize: 14, fill: { color: TILE } } }, { text: v, options: { color: GRAY2, fontSize: 15, fill: { color: TILE } } }]);
		s.addTable(rows, { x: M, y: 2.0, w: 11.83, colW: [4.0, 7.83], rowH: 0.54, fontFace: FONT, border: { type: "solid", color: BG, pt: 3 }, margin: [0.05, 0.18, 0.05, 0.18], valign: "middle", objectName: "b1" });
		s.addNotes("Výťah z models.ini, čo ktorý parameter znamená a čo mi priniesol. n-gpu-layers 99: všetky vrstvy na GPU, teda attention, embeddingy a router. n-cpu-moe 40: z nich vráti do RAM len expert tensory všetkých 40 vrstiev; bez neho llama.cpp presúva iba celé vrstvy aj s attention a bolo by to nepoužiteľné. moe-cache-mib 6400: LRU cache horúcich expertov na GPU, od llama.cpp v0.7.0; kód zo 45 na 56 tok/s, generovanie pri 50k zo 40 na 49; 6900 pri 50k pretečie na 33,6. ctx-size 65536: kontext 64k namiesto 32k; KV cache má len 680 MB, lebo plnú attention má iba 10 zo 40 vrstiev. cache-type-k a -v q8_0: KV cache v 8 bitoch namiesto 16, polovičná pamäť, kvalita 28 z 33 proti 26 z 33 pri f16 a pri 64k dvojnásobná rýchlosť, 50 proti 26 tok/s. batch-size 4096 a ubatch-size 2048: koľko tokenov promptu sa spracuje naraz; experti sa cez PCIe prenášajú raz za dávku, prefill z 338 na 656 tok/s; ubatch 4096 sa zrúti na 154. spec-type draft-mtp so spec-draft-n-max 2: MTP hlava tipuje dva tokeny dopredu a overia sa v jednom kroku, kód plus 44 percent; tri tipy nepomohli. spec-draft-n-ubatch 512: menšia dávka pre draft, ušetrí asi 100 MB VRAM. flash-attn on: rýchlejšia attention s menšou pamäťou. reasoning off: vypne premýšľanie; Qwen 3.6 ignoruje reasoning-budget 0 a Discord dostával prázdne správy. parallel 1: jeden slot, celá cache pre mňa. models-max 3: router drží naraz Qwen na GPU a d1 s LFM3-VL na CPU.");
	}
	{ // speed
		const s = add("infer", "Inference");
		eyebrow(s, "infer", "Benchmarks");
		title(s, "How fast it runs");
		[["~70", "tokens/s generating text"], ["805", "tokens/s prefill on a 27k prompt"], ["64k", "tokens of context"], ["11.6", "GB of 12 GB VRAM in use"]].forEach(([b, t], i) =>
			stat(s, "infer", M + i * 3.0, 2.4, 2.8, b, t, i + 1, { size: 64, bh: 1.15, h: 2.5 }));
		quote(s, "“Faster than you can read. Not that you read fast.” — GLaDOS", { y: 5.4, objectName: "b5" });
		s.addNotes("Generovanie okolo 70 tokenov za sekundu (kód 64–67, text 69–73). Prefill okolo 800 tokenov za sekundu na 27k prompte. Kontext 64k. Grafika na hrane: pol gigabajtu cache navyše a dlhé prompty spadnú o tretinu.");
	}

	// ============================================================ 3 · AGENT
	await divider("agent", "Qwen and pi", "03", "Brain\nand agent", "What I use Qwen 3.6 for and how pi works.", IMG("brain.png"), "Tretia časť: čo s tým modelom robím a ako ho riadi agent.");
	{ // qwen uses — bento
		const s = add("agent", "Qwen and pi");
		eyebrow(s, "agent", "Base model");
		title(s, "What I use Qwen 3.6 for");
		[["Chat with a personality", "the GLaDOS persona from SOUL.md"], ["Web and research", "searches, opens, summarizes"], ["Coding", "#coding right in my repos"], ["Writing news", "CSS news in Czech"], ["Prompt translation", "Slovak → English for images"]].forEach(([h, t], i) => {
			const x = M + (i % 3) * 2.75, y = 2.05 + Math.floor(i / 3) * 2.15;
			feature(s, x, y, 2.55, 1.95, h, t, i + 1, { hs: 18, gap: 0.85, ts: 14 });
		});
		tile(s, M + 2.75 * 3, 2.05, 3.58, 4.1, { name: "b6", fill: "0E2A17" });
		T(s, "Nothing\nleaves.", { x: M + 2.75 * 3 + 0.35, y: 2.4, w: 3.0, h: 1.8, fontSize: 30, bold: true, color: SEC.agent.grad, objectName: "b6" });
		T(s, "The model is local, so it may read private things too: files, the screen, email.", { x: M + 2.75 * 3 + 0.35, y: 4.3, w: 2.9, h: 1.5, fontSize: 16, color: GRAY2, objectName: "b6" });
		s.addNotes("Qwen je ťažný kôň. Osobnosť GLaDOS je obyčajný súbor SOUL.md. Vyhľadáva a otvára stránky v skutočnom prehliadači. V #coding pracuje v mojich repozitároch. Píše CSS novinky po česky. Prekladá prompty pre obrázky. A keďže je lokálny, môže čítať aj súkromné veci.");
	}
	{ // pi SDK
		const s = add("agent", "Qwen and pi");
		eyebrow(s, "agent", "Agent");
		title(s, "pi: an agent as a library");
		tile(s, M, 2.0, 6.5, 3.95, { name: "b1", fill: "0B0B0C" });
		const G = "30D158", Cm = "6E6E73";
		code(s, [
			{ text: "const", options: { color: G } }, { text: " { session } = ", options: { color: WHITE } }, { text: "await", options: { color: G, breakLine: true } },
			{ text: "  createAgentSession({", options: { color: WHITE, breakLine: true } },
			{ text: "    model: qwen,       ", options: { color: WHITE } }, { text: "// local 35B", options: { color: Cm, breakLine: true } },
			{ text: "    resourceLoader,    ", options: { color: WHITE } }, { text: "// SOUL.md + skills", options: { color: Cm, breakLine: true } },
			{ text: "    customTools: [progressUpdate],", options: { color: WHITE, breakLine: true } },
			{ text: "  });", options: { color: WHITE, breakLine: true } },
			{ text: "await", options: { color: G } }, { text: " session.prompt(message);", options: { color: WHITE } },
		], { x: M + 0.35, y: 2.35, w: 6.0, h: 3.3, objectName: "b1" });
		[["Tools", "bash, files, web_search, browse, codemode"], ["Skills = markdown", "free games, agent-browser, agent-desktop"], ["d1 classifier", "the llama.cpp provider sees it natively"], ["pi 1.5.0", "since 2 Nov, nightly update with 11 tests"]].forEach(([h, t], i) =>
			feature(s, 7.5, 2.0 + i * 1.02, 5.08, 0.92, h, t, i + 2, { hs: 17, ts: 14, top: 0.14, gap: 0.38 }));
		s.addNotes("Pi je open-source coding agent, podobný Claude Code, ale dá sa použiť ako knižnica. Vytvorím session, dám jej lokálny model, osobnosť, skilly a vlastné nástroje, a posielam jej správy z Discordu. Skilly sú markdown návody. d1 vidí natívne ako klasifikátor. Od dnes pi 1.5: nočná aktualizácia s 11 testami a automatickým rollbackom.");
	}

	// ============================================================ 4 · DISCORD
	await divider("discord", "Discord", "04", "Discord\nand decisions", "The bridge, slash commands and a small model that only decides.", IMG("agent.png"), "Štvrtá časť: ako sa s GLaDOS rozprávam a kde namiesto veľkého modelu rozhoduje malý.");
	{ // bridge
		const s = add("discord", "Discord");
		eyebrow(s, "discord", "Interface");
		title(s, "Discord bridge");
		tile(s, M, 2.0, 3.6, 4.1, { name: "b1" });
		T(s, "1,900", { x: M + 0.35, y: 2.4, w: 3.0, h: 1.2, fontSize: 72, bold: true, color: SEC.discord.grad, objectName: "b1" });
		T(s, "lines of JavaScript between Discord and the agent", { x: M + 0.35, y: 3.65, w: 2.9, h: 1.2, fontSize: 17, color: GRAY2, objectName: "b1" });
		[["Channel = conversation", "survives restarts"], ["No mentions needed", "across my whole server"], ["Only me", "allow-list, the agent has a shell"], ["Progress updates", "screenshots included"], ["A model per channel", "local or free from OpenRouter"], ["Tokens out of the shell", "the agent can neither see nor print them"]].forEach(([h, t], i) =>
			feature(s, 4.6 + (i % 2) * 4.04, 2.0 + Math.floor(i / 2) * 1.4, 3.94, 1.25, h, t, 2 + i, { hs: 18, ts: 14, gap: 0.45 }));
		s.addNotes("Bridge je srdce stacku. Každý kanál je konverzácia a prežije reštart. Na mojom serveri netreba tagovať. Odpovedá len mne, lebo má shell. Dlhé úlohy posielajú priebežné správy. Každý kanál môže mať iný model. A lekcia: tokeny mažem z prostredia pri štarte, lebo agent si ich vedel prečítať cez shell.");
	}
	{ // slash commands — all of them, coding vs personal
		const s = add("discord", "Discord");
		eyebrow(s, "discord", "Commands");
		title(s, "18 slash commands, mostly plain code");
		const list = (x, y, w, head, rows, b, o = {}) => {
			T(s, head, { x, y, w, h: 0.35, fontSize: 13, bold: true, color: o.hc || "D7A6FF", objectName: `b${b}` });
			rows.forEach(([c, t], i) => {
				const yy = y + 0.45 + i * 0.4;
				T(s, c, { x, y: yy, w: o.cw || 3.0, h: 0.36, fontSize: 13, bold: true, fontFace: "Menlo", color: WHITE, valign: "middle", fit: "shrink", objectName: `b${b}` });
				T(s, t, { x: x + (o.cw || 3.0) + 0.1, y: yy, w: w - (o.cw || 3.0) - 0.1, h: 0.36, fontSize: 13, color: GRAY2, valign: "middle", fit: "shrink", objectName: `b${b}` });
			});
		};
		tile(s, M, 1.95, 5.85, 4.85, { name: "b1" });
		list(M + 0.3, 2.15, 5.3, "CODING & AGENT", [["/ask", "ask GLaDOS anything"], ["/search", "web search, no guessing"], ["/browse", "a page in a real browser"], ["/skill", "run one of the skills"], ["/model", "show / switch the model"], ["/switch-free-coding-models", "free OpenRouter coder"], ["/get-new-models", "new stealth + free models"], ["/status", "model, router, context"], ["/reset", "fresh conversation"]], 1);
		tile(s, M + 6.0, 1.95, 5.83, 4.85, { name: "b2" });
		list(M + 6.3, 2.15, 5.25, "PERSONAL", [["/get-news", "the AI news brief, now"], ["/check-games", "free games, optional claim"], ["/key", "redeem a Steam key"], ["/what-the-track", "Rádio FM now + Spotify link"], ["/add-to-playlist", "track → the right playlist"], ["/cinema", "Cinema City listings for a day"]], 2, { cw: 2.4 });
		list(M + 6.3, 5.12, 5.25, "CSS CZECHOSLOVAKIA · PUBLIC SERVER, OWNER ONLY", [["/css-news", "Chrome + WebKit news"], ["/css-ai-news", "AI in CSS and frontend"], ["/css-tips-and-tricks", "CSS tips and tricks"]], 3, { cw: 2.4, hc: SEC.discord.acc });
		s.addNotes("Všetkých 18 slash commandov, rozdelených podľa použitia. Coding a agent: /ask je bežná otázka, /search a /browse volajú nástroj priamo, lebo model raz tvrdil, že vyhľadávanie nefunguje. /skill spustí ľubovoľný skill. /model a /switch-free-coding-models prepnú model kanála, napríklad #coding na bezplatný model z OpenRouteru, a pri chybe sa vráti na lokálny Qwen. /get-new-models ukáže nové stealth a bezplatné coding modely. /status ukáže model, router a zaplnenie kontextu, /reset začne novú konverzáciu. Osobné: /get-news pošle AI brief hneď, /check-games skontroluje a voliteľne vyzdvihne hry zadarmo, /key aktivuje Steam kľúč, /what-the-track a /add-to-playlist pracujú s Rádiom FM a Spotify a /cinema ukáže program kina. Tri CSS príkazy sú na verejnom serveri CSS CzechoSlovakia a smiem ich spustiť len ja. Väčšina z nich je obyčajný kód, model zapojím len tam, kde treba úsudok.");
	}
	{ // d1
		const s = add("discord", "Discord");
		eyebrow(s, "discord", "Decision model");
		title(s, "d1-2B: never writes, only decides");
		[["State", "headline: “Genie 4 …”"], ["Question", "Is this real AI news?"], ["Answer", "yes · 87 %"]].forEach(([h, t], i) => {
			const x = M + i * 2.85, hi = i === 2;
			tile(s, x, 2.05, 2.65, 1.6, { name: `b${i + 1}`, fill: hi ? "BF5AF2" : TILE });
			T(s, h.toUpperCase(), { x: x + 0.25, y: 2.25, w: 2.2, h: 0.35, fontSize: 12, bold: true, color: hi ? "FFFFFF" : "D7A6FF", objectName: `b${i + 1}` });
			T(s, t, { x: x + 0.25, y: 2.65, w: 2.2, h: 0.9, fontSize: 18, bold: true, objectName: `b${i + 1}` });
		});
		const hd = (t) => ({ text: t, options: { bold: true, color: GRAY, fontSize: 12, fill: { color: BG } } });
		const c = (t, b) => ({ text: t, options: { color: b ? WHITE : GRAY2, bold: !!b, fontSize: 15, fill: { color: TILE } } });
		s.addTable([[hd("TEST ON MY OWN DATA"), hd("d1-3B"), hd("d1-2B")], [c("news: passed / noise (of 8 / 58)"), c("4 / 4"), c("5 / 0", 1)], [c("duplicate headlines (of 6)"), c("4"), c("6", 1)], [c("time per question"), c("6.4 s"), c("4.0 s", 1)], [c("DnB tracks (12) / false hits (24)"), c("11 / 1"), c("10 / 0", 1)]],
			{ x: M, y: 4.0, w: 8.35, colW: [4.75, 1.8, 1.8], rowH: 0.46, fontFace: FONT, border: { type: "solid", color: BG, pt: 3 }, margin: [0.04, 0.16, 0.04, 0.16], valign: "middle", objectName: "b4" });
		stat(s, "discord", 9.35, 2.05, 3.23, "1 GB", "on the CPU next to Qwen · /v1/systemone endpoint", 5, { size: 60, bh: 1.1, h: 4.25 });
		s.addNotes("LiquidAI d1 negeneruje text. Dáte mu stav a krátke otázky: áno/nie, výber, alebo skóre, a vráti pravdepodobnosť. Má gigabajt, beží na CPU, llama.cpp ho servíruje cez /v1/systemone. Z 3B na 2B som prešiel po teste na ručne označených dátach: menší je rýchlejší a na mojich dátach presnejší, na 58 šumových titulkoch nepustil ani jeden.");
	}
	{ // add-to-playlist
		const s = add("discord", "Discord");
		live(s, "discord");
		eyebrow(s, "discord", "/add-to-playlist");
		title(s, "Code for facts. d1 for judgment.");
		[["1 · code", "what Rádio FM plays, find it on Spotify", false], ["2 · code", "MusicBrainz: is the artist CZ/SK?", false], ["3 · d1", "Is it drum and bass? Is it indie?", true], ["4 · code", "add to DnB [2026], suggest more", false]].forEach(([h, t, hi], i) =>
			feature(s, M + i * 2.98, 2.05, 2.8, 1.95, h, t, i + 1, { fill: hi ? "BF5AF2" : TILE, hc: WHITE, tc: hi ? "F5F5F7" : GRAY2, ts: 15 }));
		stat(s, "discord", M, 4.35, 3.0, "10 / 12", "DnB tracks recognized", 5, { size: 52, h: 1.95, bh: 0.95 });
		stat(s, "discord", M + 3.2, 4.35, 3.0, "0 / 24", "other genres let through", 6, { size: 52, h: 1.95, bh: 0.95 });
		s.addNotes("Zložitejší príkaz. Kód zistí, čo hrá Rádio FM, a nájde to na Spotify. Kód sa pozrie do MusicBrainz, odkiaľ je interpret — to je fakt. Žáner je úsudok: d1 dostane dve otázky. Kód pridá skladbu do playlistu roka. Na 36 skladbách: 10 z 12 DnB, ani jeden omyl. LIVE: /add-to-playlist na to, čo práve hrá.");
	}
	{ // brief
		const s = add("discord", "Discord");
		eyebrow(s, "discord", "News filter");
		title(s, "1,400 headlines, three items");
		tile(s, M, 2.0, 6.4, 4.15, { name: "b1", fill: "0B0B0C" });
		T(s, [
			{ text: "AI news · 31 Oct · llama.cpp", options: { bold: true, color: WHITE, fontSize: 16, breakLine: true } },
			{ text: " ", options: { fontSize: 8, breakLine: true } },
			{ text: "kv-cache: keep rotation constants on the GPU", options: { color: GRAY2, fontSize: 15, breakLine: true } },
			{ text: "d1: cuda 45 %", options: { color: "D7A6FF", fontSize: 13, breakLine: true } },
			{ text: " ", options: { fontSize: 8, breakLine: true } },
			{ text: "ggml: add batched tensor copy API", options: { color: GRAY2, fontSize: 15, breakLine: true } },
			{ text: "d1: feature 95 %", options: { color: "D7A6FF", fontSize: 13, breakLine: true } },
			{ text: " ", options: { fontSize: 8, breakLine: true } },
			{ text: "common: drop the Windows argv reconstruction", options: { color: GRAY2, fontSize: 15, breakLine: true } },
			{ text: "always watched: Windows", options: { color: "D7A6FF", fontSize: 13 } },
		], { x: M + 0.35, y: 2.3, w: 5.8, h: 3.7, objectName: "b1" });
		[["Every hour", "RSS, sites without RSS, GitHub"], ["P ≥ 0.85", "plus a d1 duplicate check"], ["CSS community", "#novinky, #ai, #tipy-a-triky, #udalosti"]].forEach(([h, t], i) =>
			feature(s, 7.4, 2.0 + i * 1.42, 5.18, 1.28, h, t, 2 + i, { hs: 20, ts: 15, gap: 0.47 }));
		s.addNotes("Každú hodinu ~1 400 titulkov z RSS, webov a commitov llama.cpp. d1 sa pýta, či je to skutočná AI novinka, a pustí len P ≥ 0,85. Ďalšia otázka stráži duplicity. Vľavo skutočný brief z 31. 10. Rovnaký mechanizmus plní kanály CSS CzechoSlovakia.");
	}

	// ============================================================ 5 · SENSES
	await divider("senses", "Capabilities", "05", "Voice, vision\nand hands", "Voice notes, images, the browser and the whole desktop.", IMG("voice.png"), "Piata časť, tá zábavná: všetko naživo.");
	{ // voice
		const s = add("senses", "Capabilities", { transition: "morph" });
		s.addImage({ path: await rounded(IMG("voice.png"), "voice", 1100, 1100, 60, "right"), x: 7.75, y: 0.95, w: 4.85, h: 4.85, objectName: "!!art-senses" });
		live(s, "senses");
		eyebrow(s, "senses", "Voice");
		title(s, "Talk instead of typing", { w: 6.8, h: 1.6 });
		T(s, "A voice note from the phone → Whistle transcribes it → GLaDOS replies. In any channel.", { x: M, y: 2.7, w: 6.4, h: 0.9, fontSize: 19, color: GRAY2, objectName: "b1" });
		stat(s, "senses", M, 3.85, 3.0, "0.3 s", "to transcribe 10 s of audio on the CPU", 2, { size: 52, h: 1.95, bh: 0.95 });
		stat(s, "senses", M + 3.2, 3.85, 3.0, "17 MB", "the whole Whistle model", 3, { size: 52, h: 1.95, bh: 0.95 });
		quote(s, "No Slovak: “Slovenský jazyk” → “Somenski y Azik.”", { objectName: "b4" });
		s.addNotes("Hlasovka: bridge ju stiahne, ffmpeg prevedie na 16 kHz mono, Whistle od Cactus Compute prepíše. 17 MB, CPU, 10 s nahrávky za 0,3 s. GLaDOS najprv ukáže, čo počul. Slovenčinu nevie, hovorím po anglicky. LIVE: pošlem hlasovku.");
	}
	{ // vision — real test on the WattLlama dashboard
		const s = add("senses", "Capabilities");
		live(s, "senses");
		eyebrow(s, "senses", "Vision");
		title(s, "Qwen is blind, so it got eyes");
		s.addImage({ path: await rounded(IMG("wl-crop.png"), "wl", 1180, 180, 18, "left top"), x: M, y: 2.0, w: 11.83, h: 1.8, objectName: "b1" });
		tile(s, M, 4.05, 7.6, 2.6, { name: "b2", fill: "0B0B0C" });
		T(s, "READ BY LFM3-VL-2B · 18.8 s · CPU ONLY", { x: M + 0.3, y: 4.25, w: 7, h: 0.3, fontSize: 11, bold: true, color: SEC.senses.acc, objectName: "b2" });
		code(s, "NOW: 89 W whole PC · GPU 15 W · 42 °C · 4 %\nTODAY: 1.61 kWh · while the LLM generated 21 Wh · 10 min\nHISTORY: last 7 days 11.69 kWh · CZK 70.14\nTOKENS: 5,176 tokens today · cost per 1M tokens CZK 42.82", { x: M + 0.3, y: 4.7, w: 7.1, h: 1.8, fontSize: 14, color: WHITE, objectName: "b2" });
		stat(s, "senses", 8.6, 4.05, 1.9, "0 GB", "VRAM", 3, { size: 36, h: 2.6, bh: 0.7, ss: 14 });
		stat(s, "senses", 10.68, 4.05, 1.9, "100%", "of the numbers read right", 4, { size: 32, h: 2.6, bh: 0.7, ss: 14 });
		s.addNotes("Qwen 3.6 je čisto textový a grafika je plná. Riešenie: LFM3-VL od LiquidAI, 2 miliardy parametrov, celé na procesore. Obrázok v chate najprv opíše a prečíta všetok text, opis dostane Qwen spolu s otázkou. Test z dnešného večera: screenshot môjho WattLlama dashboardu. Za 18,8 sekundy prečítal všetky štyri panely a každé číslo sedí, aj desatinné miesta. Skúšal som aj ich model na zvuk: horší ako d1 a slovenčinu nevie, tak ostal len zrak. LIVE: odfotím vás a pošlem to GLaDOS.");
	}
	{ // image gen — the real Tatras chat, both frames uncropped
		const s = add("senses", "Capabilities");
		live(s, "senses");
		eyebrow(s, "senses", "#image-generator");
		title(s, "Draws and edits: Qwen-Image 2.1");
		s.addImage({ path: await rounded(UP("tatry-before.jpg"), "tb", 900, 900, 40), x: M, y: 2.0, w: 3.75, h: 3.75, objectName: "b1" });
		s.addImage({ path: await rounded(UP("tatry-after.jpg"), "ta", 900, 900, 40), x: 8.83, y: 2.0, w: 3.75, h: 3.75, objectName: "b3" });
		T(s, "„DoLorain flying above\nHigh Tatras on Slovakia“", { x: M, y: 5.9, w: 3.75, h: 0.7, fontSize: 13, fontFace: "Menlo", color: GRAY2, align: "center", objectName: "b1" });
		tile(s, 4.85, 2.85, 3.65, 2.05, { name: "b2" });
		T(s, "reply in the chat", { x: 5.1, y: 3.05, w: 3.2, h: 0.3, fontSize: 11, bold: true, color: SEC.senses.acc, align: "center", objectName: "b2" });
		T(s, "„Don’t see flying car\nabove Tatras“", { x: 5.1, y: 3.45, w: 3.2, h: 0.8, fontSize: 16, fontFace: "Menlo", align: "center", objectName: "b2" });
		T(s, "→", { x: 5.1, y: 4.2, w: 3.2, h: 0.5, fontSize: 26, bold: true, color: SEC.senses.grad, align: "center", objectName: "b2" });
		T(s, "car added, top centre", { x: 8.83, y: 5.9, w: 3.75, h: 0.7, fontSize: 13, color: GRAY2, align: "center", objectName: "b3" });
		T(s, [{ text: "~70 s ", options: { bold: true, color: WHITE } }, { text: "quality model   ", options: { color: GRAY } }, { text: "~20 s ", options: { bold: true, color: WHITE } }, { text: "Turbo (“rýchlo …” = fast)", options: { color: GRAY } }], { x: M, y: 6.55, w: 11.83, h: 0.4, fontSize: 15, align: "center", objectName: "b4" });
		s.addNotes("Kanál image-generator: prompt = nový obrázok, obrázok + prompt alebo odpoveď na obrázok = úprava, aj hlasom. Qwen-Image 2.1 cez stable-diffusion.cpp. Skutočný chat: napísal som DeLorean nad Tatrami (s preklepom) a prišli Tatry bez auta. Odpísal som, že auto nevidím, a GLaDOS ho dokreslil — malé, hore v strede. Ponaučenie: prompt píšte konkrétne. Kvalitný model ~70 s (dnes namerané 56–82 s), Turbo s „rýchlo“ ~20 s. LIVE: rýchlo, nakresli, čo poviete.");
	}
	{ // swap
		const s = add("senses", "Capabilities");
		eyebrow(s, "senses", "Model swap");
		title(s, "One GPU, two big models");
		[["1", "Qwen translates the prompt"], ["2", "router: unload Qwen"], ["3", "sd.cpp draws"], ["4", "router: load Qwen"]].forEach(([n, t], i) => {
			const x = M + i * 2.98, hi = i === 2;
			tile(s, x, 2.05, 2.8, 1.55, { name: `b${i + 1}`, fill: hi ? "FF375F" : TILE });
			T(s, n, { x: x + 0.28, y: 2.22, w: 1, h: 0.5, fontSize: 24, bold: true, color: hi ? WHITE : SEC.senses.grad, objectName: `b${i + 1}` });
			T(s, t, { x: x + 0.28, y: 2.78, w: 2.4, h: 0.6, fontSize: 18, bold: true, objectName: `b${i + 1}` });
		});
		T(s, "VRAM DURING ONE IMAGE · MEASURED", { x: M, y: 4.05, w: 8, h: 0.35, fontSize: 12, bold: true, color: GRAY, objectName: "b5" });
		[["Qwen 35B · 11.5 GB", 2.6, "0A84FF", 5], ["Qwen-Image · ~6 GB, GPU 100 %", 5.2, "FF375F", 6], ["Qwen back · ~20 s", 2.6, "0A84FF", 7]].reduce((x, [t, w, c, b]) => {
			s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.5, w: w * 1.15 - 0.1, h: 0.8, rectRadius: 0.4, fill: { color: c }, line: { color: c, width: 0 }, objectName: `b${b}` });
			T(s, t, { x: x + 0.3, y: 4.5, w: w * 1.15 - 0.5, h: 0.8, fontSize: 15, bold: true, color: WHITE, valign: "middle", objectName: `b${b}` });
			return x + w * 1.15;
		}, M);
		T(s, "Other jobs wait on a GPU lock, so the router never loads Qwen back into a full card.", { x: M, y: 5.65, w: 11.83, h: 0.5, fontSize: 18, color: GRAY2, objectName: "b8" });
		s.addNotes("Dva veľké modely sa na 12 GB nezmestia, tak sa striedajú. Qwen preloží prompt, router ho uvoľní, kreslí stable-diffusion.cpp, router Qwen nahrá späť. Dve HTTP volania. Zradné: brief, CSS novinky aj WattLlama sa pýtajú na Qwen a router by ho nahral do plnej karty. Preto spoločný zámok v súbore state/gpu-lent.json.");
	}
	{ // browser
		const s = add("senses", "Capabilities");
		live(s, "senses");
		eyebrow(s, "senses", "agent-browser");
		title(s, "A real browser for the agent");
		tile(s, M, 2.0, 6.5, 3.7, { name: "b1", fill: "0B0B0C" });
		code(s, [
			{ text: "# in the #coding channel", options: { color: GRAY, breakLine: true } },
			{ text: "agent-browser open localhost:5173", options: { color: WHITE, breakLine: true } },
			{ text: "agent-browser snapshot   ", options: { color: WHITE } }, { text: "# buttons with refs", options: { color: GRAY, breakLine: true } },
			{ text: "agent-browser click @e12", options: { color: WHITE, breakLine: true } },
			{ text: "agent-browser console", options: { color: WHITE, breakLine: true } },
			{ text: "agent-browser screenshot shot.png", options: { color: WHITE } },
		], { x: M + 0.35, y: 2.35, w: 6.0, h: 3.1, objectName: "b1" });
		[["Tests what it just built", "dev server, click, console, screenshot"], ["Text, not pixels", "the page as an element tree with refs"], ["Screenshot to the chat", "proof via progress_update"]].forEach(([h, t], i) =>
			feature(s, 7.5, 2.0 + i * 1.28, 5.08, 1.14, h, t, 2 + i, { hs: 18, ts: 14, gap: 0.45 }));
		s.addNotes("Agent-browser od Vercel Labs: model nedostáva pixely, ale strom prvkov s krátkymi odkazmi ako @e12. Textový model s tým pracuje bez problémov. V #coding testuje, čo naprogramoval, a pošle screenshot ako dôkaz. LIVE: otvor stránku AI 4 DEV a pošli screenshot.");
	}
	{ // desktop
		const s = add("senses", "Capabilities");
		live(s, "senses");
		eyebrow(s, "senses", "agent-desktop");
		title(s, "It drives Windows apps too");
		tile(s, M, 2.0, 11.83, 2.95, { name: "b1", fill: "0B0B0C" });
		code(s, [
			{ text: "agent-desktop launch notepad", options: { color: WHITE, breakLine: true } },
			{ text: "agent-desktop snapshot --app Notepad -i", options: { color: WHITE, breakLine: true } },
			{ text: "agent-desktop set-value @s3hf…:e1 \"Hello\"", options: { color: WHITE, breakLine: true } },
			{ text: "agent-desktop screenshot --app Notepad", options: { color: WHITE, breakLine: true } },
			{ text: "{\"ok\":true,\"command\":\"launch\"}", options: { color: "30D158" } },
		], { x: M + 0.35, y: 2.3, w: 11, h: 2.5, objectName: "b1" });
		[["Accessibility tree", "like agent-browser, for windows"], ["Leaves the mouse alone", "I can keep working"], ["Local model only", "the screen never goes to the cloud"]].forEach(([h, t], i) =>
			feature(s, M + i * 4.03, 5.2, 3.79, 1.3, h, t, 2 + i, { hs: 18, ts: 14, gap: 0.45, hc: i === 2 ? SEC.senses.acc : WHITE }));
		s.addNotes("Agent-desktop, tiež od Vercel Labs: to isté pre aplikácie vo Windows, číta strom prvkov okna a klikne či napíše bez pohybu myšou. Pravidlo: desktop smie ovládať len lokálny model, inak by obrazovka odišla do cloudu. LIVE: otvor Poznámkový blok, napíš pozdrav, pošli screenshot.");
	}

	// ============================================================ 6 · REALITY
	await divider("reality", "Reality", "06", "What\nbroke", "And what it all costs.", IMG("broken.png"), "Posledná časť: poctivo, čo nefungovalo, a účet za elektrinu.");
	{ // failures
		const s = add("reality", "Reality");
		eyebrow(s, "reality", "Incidents");
		title(s, "Four bugs, four lessons");
		[["Armoury Crate ate the memory", "handle leak → commit limit → llama.cpp crashed with 0xc0000409"], ["Qwen kept thinking anyway", "it ignores reasoning-budget = 0; only reasoning = off worked"], ["The monitor woke the models", "WattLlama reloaded an unloaded model within 150 ms"], ["Forgotten dev servers", "5 servers ran for weeks, 4 of them on 0.0.0.0"]].forEach(([h, t], i) =>
			feature(s, M + (i % 2) * 6.0, 2.05 + Math.floor(i / 2) * 1.95, 5.83, 1.75, h, t, i + 1, { hs: 21, ts: 16, gap: 0.55 }));
		quote(s, "“Bugs are not failures. They are data. Sometimes rather expensive data.” — GLaDOS", { objectName: "b5" });
		s.addNotes("Llama.cpp náhodne padal s 0xc0000409 — vinník Armoury Crate od Asusu s únikom handle-ov, vyčerpal commit limit Windows. Qwen ignoruje reasoning-budget, pomohlo reasoning off. Môj vlastný WattLlama nahral uvoľnený model späť za 150 ms (opravené: autoload=false). A päť zabudnutých dev serverov, štyri na celej sieti — teraz len 127.0.0.1 a po teste vypnúť.");
	}
	{ // energy (WattLlama — the llama lives here)
		const s = add("reality", "Reality", { blank: true });
		s.addImage({ path: await melt(IMG("energy.png"), "energy", { stop: 0.55 }), x: 0, y: 0, w: W, h: H });
		eyebrow(s, "reality", "WattLlama");
		title(s, "What it costs", { w: 7 });
		T(s, "Measured 27 Oct – 2 Nov, electricity at CZK 6/kWh", { x: M, y: 1.75, w: 7, h: 0.4, fontSize: 16, color: GRAY, objectName: "sub" });
		T(s, "CZK 0.97", { x: M, y: 2.45, w: 6.5, h: 1.6, fontSize: 104, bold: true, color: SEC.reality.grad, objectName: "b1" });
		T(s, "for a whole week of AI work (0.16 kWh)", { x: M, y: 4.05, w: 6.5, h: 0.5, fontSize: 20, color: WHITE, objectName: "b1" });
		stat(s, "reality", M, 4.9, 2.9, "~CZK 6", "per million tokens above idle", 2, { tile: false, size: 36, bh: 0.65, ss: 14 });
		stat(s, "reality", M + 3.1, 4.9, 2.9, "CZK 70", "the whole PC 24/7 · 11.7 kWh · 67 W idle", 3, { tile: false, size: 36, bh: 0.65, ss: 14, white: true });
		s.addNotes("Vlastný nástroj WattLlama: meria spotrebu PC a priradí ju modelom podľa toho, kedy čo počítali. Za posledný týždeň celé PC 11,7 kWh, teda 70 Kč. Energia, kým modely naozaj pracovali, 0,16 kWh = 97 halierov. Milión vygenerovaných tokenov Qwenu nad kľudovou spotrebou ~1 kWh = ~6 Kč. Väčšinu účtu tvorí PC, ktoré čaká na otázku: 67 W v kľude.");
	}
	{ // close
		const s = add("intro", "Reality", { blank: true, transition: "morph" });
		movie(s, HERO, HERO_POSTER, { x: 7.0, y: 0.75, w: 5.6, h: 5.6, loop: true, dur: 60000, name: "!!hero" });
		T(s, "Test complete.", { x: M, y: 1.55, w: 6, h: 0.45, fontSize: 18, bold: true, color: GRAY2, objectName: "b1" });
		T(s, "Thank you", { x: M, y: 2.0, w: 6.4, h: 1.65, fontSize: 76, bold: true, color: SEC.intro.grad, objectName: "!!title" });
		T(s, "Lukas Chylik · github.com/depthark", { x: M, y: 3.65, w: 6.2, h: 0.5, fontSize: 20, bold: true, objectName: "b2" });
		T(s, "pi coding agent · llama.cpp · stable-diffusion.cpp\nQwen 3.6 · Qwen-Image 2.1 · LiquidAI d1 and LFM3-VL\nCactus Whistle · agent-browser and agent-desktop", { x: M, y: 4.35, w: 6.2, h: 1.1, fontSize: 14, color: GRAY, objectName: "b3" });
		tile(s, M, 5.75, 1.15, 1.15, { name: "b4", fill: "FFFFFF", r: 0.12 });
		s.addImage({ path: UP("qr-wattllama.png"), x: M + 0.07, y: 5.82, w: 1.01, h: 1.01, objectName: "b4" });
		T(s, [{ text: "WattLlama", options: { bold: true, color: WHITE, fontSize: 16, breakLine: true } }, { text: "github.com/depthark/wattllama", options: { color: GRAY2, fontSize: 13, fontFace: "Menlo" } }], { x: M + 1.4, y: 5.9, w: 5, h: 0.85, valign: "middle", objectName: "b4" });
		s.addNotes("Všetko, čo ste videli, beží na jednom hernom PC doma. Verejná časť je WattLlama, QR kód vás dovedie na GitHub. Dole projekty, na ktorých to stojí, všetky open-source. Ďakujem a pýtajte sa.");
	}

	await pres.writeFile({ fileName: OUT });
	await applyTheme(OUT, THEME);
	await postProcess(OUT, S);
	keynoteScript(S);
	console.log("wrote", OUT, S.length, "slides");
})();

// ------------------------------------------------------------------ post-process: gradients, builds, movies, transitions
const P14 = 'xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main"';
const TRANS = {
	fade: '<p:transition spd="med"><p:fade/></p:transition>',
	morph: `<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159"><p:transition spd="slow" ${P14} p14:dur="1250"><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>`,
};

/** Gradient text: the sentinel colour of each section becomes a left-to-right gradient. */
function gradients(xml) {
	for (const s of Object.values(SEC)) {
		xml = xml.split(`<a:solidFill><a:srgbClr val="${s.grad}"/></a:solidFill>`).join(
			`<a:gradFill flip="none" rotWithShape="1"><a:gsLst><a:gs pos="0"><a:srgbClr val="${s.from}"/></a:gs><a:gs pos="100000"><a:srgbClr val="${s.to}"/></a:gs></a:gsLst><a:lin ang="0" scaled="1"/></a:gradFill>`);
	}
	return xml;
}

/** Shape ids by build group (objectName "bN") and movie name, in document order. */
function shapeIds(xml) {
	const groups = {}, movies = {};
	for (const m of xml.matchAll(/<p:cNvPr id="(\d+)" name="([^"]*)"/g)) {
		const [, id, name] = m;
		const g = /^b(\d+)$/.exec(name);
		if (g) (groups[g[1]] ||= []).push(id);
		movies[name] ??= id; // every shape by name; movies are looked up by their names
	}
	return { groups, movies };
}

/** Make every cNvPr id unique (pptxgenjs numbers media from its rel ids, which can collide). */
function uniqueIds(xml) {
	const seen = new Set();
	let next = 1000;
	return xml.replace(/<p:cNvPr id="(\d+)"/g, (all, id) => {
		if (!seen.has(id)) { seen.add(id); return all; }
		while (seen.has(String(next))) next++;
		seen.add(String(next));
		return `<p:cNvPr id="${next}"`;
	});
}

/**
 * Timing: right after the transition, movies start and the build groups fade + float in, each
 * group 160 ms after the previous one. Everything is "after previous / with previous", so the
 * presenter's single click only ever moves to the next slide.
 */
function timing(groups, movies, info) {
	let id = 3;
	const cTn = () => ++id;
	const effects = [];
	const keys = Object.keys(groups).map(Number).sort((a, b) => a - b);
	const START = 250, STAGGER = 160, DUR = 700;
	for (const m of info.movies) {
		const spid = movies[m.name];
		if (!spid) continue;
		effects.push({ kind: "play", spid, delay: 0, dur: m.dur });
	}
	keys.forEach((k, i) => groups[k].forEach((spid) => effects.push({ kind: "build", spid, delay: START + i * STAGGER })));
	if (!effects.length) return "";
	let par = "";
	effects.forEach((e, i) => {
		const node = i === 0 ? "afterEffect" : "withEffect";
		if (e.kind === "play") {
			const a = cTn(), b = cTn();
			par += `<p:par><p:cTn id="${a}" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="${node}"><p:stCondLst><p:cond delay="${e.delay}"/></p:stCondLst><p:childTnLst>` +
				`<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="${b}" dur="${e.dur}" fill="hold"/><p:tgtEl><p:spTgt spid="${e.spid}"/></p:tgtEl></p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par>`;
		} else {
			const a = cTn(), b = cTn(), c = cTn(), d = cTn(), f = cTn();
			const tgt = `<p:tgtEl><p:spTgt spid="${e.spid}"/></p:tgtEl>`;
			par += `<p:par><p:cTn id="${a}" presetID="42" presetClass="entr" presetSubtype="0" fill="hold" nodeType="${node}"><p:stCondLst><p:cond delay="${e.delay}"/></p:stCondLst><p:childTnLst>` +
				`<p:set><p:cBhvr><p:cTn id="${b}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>${tgt}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>` +
				`<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${c}" dur="${DUR}"/>${tgt}</p:cBhvr></p:animEffect>` +
				`<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="${d}" dur="${DUR}" decel="100000" fill="hold"/>${tgt}<p:attrNameLst><p:attrName>ppt_x</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="#ppt_x"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_x"/></p:val></p:tav></p:tavLst></p:anim>` +
				`<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="${f}" dur="${DUR}" decel="100000" fill="hold"/>${tgt}<p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="#ppt_y+.035"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="#ppt_y"/></p:val></p:tav></p:tavLst></p:anim>` +
				`</p:childTnLst></p:cTn></p:par>`;
		}
	});
	const clickPar = cTn(), inner = cTn();
	let media = "";
	for (const m of info.movies) {
		const spid = movies[m.name];
		if (!spid) continue;
		media += `<p:video><p:cMediaNode vol="80000"><p:cTn id="${cTn()}" fill="hold" display="0"${m.loop ? ' repeatCount="indefinite"' : ""}><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cMediaNode></p:video>`;
	}
	return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` +
		`<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>` +
		`<p:par><p:cTn id="${clickPar}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond></p:stCondLst><p:childTnLst>` +
		`<p:par><p:cTn id="${inner}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>${par}</p:childTnLst></p:cTn></p:par>` +
		`</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` +
		media + `</p:childTnLst></p:cTn></p:par></p:tnLst>` +`</p:timing>`;
}

async function postProcess(file, slides) {
	const zip = await JSZip.loadAsync(fs.readFileSync(file));
	for (let i = 0; i < slides.length; i++) {
		const name = `ppt/slides/slide${i + 1}.xml`;
		let xml = uniqueIds(gradients(await zip.file(name).async("string")));
		const { groups, movies } = shapeIds(xml);
		xml = xml.replace(/<p:timing>[\s\S]*?<\/p:timing>/, "");
		const t = TRANS[slides[i].transition] || TRANS.fade;
		const tm = timing(groups, movies, slides[i]);
		if (xml.includes("</p:clrMapOvr>")) xml = xml.replace("</p:clrMapOvr>", `</p:clrMapOvr>${t}${tm}`);
		else xml = xml.replace("</p:cSld>", `</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${t}${tm}`);
		zip.file(name, xml);
	}
	for (const f of Object.keys(zip.files).filter((f) => /^ppt\/slideLayouts\/.*\.xml$/.test(f) || /^ppt\/slideMasters\/.*\.xml$/.test(f))) zip.file(f, gradients(await zip.file(f).async("string")));
	// the hero movie is on three slides: keep one copy and point the other slides at it
	const crypto = require("crypto");
	const first = {};
	const dup = {};
	for (const f of Object.keys(zip.files).filter((f) => /^ppt\/media\/.*\.mp4$/.test(f))) {
		const h = crypto.createHash("sha1").update(await zip.file(f).async("nodebuffer")).digest("hex");
		if (first[h]) dup[f.replace("ppt/media/", "")] = first[h].replace("ppt/media/", ""); else first[h] = f;
	}
	for (const r of Object.keys(zip.files).filter((f) => /^ppt\/slides\/_rels\/.*\.rels$/.test(f))) {
		let x = await zip.file(r).async("string");
		for (const [d, o] of Object.entries(dup)) x = x.split(`../media/${d}"`).join(`../media/${o}"`);
		zip.file(r, x);
	}
	for (const d of Object.keys(dup)) zip.remove(`ppt/media/${d}`);
	fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

/**
 * pptx-to-keynote.applescript, generated so its slide numbers always match the deck.
 * A PowerPoint transition plays when ENTERING its slide, a Keynote one when LEAVING it:
 * Morph into slide k = Magic Move on Keynote slide k-1.
 */
function keynoteScript(slides) {
	const magic = slides.map((s, i) => (s.transition === "morph" ? i : 0)).filter((k) => k > 0);
	const loops = slides.map((s, i) => (s.movies.some((m) => m.loop) ? i + 1 : 0)).filter(Boolean);
	const src = `-- Turns Pi-agent-Keynote.pptx into a native Keynote deck (Pi-agent-Keynote.key).
-- Generated by build.js (${slides.length} slides) - do not edit, rebuild instead.
-- Run on the Mac: open this file in Script Editor and press Run (or: osascript pptx-to-keynote.applescript).
-- Magic Move replaces PowerPoint Morph, Dissolve replaces Fade, ambient movies loop.
-- Keynote plays a slide's transition when LEAVING it, so Morph into slide k = Magic Move on slide k-1.

set magicSlides to {${magic.join(", ")}}
set loopSlides to {${loops.join(", ")}}

set pptx to choose file with prompt "Pick Pi-agent-Keynote.pptx" of type {"pptx", "org.openxmlformats.presentationml.presentation"}
tell application "Finder" to set outFolder to (container of pptx) as alias
set outPath to (POSIX path of outFolder) & "Pi-agent-Keynote.key"

tell application "Keynote"
	activate
	open pptx
	delay 3 -- import takes a moment; the import warnings sheet can stay open
	set doc to front document
	set n to count of slides of doc
	repeat with i from 1 to n
		tell slide i of doc
			if magicSlides contains i then
				set transition properties to {transition effect:magic move, transition duration:1.25, transition delay:0, automatic transition:false}
			else
				set transition properties to {transition effect:dissolve, transition duration:0.5, transition delay:0, automatic transition:false}
			end if
			if loopSlides contains i then
				repeat with m in (every movie)
					set repetition method of m to loop
				end repeat
			end if
		end tell
	end repeat
	save doc in POSIX file outPath
end tell

display dialog "Saved " & outPath & return & return & "Check builds and Magic Move in Play mode before the talk." buttons {"OK"} default button 1
`;
	for (const f of [path.join(__dirname, "pptx-to-keynote.applescript"), path.join(__dirname, "..", "pptx-to-keynote.applescript")]) fs.writeFileSync(f, src);
}
