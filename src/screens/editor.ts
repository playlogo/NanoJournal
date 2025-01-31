import { BG, FG, FONT_NORMAL, LINE_HEIGHT, PADDING } from "../style.js";
import { StorageAdapter } from "../storage.js";
import { cyrb53 } from "../utils.js";
import { ScreenModeWriting, ScreenModeExiting, ScreenModeSaving } from "./editor_modes.js";

export const ScreenGlobalState = {
	WRITING: new ScreenModeWriting(),
	EXITING: new ScreenModeExiting(),
	HELP: new ScreenModeWriting(),
	SAVING: new ScreenModeSaving(),
};

export class ScreenState {
	mode: any = ScreenGlobalState.WRITING;

	fileName = "";
	content: string[] = [""];
	initialHash = 0;

	status = "";
	statusStyle: "full" | "middle" = "middle";

	cursorPosition = { x: 0, y: 0 };
	scrollPosition = { x: 0, y: 0 };

	storageAdapter: StorageAdapter;
	closeCallback: () => void;

	constructor(fileName: string, storageAdapter: StorageAdapter, closeCallback: () => void) {
		this.fileName = fileName;

		this.storageAdapter = storageAdapter;
		this.closeCallback = closeCallback;

		if (fileName.length > 0) {
			setTimeout(() => {
				try {
					this.content = this.storageAdapter.loadNote(this.fileName);
				} catch {
					this.content = ["Error: File not found"];
				}
				this.initialHash = cyrb53(JSON.stringify(this.content));
			}, 10);
		}
	}

	updateStatus() {
		if (this.mode === ScreenGlobalState.WRITING) {
			this.status = `[ ${this.fileName.length == 0 ? "New Buffer" : this.fileName} | ${
				this.content.length
			} lines ]`;
		}
	}
}

export class Editor {
	name: string;
	context: CanvasRenderingContext2D;

	state: ScreenState;

	constructor(
		name: string,
		context: CanvasRenderingContext2D,
		storageAdapter: StorageAdapter,
		closeCallback: () => void
	) {
		this.name = name;
		this.context = context;

		this.state = new ScreenState(this.name, storageAdapter, closeCallback);
	}

	// Draw to the screen
	render() {
		// Clear the screen
		this.context.fillStyle = BG;
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.font = FONT_NORMAL;
		this.context.beginPath();

		// Calc possible lines
		const lines = this._render_calc_lines();

		// Update state
		this.state.updateStatus();

		// Draw top bar
		this._render_top_bar();

		// Draw text
		this._render_buffer(lines);

		// Draw cursor
		if (this.state.mode === ScreenGlobalState.WRITING) {
			this._render_cursor(lines);
		}

		// Render menu at bottom
		this._render_bottom_menu();
	}

	_render_calc_lines() {
		const contentHight = this.context.canvas.height - PADDING * 2 - 20 - LINE_HEIGHT * 2;
		return Math.floor(contentHight / LINE_HEIGHT);
	}

	_render_cursor(lines: number) {
		// Check if cursor outside of screen
		if (this.state.cursorPosition.y - this.state.scrollPosition.y >= lines) {
			// Scroll down
			this.state.scrollPosition.y += this.state.cursorPosition.y - this.state.scrollPosition.y;
		} else if (this.state.cursorPosition.y > this.state.scrollPosition.y + lines + 1) {
			// Scroll up
			this.state.scrollPosition.y = this.state.cursorPosition.y - lines;
		}

		// Normalize
		this.state.scrollPosition.y = Math.max(
			0,
			Math.min(this.state.scrollPosition.y - lines + 1, this.state.content.length)
		);

		// Draw cursor
		const localCursorPosition = {
			x: this.state.cursorPosition.x - this.state.scrollPosition.x,
			y: this.state.cursorPosition.y - this.state.scrollPosition.y,
		};

		const pos = [
			PADDING + localCursorPosition.x * this.context.measureText(" ").width,
			PADDING + 22 + localCursorPosition.y * LINE_HEIGHT,
		];

		if (document.hasFocus()) {
			this.context.fillStyle = FG;
			this.context.fillRect(pos[0], pos[1], 10, LINE_HEIGHT);

			try {
				// Redraw character
				if (this.state.cursorPosition.y < this.state.content.length) {
					if (
						this.state.cursorPosition.x < this.state.content[this.state.cursorPosition.y].length
					) {
						this.context.fillStyle = BG;
						this.context.fillText(
							this.state.content[this.state.cursorPosition.y][this.state.cursorPosition.x],
							pos[0],
							pos[1] + 14
						);
					}
				}
			} catch {
				console.log(JSON.stringify(this.state.cursorPosition));
				console.log(JSON.stringify(this.state.content));
			}
		} else {
			this.context.strokeStyle = FG;
			this.context.strokeRect(pos[0], pos[1], 10, LINE_HEIGHT);
		}
	}

