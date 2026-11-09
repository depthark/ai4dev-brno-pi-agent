// Second batch: a mint "brain" for the agent section and a brighter hardware shot.
import fs from "node:fs";
import { generate } from "file:///C:/Users/chyli_rkuyf82/pi-stack/imagegen/imagegen.mjs";

const WIDE = { w: 1664, h: 928 };
const LEFT = "The subject is on the right half of the frame; the left half is calm, dark and empty for text.";
const jobs = {
	brain: `Cinematic 3D render of a glowing translucent glass brain made of fine circuit lines and tiny floating code symbols, mint green and teal light, dark background, volumetric rays, depth of field, ultra detailed. ${LEFT}`,
	hardware2: `Bright dramatic 3D product render of a modern gaming graphics card with glowing fans, memory sticks and a CPU chip floating in an exploded view, strong cyan and blue rim lighting, glossy reflections, dark blue background, octane render, highly detailed. ${LEFT}`,
};
for (const [name, prompt] of Object.entries(jobs)) {
	if (fs.existsSync(`img/${name}.png`)) continue;
	const r = await generate(prompt, [], { mode: "base", size: WIDE });
	fs.writeFileSync(`img/${name}.png`, r.png);
	console.log(name, `${(r.ms / 1000).toFixed(0)} s`);
}
