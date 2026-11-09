// Original animated "AI core eye" for the cover (a stand-in until a real clip is dropped in as
// img/glados.mp4). 6 s seamless loop at 30 fps, baked 10× (60 s) in case Keynote does not loop movies.
import { render } from "./lib.mjs";

const S = 1080, C = 360, BG = "#000000", LOOP = 6;

function frame(t) {
	const a = 2 * Math.PI * t;
	const rot = t * 45;
	const px = 26 * Math.sin(a), py = 12 * Math.sin(2 * a);
	const pulse = 0.78 + 0.22 * Math.sin(a * 2);
	const seg = (r1, r2, n, gap, fill, rotDeg) => Array.from({ length: n }, (_, i) => {
		const s = (i * 360) / n + gap / 2 + rotDeg, e = ((i + 1) * 360) / n - gap / 2 + rotDeg;
		const p = (r, d) => [C + r * Math.cos((d * Math.PI) / 180), C + r * Math.sin((d * Math.PI) / 180)];
		const [a1, b1] = p(r2, s), [a2, b2] = p(r2, e), [a3, b3] = p(r1, e), [a4, b4] = p(r1, s);
		return `<path d="M${a1},${b1} A${r2},${r2} 0 0 1 ${a2},${b2} L${a3},${b3} A${r1},${r1} 0 0 0 ${a4},${b4} Z" fill="${fill}"/>`;
	}).join("");
	const scanY = C - 200 + ((t * 2) % 1) * 400;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 720 720">
<defs>
<radialGradient id="bg" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#1A1408"/><stop offset="0.85" stop-color="#000"/><stop offset="1" stop-color="#000"/></radialGradient>
<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="rgba(255,190,60,${0.55 * pulse})"/><stop offset="0.45" stop-color="rgba(255,140,30,${0.18 * pulse})"/><stop offset="1" stop-color="rgba(255,140,30,0)"/></radialGradient>
<radialGradient id="iris" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF6C8"/><stop offset="0.35" stop-color="#FFD24A"/><stop offset="0.75" stop-color="#FF9A1F"/><stop offset="1" stop-color="#B34A00"/></radialGradient>
<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9ECF5"/><stop offset="0.5" stop-color="#8E95AC"/><stop offset="1" stop-color="#3A3F55"/></linearGradient>
<clipPath id="lens"><circle cx="${C}" cy="${C}" r="150"/></clipPath>
</defs>
<rect width="720" height="720" fill="url(#bg)"/>
<circle cx="${C}" cy="${C}" r="340" fill="url(#glow)"/>
${seg(255, 300, 8, 6, "url(#metal)", rot)}
${seg(205, 240, 12, 4, "#2A2F45", -rot * (4 / 3))}
<circle cx="${C}" cy="${C}" r="190" fill="#0B0D1C" stroke="#4A5070" stroke-width="3"/>
<circle cx="${C}" cy="${C}" r="168" fill="none" stroke="rgba(255,200,80,${0.5 * pulse})" stroke-width="4"/>
<g clip-path="url(#lens)">
<circle cx="${C}" cy="${C}" r="150" fill="#120E08"/>
<circle cx="${C + px}" cy="${C + py}" r="${92 + 6 * pulse}" fill="url(#iris)"/>
<circle cx="${C + px}" cy="${C + py}" r="30" fill="#FFFBEA"/>
<rect x="0" y="${scanY}" width="${S}" height="6" fill="rgba(255,240,200,0.18)"/>
<ellipse cx="${C - 55}" cy="${C - 70}" rx="46" ry="22" fill="rgba(255,255,255,0.22)" transform="rotate(-30 ${C - 55} ${C - 70})"/>
</g>
</svg>`;
}

await render("eye", { w: S, h: S, dur: LOOP * 10, frame: (time) => frame((time % LOOP) / LOOP) });
