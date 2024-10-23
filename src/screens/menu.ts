import { BG, FG } from "../colors.js";
import { logo } from "./resource.js";

export class Menu {
	context: CanvasRenderingContext2D;

	constructor(context: CanvasRenderingContext2D) {
		this.context = context;
	}

	// Draw to the screen
	render() {
		// Clear the screen
		this.context.fillStyle = BG;
		this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.font = "14px monospace";

		// Render logo
		this._render_logo();
	}

	_render_logo() {
		const logoLines = logo.split("\n");

		// Calc logo size
		const logoWidth =
			logoLines.sort((a, b) => b.length - a.length)[0].length * this.context.measureText(" ").width;
		const logoHeight = logoLines.length * 18;

		// Print logo at center top
		this.context.fillStyle = FG;

		for (let i = 0; i < logoLines.length; i++) {
			this.context.fillText(
				logoLines[i],
				(this.context.canvas.width - logoWidth) / 2,
				(this.context.canvas.height - logoHeight - 600) / 2 + i * 18
			);
		}
	}

	// _render_calc_lines() {
	// 	const contentHight = this.context.canvas.height - this.style.padding * 2 - 20 - 18 * 2;
	// 	return Math.floor(contentHight / 18);
	// }

	// _render_cursor(lines: number) {
	// 	// Check if cursor outside of screen
	// 	if (this.state.cursorPosition.y - this.state.scrollPosition.y >= lines) {
	// 		// Scroll down
	// 		this.state.scrollPosition.y += this.state.cursorPosition.y - this.state.scrollPosition.y;
	// 	} else if (this.state.cursorPosition.y > this.state.scrollPosition.y + lines + 1) {
	// 		// Scroll up
	// 		this.state.scrollPosition.y = this.state.cursorPosition.y - lines;
	// 	}

	// 	// Normalize
	// 	this.state.scrollPosition.y = Math.max(
	// 		0,
	// 		Math.min(this.state.scrollPosition.y - lines + 1, this.state.content.length)
	// 	);

	// 	// Draw cursor
	// 	const localCursorPosition = {
	// 		x: this.state.cursorPosition.x - this.state.scrollPosition.x,
	// 		y: this.state.cursorPosition.y - this.state.scrollPosition.y,
	// 	};

	// 	const pos = [
	// 		this.style.padding + localCursorPosition.x * this.context.measureText(" ").width,
	// 		this.style.padding + 22 + localCursorPosition.y * 18,
	// 	];

	// 	if (document.hasFocus() || true) {
	// 		this.context.fillStyle = FG;
	// 		this.context.fillRect(pos[0], pos[1], 10, 18);

	// 		try {
	// 			// Redraw character
	// 			if (this.state.cursorPosition.y < this.state.content.length) {
	// 				if (
	// 					this.state.cursorPosition.x < this.state.content[this.state.cursorPosition.y].length
	// 				) {
	// 					this.context.fillStyle = BG;
	// 					this.context.fillText(
	// 						this.state.content[this.state.cursorPosition.y][this.state.cursorPosition.x],
	// 						this.style.padding +
	// 							(this.state.scrollPosition.x - this.state.scrollPosition.x) *
	// 								this.context.measureText(" ").width,
	// 						this.style.padding +
	// 							22 +
	// 							(this.state.scrollPosition.y - this.state.scrollPosition.y) * 18 +
	// 							14
	// 					);
	// 				}
	// 			}
	// 		} catch {
	// 			console.log(JSON.stringify(this.state.cursorPosition));
	// 			console.log(JSON.stringify(this.state.content));
	// 		}
	// 	} else {
	// 		this.context.strokeStyle = FG;
	// 		this.context.strokeRect(pos[0], pos[1], 10, 18);
	// 	}
	// }

	// _render_buffer(lines: number) {
	// 	// Scroll screen
	// 	this.context.fillStyle = FG;

	// 	for (
	// 		let i = this.state.scrollPosition.y;
	// 		i < lines + this.state.scrollPosition.y && i < this.state.content.length;
	// 		i++
	// 	) {
	// 		this.context.fillText(
	// 			this.state.content[i],
	// 			this.style.padding,
	// 			this.style.padding + 36 + (i - this.state.scrollPosition.y) * this.style.lineHeight
	// 		);
	// 	}
	// }

	// _render_top_bar() {
	// 	// Bar
	// 	this.context.fillStyle = FG;
	// 	this.context.fillRect(
	// 		this.style.padding,
	// 		this.style.padding,
	// 		this.context.canvas.width - this.style.padding * 2,
	// 		20
	// 	);

	// 	// Filename
	// 	this.context.fillStyle = BG;
	// 	this.context.fillText(this.name, (this.context.canvas.width - this.name.length * 14) / 2, 20);
	// }

	// _render_bottom_menu() {
	// 	let options: string[] = [];

