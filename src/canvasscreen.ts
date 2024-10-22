import { BG, FG } from "./colors.js";

const equals = (one: [number, number], two: [number, number]) => {
	return one.every((val, index) => val === two[index]);
};

abstract class ScreenMode {
	//abstract handleCommand(command: string): void;
}

class ScreenModeWriting extends ScreenMode {
	/*
	handleCommand(command: string) {
		switch (command) {
			case "CTL-g":
				this.loadHelp();
				break;
			case "CTL-x":
				this.exit();
				break;
			case "CTL-r":
				this.reload();
				break;
		}
	}*/
}

const ScreenGlobalState = {
	WRITING: new ScreenModeWriting(),
	EXITING: 1,
	HELP: 2,
	SAVING: 3,
};

class ScreenState {
	mode: any = ScreenGlobalState.WRITING;

	fileName = "";
	content = [
		"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut",
		"labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores ",
		"et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. ",
		"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et",
		" dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.",
		" Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
	];
	status = "";
	statusStyle: "full" | "middle" = "middle";

	cursorPosition = { x: 0, y: 0 };

	updateStatus() {
		this.status = `[ ${this.fileName.length == 0 ? "New Buffer" : this.fileName} | ${
			this.content.length
		} lines ]`;
	}

	moveCursor(direction: [number, number], ctrl: boolean) {
		// Move to left
		if (equals(direction, [-1, 0])) {
			// Start of line
			if (this.cursorPosition.x === 0) {
				if (this.cursorPosition.y === 0) {
					// Can't go any further
				} else {
					// Move cursor to end of prev line
					this.cursorPosition.y -= 1;
					this.cursorPosition.x = this.content[this.cursorPosition.y].length + 1;
				}
			} else {
				if (ctrl) {
					this.cursorPosition.x -= 2;

					// Jump whole word
					while (true) {
						// Check if at start
						if (this.cursorPosition.x <= 0) {
							break;
						}

						if (this.content[this.cursorPosition.y][this.cursorPosition.x] === " ") {
							this.cursorPosition.x += 1;

							break;
						}

						this.cursorPosition.x -= 1;
					}
				} else {
					this.cursorPosition.x -= 1;
				}
			}

			return;
		}

		// Move to the right
		if (equals(direction, [1, 0])) {
			// End of line
			if (this.cursorPosition.x === this.content[this.cursorPosition.y].length + 1) {
				if (this.cursorPosition.y === this.content.length + 1) {
					// Can't go further
				} else {
					// Move cursor to start of next line
					this.cursorPosition.x = 0;
					this.cursorPosition.y += 1;
				}
			} else {
				if (ctrl) {
					let wasSpace = false;

					// Jump whole word
					while (true) {
						// Check if at start
						if (this.cursorPosition.x >= this.content[this.cursorPosition.y].length) {
							// Jump to next line
							if (this.cursorPosition.y < this.content.length) {
								this.cursorPosition.y += 1;
								this.cursorPosition.x = 0;
								wasSpace = false;
							}
							break;
						}

						if (this.content[this.cursorPosition.y][this.cursorPosition.x] === " ") {
							wasSpace = true;
						} else {
							if (wasSpace == true) {
								break;
							}
						}

						this.cursorPosition.x += 1;
					}
				} else {
					this.cursorPosition.x += 1;
				}
			}
			return;
		}

		//TODO: Keep x position on vertical move
		// Move down
		if (equals(direction, [0, -1])) {
			if (this.cursorPosition.y === this.content.length) {
				// At the bottom...
			} else {
				this.cursorPosition.y += 1;
			}
		}

		// Move up
		if (equals(direction, [0, 1])) {
			if (this.cursorPosition.y === 0) {
				// At the top...
			} else {
				this.cursorPosition.y -= 1;
			}
		}
	}

