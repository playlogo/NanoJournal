import { Manager } from "./manager.js";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

// Scale canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

// Simple text writing
const manager = new Manager(context, true);

function renderFrame() {
	manager.render();
	requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);
