import { CanvasScreen } from "./canvasscreen.js";

// src/main.ts
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
const screen = new CanvasScreen("New Buffer", context);

function renderFrame() {
	screen.render();
	requestAnimationFrame(renderFrame);
}

requestAnimationFrame(renderFrame);

// Handle keyboard input
document.onkeydown = (event) => {
	screen.key(event);
};
