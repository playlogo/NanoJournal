import { BG, FG } from "../colors.js";
import { StorageAdapter } from "../storage.js";
import { cyrb53 } from "../utils.js";

const equals = (one: [number, number], two: [number, number]) => {
	return one.every((val, index) => val === two[index]);
};

abstract class ScreenMode {
	abstract handleCommand(command: string, screenState: ScreenState): boolean;
	updateStatus(screenState: ScreenState) {}

	moveCursor(direction: [number, number], ctrl: boolean, screenState: ScreenState) {}
	delete(ctrl: boolean, screenState: ScreenState) {}
	backspace(ctrl: boolean, screenState: ScreenState) {}
	enter(screenState: ScreenState) {}
	type(char: string, screenState: ScreenState) {}
}

class ScreenModeWriting extends ScreenMode {
	updateStatus(screenState: ScreenState): void {
		screenState.statusStyle = "middle";
		screenState.status = "";
	}

	handleCommand(command: string, screenState: ScreenState): boolean {
		switch (command) {
			case "CTL-g":
				throw new Error("Not implemented");
			case "CTL-x":
				screenState.mode = ScreenGlobalState.EXITING;

				// Check if the file was changed
				if (cyrb53(JSON.stringify(screenState.content)) === screenState.initialHash) {
					// Exit immediately
					screenState.closeCallback();
				} else {
					screenState.mode.updateStatus(screenState);
				}

				return true;
			case "CTL-r":
				window.location.reload();
			default:
				return false;
		}
	}

	moveCursor(direction: [number, number], ctrl: boolean, screenState: ScreenState) {
		// Move to left
		if (equals(direction, [-1, 0])) {
			// Start of line
			if (screenState.cursorPosition.x === 0) {
				if (screenState.cursorPosition.y === 0) {
					// Can't go any further
				} else {
					// Move cursor to end of prev line
					screenState.cursorPosition.y -= 1;
					screenState.cursorPosition.x =
						screenState.content[screenState.cursorPosition.y].length + 1;
				}
			} else {
				if (ctrl) {
					screenState.cursorPosition.x -= 2;

					// Jump whole word
					while (true) {
						// Check if at start
						if (screenState.cursorPosition.x <= 0) {
							break;
						}

						if (
							screenState.content[screenState.cursorPosition.y][
								screenState.cursorPosition.x
							] === " "
						) {
							screenState.cursorPosition.x += 1;

							break;
						}

						screenState.cursorPosition.x -= 1;
					}
				} else {
					screenState.cursorPosition.x -= 1;
				}
			}

			return;
		}

		// Move to the right
		if (equals(direction, [1, 0])) {
			// End of line
			if (
				screenState.cursorPosition.x ===
				screenState.content[screenState.cursorPosition.y].length + 1
			) {
				if (screenState.cursorPosition.y === screenState.content.length + 1) {
					// Can't go further
				} else {
					// Move cursor to start of next line
					screenState.cursorPosition.x = 0;
					screenState.cursorPosition.y += 1;
				}
			} else {
				if (ctrl) {
					let wasSpace = false;

					// Jump whole word
					while (true) {
						// Check if at start
						if (
							screenState.cursorPosition.x >=
							screenState.content[screenState.cursorPosition.y].length
						) {
							// Jump to next line
							if (screenState.cursorPosition.y < screenState.content.length) {
								screenState.cursorPosition.y += 1;
								screenState.cursorPosition.x = 0;
								wasSpace = false;
							}
							break;
						}

						if (
							screenState.content[screenState.cursorPosition.y][
								screenState.cursorPosition.x
							] === " "
						) {
							wasSpace = true;
						} else {
							if (wasSpace == true) {
								break;
							}
						}

						screenState.cursorPosition.x += 1;
					}
				} else {
					screenState.cursorPosition.x += 1;
				}
			}
			return;
		}

		//TODO: Keep x position on vertical move
		// Move down
		if (equals(direction, [0, -1])) {
			if (screenState.cursorPosition.y === screenState.content.length) {
				// At the bottom...
			} else {
				screenState.cursorPosition.y += 1;

				// Snap cursor to ending of text if over
				if (screenState.cursorPosition.x > screenState.content[screenState.cursorPosition.y].length) {
					screenState.cursorPosition.x = screenState.content[screenState.cursorPosition.y].length;
				}
			}
		}

		// Move up
		if (equals(direction, [0, 1])) {
			if (screenState.cursorPosition.y === 0) {
				// At the top...
			} else {
				screenState.cursorPosition.y -= 1;

				// Snap cursor to ending of text if over
				if (screenState.cursorPosition.x > screenState.content[screenState.cursorPosition.y].length) {
					screenState.cursorPosition.x = screenState.content[screenState.cursorPosition.y].length;
				}
			}
		}
	}

