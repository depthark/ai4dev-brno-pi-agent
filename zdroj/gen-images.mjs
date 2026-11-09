// Draw the Keynote deck's 3D art on our own stack (Qwen-Image 2.1 base), 16:9.
import fs from "node:fs";
import { generate } from "file:///C:/Users/chyli_rkuyf82/pi-stack/imagegen/imagegen.mjs";

const WIDE = { w: 1664, h: 928 };
const LEFT = "The subject is on the right half of the frame; the left half is calm, dark and empty for text.";
const jobs = {
	cover: `Cinematic 3D render of a majestic llama made of glowing translucent glass and fine golden circuitry, standing on a reflective black floor in a dark futuristic laboratory, volumetric orange and cyan light beams, haze, depth of field, ultra detailed. ${LEFT}`,
	hardware: `Dramatic 3D render, exploded view of a gaming PC: graphics card, memory sticks, CPU and motherboard floating apart in dark space, glowing cyan edge light, tiny particles, octane render, cinematic. ${LEFT}`,
	moe: `Abstract 3D render of a huge cube built from hundreds of small glass cubes floating in darkness, exactly eight small cubes glow bright orange, all others are dim blue glass, cinematic lighting, reflections. ${LEFT}`,
	agent: `3D render of floating glass chat bubbles connected by glowing fiber optic light beams to a central spherical robotic core, deep purple and magenta lighting, dark background, cinematic, depth of field. ${LEFT}`,
	voice: `3D render of a sound wave sculpture made of liquid glass ribbons, glowing magenta and violet light, black background, cinematic macro photography. ${LEFT}`,
	vision: `Extreme close-up 3D render of a robotic camera eye with a large glass lens, the lens reflects snowy mountain peaks, teal and white light, dark background, cinematic. ${LEFT}`,
	broken: `Pixar style 3D render of a small cute robot sitting on the floor among tangled cables and small sparks, looking guilty, dark room lit by a red warning lamp, cinematic. ${LEFT}`,
	energy: `3D render of a glowing glass electricity meter with a tiny llama figurine standing on top, green and gold light, dark background, cinematic studio lighting. ${LEFT}`,
	portal: `Cinematic 3D render of a large ring portal of orange light in a dark laboratory, a glass llama walking through it toward the viewer, volumetric fog, reflections on the floor. ${LEFT}`,
};
fs.mkdirSync("img", { recursive: true });
for (const [name, prompt] of Object.entries(jobs)) {
	if (fs.existsSync(`img/${name}.png`)) continue;
	const r = await generate(prompt, [], { mode: "base", size: WIDE });
	fs.writeFileSync(`img/${name}.png`, r.png);
	console.log(name, `${r.width}x${r.height}`, `${(r.ms / 1000).toFixed(0)} s`);
}