	_render_buffer(lines: number) {
		// Scroll screen
		this.context.fillStyle = FG;

		const tag_colors: { [key: string]: string } = {
			home: "#8bd4a1",
			school: "#f59153",
			fallback: "#d34a4f",
			log: "#d9ceec",
		};

		for (
			let i = this.state.scrollPosition.y;
			i < lines + this.state.scrollPosition.y && i < this.state.content.length;
			i++
		) {
			// Extract tags
			let content = this.state.content[i];
			const CHARACTER_WIDTH = this.context.measureText(" ").width;

			while (true) {
				// Replace each tag one by one
				const regex = /(.*)#([\w]+)/g;

				let m;
				let ran = false;

				while ((m = regex.exec(content)) !== null) {
					if (m.index === regex.lastIndex) {
						regex.lastIndex++;
					}

					ran = true;

					const character_offset = m[1].length;
					const tag = m[2];
					let color: string = tag_colors[tag];

					if (!color) {
						color = tag_colors["fallback"];
					}

					this.context.fillStyle = color;
					this.context.roundRect(
						PADDING - 2 + character_offset * CHARACTER_WIDTH,
						36 + (i - this.state.scrollPosition.y) * LINE_HEIGHT - 10,
						tag.length * CHARACTER_WIDTH + 16,
						LINE_HEIGHT + 2,
						4
					);
					this.context.fill();

					// Replace in content
					content =
						content.slice(0, character_offset) +
						" ".repeat(tag.length) +
						content.slice(character_offset + tag.length + 1);
				}

				if (!ran) {
					break;
				}
			}

			// Replace all origin tags
			const regex = /#([\w]+)/gm;
			content = content.replace(regex, `    `);

			this.context.fillStyle = "white";

			this.context.fillText(
				this.state.content[i],
				PADDING,
				PADDING + 36 + (i - this.state.scrollPosition.y) * LINE_HEIGHT
			);
		}
	}

	_render_top_bar() {
		// Bar
		this.context.fillStyle = FG;
		this.context.fillRect(PADDING, PADDING, this.context.canvas.width - PADDING * 2, 20);

		// Filename
		this.context.fillStyle = BG;
		this.context.fillText(
			this.name.length > 0 ? this.name : "New Buffer",
			(this.context.canvas.width - this.name.length * 14) / 2,
			20
		);
	}