	delete(ctrl: boolean, screenState: ScreenState) {
		// Check if in last line
		if (screenState.cursorPosition.y === screenState.content.length) {
			// Do nothing
		} else {
			// Check if at end of line
			if (screenState.cursorPosition.x === screenState.content[screenState.cursorPosition.y].length) {
				// Move next line up to current
				const nextLine = screenState.content.splice(screenState.cursorPosition.y + 1, 1);
				screenState.content[screenState.cursorPosition.y] += nextLine;
			} else {
				let wasSpace = false;

				while (true) {
					// Remove character at cursor
					screenState.content[screenState.cursorPosition.y] =
						screenState.content[screenState.cursorPosition.y].slice(
							0,
							screenState.cursorPosition.x
						) +
						screenState.content[screenState.cursorPosition.y].slice(
							screenState.cursorPosition.x + 1
						);

					if (!ctrl) {
						break;
					}

					if (
						screenState.cursorPosition.x ===
						screenState.content[screenState.cursorPosition.y].length
					) {
						break;
					}

					if (
						screenState.content[screenState.cursorPosition.y][screenState.cursorPosition.x] ===
						" "
					) {
						wasSpace = true;
					} else {
						if (wasSpace == true) {
							break;
						}
					}
				}
			}
		}
	}

	backspace(ctrl: boolean, screenState: ScreenState) {
		if (screenState.cursorPosition.x === 0) {
			// Check if in first line
			if (screenState.cursorPosition.y === 0) {
				// Do nothing
			} else {
				// Wrap up to prev line
				const currentLine = screenState.content.splice(screenState.cursorPosition.y, 1);
				const xPos = screenState.content[screenState.cursorPosition.y - 1].length;
				screenState.content[screenState.cursorPosition.y - 1] += currentLine;

				// Move cursor to position
				screenState.cursorPosition.y -= 1;
				screenState.cursorPosition.x = xPos;
			}
		} else {
			let wasSpace = false;

			while (true) {
				// Remove character before cursor
				screenState.content[screenState.cursorPosition.y] =
					screenState.content[screenState.cursorPosition.y].slice(
						0,
						screenState.cursorPosition.x - 1
					) + screenState.content[screenState.cursorPosition.y].slice(screenState.cursorPosition.x);

				// And move cursor
				screenState.cursorPosition.x -= 1;

				if (!ctrl) {
					break;
				}

				if (screenState.cursorPosition.x === 0) {
					break;
				}

				if (
					screenState.content[screenState.cursorPosition.y][screenState.cursorPosition.x - 2] ===
					" "
				) {
					wasSpace = true;
				} else {
					if (wasSpace == true) {
						break;
					}
				}
			}
		}
	}

	enter(screenState: ScreenState) {
		// Check if cursor at start
		if (screenState.cursorPosition.x === 0) {
			// Insert newline above
			const before = screenState.content.slice(0, screenState.cursorPosition.y);
			const after = screenState.content.slice(screenState.cursorPosition.y);

			screenState.content = [...before, "", ...after];

			screenState.cursorPosition.y += 1;
		} else {
			// Break current line at cursor position
			const before = screenState.content.slice(0, screenState.cursorPosition.y);
			const after = screenState.content.slice(screenState.cursorPosition.y + 1);
			const currentLine = screenState.content[screenState.cursorPosition.y];

			screenState.content = [
				...before,
				currentLine.slice(0, screenState.cursorPosition.x),
				currentLine.slice(screenState.cursorPosition.x),
				...after,
			];

			screenState.cursorPosition.y += 1;
			screenState.cursorPosition.x = 0;
		}
	}

	type(char: string, screenState: ScreenState) {
		// Insert the char before cursor position
		screenState.content[screenState.cursorPosition.y] =
			screenState.content[screenState.cursorPosition.y].slice(0, screenState.cursorPosition.x) +
			char +
			screenState.content[screenState.cursorPosition.y].slice(screenState.cursorPosition.x);

		screenState.cursorPosition.x += 1;
	}
}

class ScreenModeExiting extends ScreenMode {
	updateStatus(screenState: ScreenState) {
		screenState.statusStyle = "full";
		screenState.status = "Save modified buffer?";
	}

	handleCommand(command: string, screenState: ScreenState): boolean {
		switch (command) {
			case "CTL-c":
				// Cancel exit
				screenState.mode = ScreenGlobalState.WRITING;
				screenState.mode.updateStatus(screenState);
				return true;
			default:
				return false;
		}
	}
	type(char: string, screenState: ScreenState) {
		if (char === "n" || char === "N") {
			screenState.closeCallback();
			return;
		} else if (char === "y" || char === "Y") {
			screenState.mode = ScreenGlobalState.SAVING;
			screenState.mode.updateStatus(screenState);
		}
	}
}

class ScreenModeSaving extends ScreenMode {
	updateStatus(screenState: ScreenState) {
		screenState.statusStyle = "full";
		screenState.status = "Save modified buffer?";
	}