	delete(ctrl: boolean) {
		// Check if in last line
		if (this.cursorPosition.y === this.content.length) {
			// Do nothing
		} else {
			// Check if at end of line
			if (this.cursorPosition.x === this.content[this.cursorPosition.y].length) {
				// Move next line up to current
				const nextLine = this.content.splice(this.cursorPosition.y + 1, 1);
				this.content[this.cursorPosition.y] += nextLine;
			} else {
				let wasSpace = false;

				while (true) {
					// Remove character at cursor
					this.content[this.cursorPosition.y] =
						this.content[this.cursorPosition.y].slice(0, this.cursorPosition.x) +
						this.content[this.cursorPosition.y].slice(this.cursorPosition.x + 1);

					if (!ctrl) {
						break;
					}

					if (this.cursorPosition.x === this.content[this.cursorPosition.y].length) {
						break;
					}

					if (this.content[this.cursorPosition.y][this.cursorPosition.x] === " ") {
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

	backspace(ctrl: boolean) {
		if (this.cursorPosition.x === 0) {
			// Check if in first line
			if (this.cursorPosition.y === 0) {
				// Do nothing
			} else {
				// Wrap up to prev line
				const currentLine = this.content.splice(this.cursorPosition.y, 1);
				const xPos = this.content[this.cursorPosition.y - 1].length;
				this.content[this.cursorPosition.y - 1] += currentLine;

				// Move cursor to position
				this.cursorPosition.y -= 1;
				this.cursorPosition.x = xPos;
			}
		} else {
			let wasSpace = false;

			while (true) {
				// Remove character before cursor
				this.content[this.cursorPosition.y] =
					this.content[this.cursorPosition.y].slice(0, this.cursorPosition.x - 1) +
					this.content[this.cursorPosition.y].slice(this.cursorPosition.x);

				// And move cursor
				this.cursorPosition.x -= 1;

				if (!ctrl) {
					break;
				}

				if (this.cursorPosition.x === 0) {
					break;
				}

				if (this.content[this.cursorPosition.y][this.cursorPosition.x - 2] === " ") {
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

class ScreenStyle {
	font = "14px monospace";
	lineHeight = 18;

	padding = 4;
}

export class CanvasScreen {
	name: string;
	context: CanvasRenderingContext2D;

	state: ScreenState = new ScreenState();

	style: ScreenStyle = new ScreenStyle();

	constructor(name: string, context: CanvasRenderingContext2D) {
		this.name = name;
		this.context = context;
	}

	// Draw to the screen
	render() {
		// Clear the screen
		this.context.fillStyle = BG;
		this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.font = this.style.font;

		// Update state
		this.state.updateStatus();

		// Draw top bar
		this._render_top_bar();

		// Draw text
		this._render_buffer();

		// Draw cursor
		this._render_cursor();

		// Render menu at bottom
		this._render_bottom_menu();
	}

	_render_cursor() {
		const pos = [
			this.style.padding + this.state.cursorPosition.x * this.context.measureText(" ").width,
			this.style.padding + 22 + this.state.cursorPosition.y * 18,
		];

		if (document.hasFocus()) {
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
			this.context.strokeRect(pos[0], pos[1], 10, 18);
		}
	}

	_render_buffer() {
		this.context.fillStyle = FG;

		for (let i = 0; i < this.state.content.length; i++) {
			this.context.fillText(
				this.state.content[i],
				this.style.padding,
				this.style.padding + 36 + i * this.style.lineHeight
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
		this.context.fillText(this.name, (this.context.canvas.width - this.name.length * 14) / 2, 20);
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
			//this.state.handleCommand("CTL-" + event.key);
		}

		// Cursor movement
		if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) {
			this.state.moveCursor(
				event.key === "ArrowLeft"
					? [-1, 0]
					: event.key === "ArrowRight"
					? [1, 0]
					: event.key === "ArrowDown"
					? [0, -1]
					: event.key === "ArrowUp"
					? [0, 1]
					: [0, 0],
				event.ctrlKey
			);
		}

		// Delete text - Delete
		if (event.key === "Delete") {
			this.state.delete(event.ctrlKey);
		}

		if (event.key === "Backspace") {
			this.state.backspace(event.ctrlKey);
		}

		// Fallback
		console.log(event.key);
	}
}