	_render_bottom_menu() {
		let options: string[] = [];

		switch (this.state.mode) {
			case ScreenGlobalState.WRITING:
				options = ["^G Help", "^X Exit", "^R Reload"];
				break;
			case ScreenGlobalState.EXITING:
				options = [" Y Yes", " N No", "^C Cancel"];
				break;
			case ScreenGlobalState.HELP:
				options = ["^X Exit"];
				break;
			case ScreenGlobalState.SAVING:
				options = [" ↵ Save", "^C Cancel"];
				break;
		}

		// Bottom options
		for (let i = 0; i < options.length; i++) {
			const leftPos = Math.floor(i / 2);
			const topPos = i % 2;

			// Draw background box
			this.context.fillStyle = FG;
			this.context.fillRect(
				PADDING + leftPos * 240,
				this.context.canvas.height - PADDING - LINE_HEIGHT - topPos * LINE_HEIGHT,
				18,
				18
			);

			// Draw Shortcut text
			this.context.fillStyle = BG;
			this.context.fillText(
				options[i].slice(0, 2),
				PADDING + leftPos * 240,
				this.context.canvas.height - PADDING - topPos * LINE_HEIGHT - 3
			);

			// Draw option text
			this.context.fillStyle = FG;
			this.context.fillText(
				options[i].slice(2),
				PADDING + leftPos * 240 + 16,
				this.context.canvas.height - PADDING - topPos * LINE_HEIGHT - 3
			);
		}

		// Draw status bar
		this.context.fillStyle = FG;
		switch (this.state.mode) {
			case ScreenGlobalState.WRITING:
			case ScreenGlobalState.EXITING:
			case ScreenGlobalState.HELP:
				this.context.fillStyle = FG;
				switch (this.state.statusStyle) {
					case "full":
						this.context.fillRect(
							PADDING,
							this.context.canvas.height - PADDING - LINE_HEIGHT * 3,
							this.context.canvas.width - PADDING * 2,
							18
						);
						this.context.fillStyle = BG;
						this.context.fillText(
							this.state.status,
							PADDING,
							this.context.canvas.height - PADDING - LINE_HEIGHT - 22
						);
						break;
					case "middle":
						const textWidth = this.context.measureText(this.state.status).width;
						this.context.fillRect(
							(this.context.canvas.width - textWidth) / 2 - 6,
							this.context.canvas.height - PADDING - LINE_HEIGHT * 3,
							textWidth + 12,
							18
						);
						this.context.fillStyle = BG;
						this.context.fillText(
							this.state.status,
							(this.context.canvas.width - textWidth) / 2,
							this.context.canvas.height - PADDING - LINE_HEIGHT - 22
						);
				}
				break;
			case ScreenGlobalState.SAVING:
				// Background
				this.context.fillRect(
					PADDING,
					this.context.canvas.height - PADDING - LINE_HEIGHT * 3,
					this.context.canvas.width - PADDING * 2,
					18
				);

				// Text
				const prefix = "File Name to Write: ";
				this.context.fillStyle = BG;

				this.context.fillText(
					prefix + this.state.fileName,
					PADDING,
					this.context.canvas.height - PADDING - LINE_HEIGHT - 22
				);

				// Cursor
				this.context.fillRect(
					PADDING +
						(prefix.length + this.state.mode.fileNameCursorPosition!) *
							this.context.measureText(" ").width,
					this.context.canvas.height - PADDING - LINE_HEIGHT - 35,
					10,
					18
				);

				// Redraw character
				this.context.fillStyle = FG;
				this.context.fillText(
					this.state.fileName[this.state.mode.fileNameCursorPosition!] ?? " ",
					PADDING +
						(prefix.length + this.state.mode.fileNameCursorPosition!) *
							this.context.measureText(" ").width,
					this.context.canvas.height - PADDING - LINE_HEIGHT - 22
				);
		}
	}

	// Handle keyboard input
	key(event: KeyboardEvent) {
		// Shortcuts
		if (event.ctrlKey) {
			const hit = this.state.mode.handleCommand("CTL-" + event.key, this.state);

			if (hit) {
				event.preventDefault();
				return;
			}
		}

		// Cursor movement
		if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) {
			this.state.mode.moveCursor(
				event.key === "ArrowLeft"
					? [-1, 0]
					: event.key === "ArrowRight"
					? [1, 0]
					: event.key === "ArrowDown"
					? [0, -1]
					: event.key === "ArrowUp"
					? [0, 1]
					: [0, 0],
				event.ctrlKey,
				this.state
			);
		}

		// Delete text - Delete
		if (event.key === "Delete") {
			this.state.mode.delete(event.ctrlKey, this.state);
			event.preventDefault();
			return;
		}

		// Delete text - Backspace
		if (event.key === "Backspace") {
			this.state.mode.backspace(event.ctrlKey, this.state);
			event.preventDefault();
			return;
		}

		// New line - Enter
		if (event.key === "Enter") {
			this.state.mode.enter(this.state);
			event.preventDefault();
			return;
		}

		// Normal typing!
		// From: https://stackoverflow.com/questions/51296562/how-to-tell-whether-keyboardevent-key-is-a-printable-character-or-control-charac
		if (event.key.length == 1 || (event.key.length > 1 && /[^a-zA-Z0-9]/.test(event.key))) {
			this.state.mode.type(event.key, this.state);
			event.preventDefault();
			return;
		} else if (event.key === "Spacebar") {
			this.state.mode.type(" ", this.state);
			event.preventDefault();
			return;
		} else if (event.key === "Tab") {
			for (let i = 0; i < 4; i++) {
				this.state.mode.type(" ", this.state);
			}
			event.preventDefault();
			return;
		}

		// Home and End
		if (event.key === "Home") {
			this.state.cursorPosition.x = 0;
			event.preventDefault();
			return;
		} else if (event.key === "End") {
			this.state.cursorPosition.x = this.state.content[this.state.cursorPosition.y].length;
			event.preventDefault();
			return;
		}

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
