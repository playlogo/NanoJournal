import { BG, FG, FONT_NORMAL, LINE_HEIGHT, PADDING } from "../style.js";
import { Note, StorageAdapter } from "../storage.js";
import { cyrb53 } from "../utils.js";
import { ScreenModeWriting, ScreenModeExiting, ScreenModeSaving } from "./editor_modes.js";
import { ManagerState } from "../manager.js";

export const ScreenGlobalState = {
	WRITING: new ScreenModeWriting(),
	EXITING: new ScreenModeExiting(),
	HELP: new ScreenModeWriting(),
	SAVING: new ScreenModeSaving(),
};

export class ScreenState {
	mode: any = ScreenGlobalState.WRITING;

	note: Note;
	content: string[] = [""];
	initialHash = 0;

	status = "";
	statusStyle: "full" | "middle" = "middle";

	cursorPosition = { x: 0, y: 0 };
	scrollPosition = { x: 0, y: 0 };

	selection: undefined | { start: { x: number; y: number }; end: { x: number; y: number } } = undefined;

	storageAdapter: StorageAdapter;
	managerState: ManagerState;
	closeCallback: () => void;

	constructor(
		note: Note,
		storageAdapter: StorageAdapter,
		managerState: ManagerState,
		closeCallback: () => void
	) {
		this.note = note;

		this.storageAdapter = storageAdapter;
		this.managerState = managerState;
		this.closeCallback = closeCallback;

		if (this.note.filename.length > 0) {
			setTimeout(async () => {
				try {
					this.content = await this.storageAdapter.loadNote(this.note!.id);
				} catch {
					this.content = ["Error: File not found"];
				}
				this.initialHash = cyrb53(JSON.stringify(this.content));
			}, 10);
		}
	}

	updateStatus() {
		if (this.mode === ScreenGlobalState.WRITING) {
			this.status = `[ ${this.note!.filename.length == 0 ? "New Buffer" : this.note!.filename} | ${
				this.content.length
			} ${this.content.length === 1 ? "line" : "lines"} ]`;
		}
	}
}

export class Editor {
	note: Note;
	context: CanvasRenderingContext2D;

	state: ScreenState;

	constructor(
		note: Note,
		context: CanvasRenderingContext2D,
		storageAdapter: StorageAdapter,
		managerState: ManagerState,
		closeCallback: () => void
	) {
		this.note = note;
		this.context = context;

		this.state = new ScreenState(this.note, storageAdapter, managerState, closeCallback);
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
				console.error(JSON.stringify(this.state.cursorPosition));
				console.error(JSON.stringify(this.state.content));
			}
		} else {
			this.context.strokeStyle = FG;
			this.context.strokeRect(pos[0], pos[1], 10, LINE_HEIGHT);
		}
	}

	_render_buffer(lines: number) {
		const CHARACTER_WIDTH = this.context.measureText(" ").width;

		// Scroll screen
		this.context.fillStyle = FG;

		const tag_colors: { [key: string]: string } = {
			productivity: "#8bd4a1",
			social: "#f59153",
			fallback: "#d34a4f",
			journal: "#a586d9",
			wellness: "#ff4fad",
			progress: "#8bd4a1",
		};

		for (
			let i = this.state.scrollPosition.y;
			i < lines + this.state.scrollPosition.y && i < this.state.content.length;
			i++
		) {
			// Extract tags
			let content = this.state.content[i];

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
					this.context.beginPath();
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

		// Draw Selection
		if (this.state.selection) {
			// TODO: FIX

			this.context.beginPath();

			const selection: typeof this.state.selection = JSON.parse(JSON.stringify(this.state.selection));

			// Flip them if required
			let flip = false;

			if (selection.end.y < selection.start.y) {
				flip = true;
			}
			if (selection.start.y === selection.end.y && selection.end.x < selection.start.x) {
				flip = true;
			}

			if (flip) {
				selection.end = this.state.selection.start;
				selection.start = this.state.selection.end;
			}

			for (let i = selection.start.y; i <= selection.end.y; i++) {
				if (i < this.state.scrollPosition.y) {
					continue;
				}

				// Draw rectangle
				const startScreenPosition = {
					x: Math.max(
						0,
						selection.start.y === i ? selection.start.x - this.state.scrollPosition.x : 0
					),
					y: Math.max(0, selection.start.y - this.state.scrollPosition.y),
				};

				const pos = [
					PADDING + startScreenPosition.x * this.context.measureText(" ").width,
					PADDING + 22 + i * LINE_HEIGHT,
				];

				const selectionLength =
					selection.end.y === i
						? selection.end.x - selection.start.x - this.state.scrollPosition.x
						: this.state.content[i]?.length
						? this.state.content[i]?.length
						: 0;

				this.context.fillStyle = FG;
				this.context.fillRect(pos[0], pos[1], selectionLength * CHARACTER_WIDTH, LINE_HEIGHT);

				// Redraw text
				this.context.fillStyle = BG;

				let content = this.state.content[i] ? this.state.content[i] : "";

				content = (selection.start.y === i ? content.slice(selection.start.x) : content).slice(
					0,
					selection.end.y === i ? selectionLength : undefined
				);

				this.context.fillText(content, pos[0], pos[1] + 14);
			}

			this.context.fill();
		}
	}

	_render_top_bar() {
		// Bar
		this.context.fillStyle = FG;
		this.context.fillRect(PADDING, PADDING, this.context.canvas.width - PADDING * 2, 20);

		// Filename
		this.context.fillStyle = BG;
		this.context.fillText(
			this.note.filename.length > 0 ? this.note.filename : "New Buffer",
			(this.context.canvas.width - this.note.filename.length * 14) / 2,
			20
		);
	}

	_render_bottom_menu() {
		let options: string[] = [];

		switch (this.state.mode) {
			case ScreenGlobalState.WRITING:
				options = ["^X Exit", "^R Reload", "M-C Copy", "M-X Cut"];
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

			const shortcutLength = Math.max(2, options[i].trim().split(" ")[0].length);

			// Draw background box
			this.context.fillStyle = FG;
			this.context.fillRect(
				PADDING + leftPos * 240,
				this.context.canvas.height - PADDING - LINE_HEIGHT - topPos * LINE_HEIGHT,
				shortcutLength * 9,
				18
			);

			// Draw Shortcut text
			this.context.fillStyle = BG;
			this.context.fillText(
				options[i].slice(0, shortcutLength),
				PADDING + leftPos * 240,
				this.context.canvas.height - PADDING - topPos * LINE_HEIGHT - 3
			);

			// Draw option text
			this.context.fillStyle = FG;
			this.context.fillText(
				options[i].slice(shortcutLength),
				PADDING + leftPos * 240 + shortcutLength * 8,
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
					prefix + this.state.note?.filename,
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
					this.state.note?.filename[this.state.mode.fileNameCursorPosition!] ?? " ",
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
		if (event.ctrlKey || event.altKey) {
			const hit = this.state.mode.handleCommand(
				(event.ctrlKey ? "CTL-" : "") + (event.altKey ? "ALT-" : "") + event.key,
				this.state
			);

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
				event.shiftKey,
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
		//console.log(event.key);
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