	// 	switch (this.state.mode) {
	// 		case ScreenGlobalState.WRITING:
	// 			options = ["^G Help", "^X Exit", "^R Reload"];
	// 			break;
	// 		case ScreenGlobalState.EXITING:
	// 			options = [" Y Yes", " N No", "^C Cancel"];
	// 			break;
	// 		case ScreenGlobalState.HELP:
	// 			options = ["^X Exit"];
	// 			break;
	// 		case ScreenGlobalState.SAVING:
	// 			options = [" ↵ Save", "^C Cancel"];
	// 			break;
	// 	}

	// 	// Bottom options
	// 	for (let i = 0; i < options.length; i++) {
	// 		const leftPos = Math.floor(i / 2);
	// 		const topPos = i % 2;

	// 		// Draw background box
	// 		this.context.fillStyle = FG;
	// 		this.context.fillRect(
	// 			this.style.padding + leftPos * 240,
	// 			this.context.canvas.height - this.style.padding - 18 - topPos * 18,
	// 			18,
	// 			18
	// 		);

	// 		// Draw Shortcut text
	// 		this.context.fillStyle = BG;
	// 		this.context.fillText(
	// 			options[i].slice(0, 2),
	// 			this.style.padding + leftPos * 240,
	// 			this.context.canvas.height - this.style.padding - topPos * 18 - 3
	// 		);

	// 		// Draw option text
	// 		this.context.fillStyle = FG;
	// 		this.context.fillText(
	// 			options[i].slice(2),
	// 			this.style.padding + leftPos * 240 + 16,
	// 			this.context.canvas.height - this.style.padding - topPos * 18 - 3
	// 		);
	// 	}

	// 	// Draw status bar
	// 	this.context.fillStyle = FG;
	// 	switch (this.state.mode) {
	// 		case ScreenGlobalState.WRITING:
	// 		case ScreenGlobalState.EXITING:
	// 		case ScreenGlobalState.HELP:
	// 			this.context.fillStyle = FG;
	// 			switch (this.state.statusStyle) {
	// 				case "full":
	// 					this.context.fillRect(
	// 						this.style.padding,
	// 						this.context.canvas.height - this.style.padding - 18 - 18 * 2,
	// 						this.context.canvas.width - this.style.padding * 2,
	// 						18
	// 					);
	// 					this.context.fillStyle = BG;
	// 					this.context.fillText(
	// 						this.state.status,
	// 						this.style.padding,
	// 						this.context.canvas.height - this.style.padding - 18 - 22
	// 					);
	// 					break;
	// 				case "middle":
	// 					const textWidth = this.context.measureText(this.state.status).width;
	// 					this.context.fillRect(
	// 						(this.context.canvas.width - textWidth) / 2 - 6,
	// 						this.context.canvas.height - this.style.padding - 18 - 18 * 2,
	// 						textWidth + 12,
	// 						18
	// 					);
	// 					this.context.fillStyle = BG;
	// 					this.context.fillText(
	// 						this.state.status,
	// 						(this.context.canvas.width - textWidth) / 2,
	// 						this.context.canvas.height - this.style.padding - 18 - 22
	// 					);
	// 			}
	// 			break;
	// 		case ScreenGlobalState.SAVING:
	// 			throw new Error("Not implemented");
	// 	}
	// }

	// Handle keyboard input
	key(event: KeyboardEvent) {
		// // Shortcuts
		// if (event.ctrlKey) {
		// 	//this.state.handleCommand("CTL-" + event.key);
		// }

		// // Cursor movement
		// if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) {
		// 	this.state.moveCursor(
		// 		event.key === "ArrowLeft"
		// 			? [-1, 0]
		// 			: event.key === "ArrowRight"
		// 			? [1, 0]
		// 			: event.key === "ArrowDown"
		// 			? [0, -1]
		// 			: event.key === "ArrowUp"
		// 			? [0, 1]
		// 			: [0, 0],
		// 		event.ctrlKey
		// 	);
		// }

		// // Delete text - Delete
		// if (event.key === "Delete") {
		// 	this.state.delete(event.ctrlKey);
		// }

		// // Delete text - Backspace
		// if (event.key === "Backspace") {
		// 	this.state.backspace(event.ctrlKey);
		// }

		// // New line - Enter
		// if (event.key === "Enter") {
		// 	this.state.enter();
		// }

		// // Normal typing!
		// // From: https://stackoverflow.com/questions/51296562/how-to-tell-whether-keyboardevent-key-is-a-printable-character-or-control-charac
		// if (event.key.length == 1 || (event.key.length > 1 && /[^a-zA-Z0-9]/.test(event.key))) {
		// 	this.state.type(event.key);
		// } else if (event.key === "Spacebar") {
		// 	this.state.type(" ");
		// }

		// Fallback
		console.log(event.key);
	}
}

// Design spec:
/*
Padding 4 px
Top bar 20px
First line 16px
Content 18px per line 

[Bar 18px]
Options 18px
Options 18px
Padding 4px
*/
//TODO: scrolling