	handleCommand(command: string, screenState: ScreenState): boolean {
		switch (command) {
			case "CTL-c":
				// Cancel exit
				screenState.mode = ScreenGlobalState.WRITING;
				screenState.mode.updateStatus(screenState);
				return true;
			default:
				return false;
		}
	}
	type(char: string, screenState: ScreenState) {
		if (char === "n" || char === "N") {
			screenState.closeCallback();
			return;
		} else if (char === "y" || char === "Y") {
			screenState.mode = ScreenGlobalState.SAVING;
			screenState.mode.updateStatus(screenState);
		}
	}
}

const ScreenGlobalState = {
	WRITING: new ScreenModeWriting(),
	EXITING: new ScreenModeExiting(),
	HELP: new ScreenModeWriting(),
	SAVING: new ScreenModeSaving(),
};

class ScreenState {
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

class ScreenStyle {
	font = "14px monospace";
	lineHeight = 18;

	padding = 4;
}

export class Editor {
	name: string;
	context: CanvasRenderingContext2D;

	state: ScreenState;
	style: ScreenStyle = new ScreenStyle();

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
		this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.font = this.style.font;

		// Calc possible lines
		const lines = this._render_calc_lines();

		// Update state
		this.state.updateStatus();

		// Draw top bar
		this._render_top_bar();

		// Draw cursor
		this._render_cursor(lines);

		// Draw text
		this._render_buffer(lines);

		// Render menu at bottom
		this._render_bottom_menu();
	}

	_render_calc_lines() {
		const contentHight = this.context.canvas.height - this.style.padding * 2 - 20 - 18 * 2;
		return Math.floor(contentHight / 18);
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
			this.style.padding + localCursorPosition.x * this.context.measureText(" ").width,
			this.style.padding + 22 + localCursorPosition.y * 18,
		];

		if (document.hasFocus() || true) {
			this.context.fillStyle = FG;
			this.context.fillRect(pos[0], pos[1], 10, 18);

			try {
				// Redraw character
				if (this.state.cursorPosition.y < this.state.content.length) {
					if (
						this.state.cursorPosition.x < this.state.content[this.state.cursorPosition.y].length
					) {
						this.context.fillStyle = BG;
						this.context.fillText(
							this.state.content[this.state.cursorPosition.y][this.state.cursorPosition.x],
							this.style.padding +
								(this.state.scrollPosition.x - this.state.scrollPosition.x) *
									this.context.measureText(" ").width,
							this.style.padding +
								22 +
								(this.state.scrollPosition.y - this.state.scrollPosition.y) * 18 +
								14
						);
					}
				}
			} catch {
				console.log(JSON.stringify(this.state.cursorPosition));
				console.log(JSON.stringify(this.state.content));
			}
		} else {
			this.context.strokeStyle = FG;
			this.context.strokeRect(pos[0], pos[1], 10, 18);
		}
	}

	_render_buffer(lines: number) {
		// Scroll screen
		this.context.fillStyle = FG;

		for (
			let i = this.state.scrollPosition.y;
			i < lines + this.state.scrollPosition.y && i < this.state.content.length;
			i++
		) {
			this.context.fillText(
				this.state.content[i],
				this.style.padding,
				this.style.padding + 36 + (i - this.state.scrollPosition.y) * this.style.lineHeight
			);
		}
	}

	_render_top_bar() {
		// Bar
		this.context.fillStyle = FG;
		this.context.fillRect(
			this.style.padding,
			this.style.padding,
			this.context.canvas.width - this.style.padding * 2,
			20
		);

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
				this.style.padding + leftPos * 240,
				this.context.canvas.height - this.style.padding - 18 - topPos * 18,
				18,
				18
			);

			// Draw Shortcut text
			this.context.fillStyle = BG;
			this.context.fillText(
				options[i].slice(0, 2),
				this.style.padding + leftPos * 240,
				this.context.canvas.height - this.style.padding - topPos * 18 - 3
			);

			// Draw option text
			this.context.fillStyle = FG;
			this.context.fillText(
				options[i].slice(2),
				this.style.padding + leftPos * 240 + 16,
				this.context.canvas.height - this.style.padding - topPos * 18 - 3
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
							this.style.padding,
							this.context.canvas.height - this.style.padding - 18 - 18 * 2,
							this.context.canvas.width - this.style.padding * 2,
							18
						);
						this.context.fillStyle = BG;
						this.context.fillText(
							this.state.status,
							this.style.padding,
							this.context.canvas.height - this.style.padding - 18 - 22
						);
						break;
					case "middle":
						const textWidth = this.context.measureText(this.state.status).width;
						this.context.fillRect(
							(this.context.canvas.width - textWidth) / 2 - 6,
							this.context.canvas.height - this.style.padding - 18 - 18 * 2,
							textWidth + 12,
							18
						);
						this.context.fillStyle = BG;
						this.context.fillText(
							this.state.status,
							(this.context.canvas.width - textWidth) / 2,
							this.context.canvas.height - this.style.padding - 18 - 22
						);
				}
				break;
			case ScreenGlobalState.SAVING:
				throw new Error("Not implemented");
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
