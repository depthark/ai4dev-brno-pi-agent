// Multi-token prediction, animated: the same code line written without and with the MTP draft
// head. With MTP each step also guesses 2 tokens ahead; the guesses that check out are kept.
// 8 s loop baked three times. Writes img/mtp.mp4.
import { render, preview, text, seg, easeOut, clamp, esc } from "./lib.mjs";

const W = 1920, H = 1080, LOOP = 8, STEP = 0.6;
const CODE = ["def", " fib", "(", "n", "):", " return", " n", " if", " n", " <", " 2", " else", " fib", "(", "n", " -", " 1", ")", " +", " fib", "(", "n", " -", " 2", ")"];
const ACC = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0]; // extra drafts accepted per step (≈ 1.44 tokens / step)
const CW = 24.2, X0 = 120, MONO = "Consolas, Menlo, Courier New";

const xOf = (i) => X0 + CODE.slice(0, i).join("").length * CW;
const tok = (i, y, { color = "#F5F5F7", opacity = 1, box = null } = {}) => {
	if (i >= CODE.length || opacity <= 0.001) return "";
	const s = CODE[i], lead = s.startsWith(" ") ? 1 : 0, word = s.trim();
	const x = xOf(i) + lead * CW;
	let out = "";
	if (box) out += `<rect x="${(x - 5).toFixed(1)}" y="${y - 42}" width="${(word.length * CW + 10).toFixed(1)}" height="56" rx="10" fill="${box.fill}" stroke="${box.stroke}" stroke-width="2" ${box.dash ? 'stroke-dasharray="6 5"' : ""} opacity="${opacity.toFixed(3)}"/>`;
	return out + `<text x="${x.toFixed(1)}" y="${y}" font-family="${MONO}" font-size="44" fill="${color}" opacity="${opacity.toFixed(3)}">${esc(word)}</text>`;
};

function frame(time) {
	const t = time % LOOP;
	const fade = 1 - seg(t, LOOP - 0.4, LOOP);
	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
<radialGradient id="bg" cx="0.5" cy="0.8" r="0.7"><stop offset="0" stop-color="#140A22"/><stop offset="0.8" stop-color="#020203"/><stop offset="1" stop-color="#000"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
	const s = Math.floor(t / STEP), local = (t - s * STEP) / STEP;

	// row A: one token per step
	const yA = 660, yB = 900;
	svg += text(X0, yA - 80, "without MTP", { size: 30, weight: 700, color: "#8E8E93", spacing: 2 });
	svg += text(X0 + 270, yA - 80, "36.5 tok/s", { size: 30, weight: 500, color: "#8E8E93" });
	for (let i = 0; i <= s && i < CODE.length; i++) svg += tok(i, yA, { color: "#A1A1A6", opacity: (i === s ? easeOut(clamp(local / 0.3)) : 1) * fade });
	if (s < CODE.length) { const cx = xOf(s + 1) + 4; svg += `<rect x="${cx}" y="${yA - 40}" width="3" height="52" fill="#A1A1A6" opacity="${(0.4 + 0.6 * (local < 0.5 ? 1 : 0)) * fade}"/>`; }

	// row B: one token + two drafts per step, accepted drafts stay
	svg += text(X0, yB - 80, "with MTP", { size: 30, weight: 700, color: "#BF5AF2", spacing: 2 });
	svg += text(X0 + 200, yB - 80, "52.4 tok/s", { size: 30, weight: 700, color: "#F5F5F7" });
	let c = 0;
	for (let j = 0; j < s; j++) c += 1 + (ACC[j] || 0);
	for (let i = 0; i < c && i < CODE.length; i++) svg += tok(i, yB, { opacity: fade });
	const acc = ACC[s] ?? 0;
	const appear = easeOut(clamp(local / 0.25));
	const verdict = seg(local, 0.5, 0.75);
	svg += tok(c, yB, { opacity: appear * fade });
	for (let d = 1; d <= 2; d++) {
		const keep = d <= acc;
		if (verdict <= 0) svg += tok(c + d, yB, { color: "#D9A6F5", opacity: appear * 0.9 * fade, box: { fill: "rgba(191,90,242,0.14)", stroke: "rgba(191,90,242,0.9)", dash: true } });
		else if (keep) svg += tok(c + d, yB, { opacity: fade, box: { fill: `rgba(48,209,88,${(0.25 * (1 - verdict)).toFixed(3)})`, stroke: `rgba(48,209,88,${(0.9 * (1 - verdict)).toFixed(3)})` } });
		else svg += tok(c + d, yB, { color: "#FF453A", opacity: (1 - verdict) * 0.8 * fade, box: { fill: "rgba(255,69,58,0.12)", stroke: "rgba(255,69,58,0.7)", dash: true } });
	}
	// legend
	const lg = 1010;
	svg += `<rect x="${X0}" y="${lg - 20}" width="22" height="22" rx="5" fill="rgba(191,90,242,0.2)" stroke="#BF5AF2" stroke-dasharray="4 3" stroke-width="2"/>`;
	svg += text(X0 + 34, lg, "MTP head draft", { size: 22, color: "#A1A1A6", weight: 500 });
	svg += `<rect x="${X0 + 230}" y="${lg - 20}" width="22" height="22" rx="5" fill="rgba(48,209,88,0.25)" stroke="#30D158" stroke-width="2"/>`;
	svg += text(X0 + 264, lg, "verified, accepted", { size: 22, color: "#A1A1A6", weight: 500 });
	svg += `<rect x="${X0 + 500}" y="${lg - 20}" width="22" height="22" rx="5" fill="rgba(255,69,58,0.15)" stroke="#FF453A" stroke-dasharray="4 3" stroke-width="2"/>`;
	svg += text(X0 + 534, lg, "rejected", { size: 22, color: "#A1A1A6", weight: 500 });
	return svg + "</svg>";
}

if (process.env.PREVIEW) await preview("mtp", frame, [0.2, 0.45, 2.0, 4.3, 6.9, 7.7], { w: W, h: H });
else await render("mtp", { w: W, h: H, dur: LOOP * 3, frame });
