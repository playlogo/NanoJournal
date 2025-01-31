import { ScreenState, ScreenGlobalState } from "./editor.js";
import { equals, cyrb53 } from "../utils.js";

export abstract class ScreenMode {
	abstract handleCommand(command: string, screenState: ScreenState): boolean;
	updateStatus(screenState: ScreenState) {}

	moveCursor(direction: [number, number], ctrl: boolean, shift: boolean, screenState: ScreenState) {}
	delete(ctrl: boolean, screenState: ScreenState) {}
	backspace(ctrl: boolean, screenState: ScreenState) {}
	enter(screenState: ScreenState) {}
	type(char: string, screenState: ScreenState) {}
}

export class ScreenModeWriting extends ScreenMode {
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
			case "ALT-v":
				if (screenState.selection !== undefined) {
					// Collect selection
					const text = this.#collectSelection(screenState);

					// Copy selection
					navigator.clipboard.writeText(text).then(
						() => {},
						(err) => {
							console.error("Async: Could not copy text: ", err);
						}
					);

					// Empty selection
					screenState.selection = undefined;
				}
				return true;
			case "ALT-x":
				if (screenState.selection !== undefined) {
					// Collect selection
					const text = this.#collectSelection(screenState);

					// Copy selection
					navigator.clipboard.writeText(text).then(
						() => {},
						(err) => {
							console.error("Async: Could not copy text: ", err);
						}
					);

					// Empty selection
					this.#emptySelection(screenState);
				}
				return true;
			case "ALT-v":
				if (screenState.selection !== undefined) {
					// Empty selection
					this.#emptySelection(screenState);
				}

				throw new Error("Not implemented");
				return true;
			case "CTL-r":
				window.location.reload();
			default:
				return false;
		}
	}

	moveCursor(direction: [number, number], ctrl: boolean, shift: boolean, screenState: ScreenState) {
		let selection: { start: { x: number; y: number }; end: { x: number; y: number } } | undefined =
			undefined;

		if (shift && screenState.selection === undefined) {
			selection = {
				start: {
					x: screenState.cursorPosition.x,
					y: screenState.cursorPosition.y,
				},
				end: {
					x: 0,
					y: 0,
				},
			};
		}

		while (true) {
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
							screenState.content[screenState.cursorPosition.y].length;
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

				break;
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
				} else if (
					screenState.cursorPosition.x === screenState.content[screenState.cursorPosition.y].length
				) {
					// Move cursor to start of next line
					screenState.cursorPosition.x = 0;
					screenState.cursorPosition.y += 1;
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
				break;
			}

			//TODO: Keep x position on vertical move
			// Move down
			if (equals(direction, [0, -1])) {
				if (screenState.cursorPosition.y === screenState.content.length) {
				} else {
					// At the bottom...

					// Insert bottom line ar end if none
					if (screenState.content[screenState.content.length - 1].trim() !== "") {
						screenState.content.push("");
					} else {
						if (screenState.cursorPosition.y === screenState.content.length - 1) {
							break;
						}
					}

					screenState.cursorPosition.y += 1;

					// Snap cursor to ending of text if over
					if (
						screenState.cursorPosition.x >
						screenState.content[screenState.cursorPosition.y].length
					) {
						screenState.cursorPosition.x =
							screenState.content[screenState.cursorPosition.y].length;
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
					if (
						screenState.cursorPosition.x >
						screenState.content[screenState.cursorPosition.y].length
					) {
						screenState.cursorPosition.x =
							screenState.content[screenState.cursorPosition.y].length;
					}
				}
			}

			break;
		}

		// Handle select
		if (!shift && screenState.selection !== undefined) {
			screenState.selection = undefined;
		}

		if (shift) {
			if (screenState.selection === undefined) {
				selection!.end = {
					x: screenState.cursorPosition.x + 1,
					y: screenState.cursorPosition.y,
				};

				screenState.selection = selection;
			} else {
				screenState.selection.end = {
					x: screenState.cursorPosition.x + 1,
					y: screenState.cursorPosition.y,
				};
			}
		}
	}

	delete(ctrl: boolean, screenState: ScreenState) {
		if (screenState.selection !== undefined) {
			// Empty selection
			this.#emptySelection(screenState);
			return;
		}

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
		if (screenState.selection !== undefined) {
			// Empty selection
			this.#emptySelection(screenState);
			return;
		}

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
		if (screenState.selection !== undefined) {
			// Empty selection
			try {
				this.#emptySelection(screenState);
			} catch (_err) {
				// Can happen
			}
		}

		// Insert the char before cursor position
		screenState.content[screenState.cursorPosition.y] =
			screenState.content[screenState.cursorPosition.y].slice(0, screenState.cursorPosition.x) +
			char +
			screenState.content[screenState.cursorPosition.y].slice(screenState.cursorPosition.x);

		screenState.cursorPosition.x += 1;
	}

	#emptySelection(screenState: ScreenState) {
		// TODO: FIX!

		screenState.selection = screenState.selection!;

		let selection: typeof screenState.selection = JSON.parse(JSON.stringify(screenState.selection));
		selection = selection!;

		// Flip them if required
		let flip = false;

		if (selection.end.y < selection.start.y) {
			flip = true;
		}
		if (selection.start.y === selection.end.y && selection.end.x < selection.start.x) {
			flip = true;
		}

		if (flip) {
			selection.end = screenState.selection.start;
			selection.start = screenState.selection.end;
		}

		let deleteCount = 0;

		for (let i = selection.start.y; i <= selection.end.y; i++) {
			const lineContent = screenState.content[i - deleteCount];

			const selectionLength =
				selection.end.y === i
					? selection.end.x - selection.start.x
					: lineContent?.length
					? lineContent?.length
					: 0;

			if (selection.start.y !== selection.end.y && selection.start.y < i && selection.end.y > i) {
				screenState.content.splice(i - deleteCount);
				deleteCount++;
			} else {
				screenState.content[i - deleteCount] = lineContent.slice(
					selection.start.y === i ? selection.start.x : 0,
					selection.end.y === i ? selectionLength : undefined
				);
			}
		}

		screenState.cursorPosition.x = selection.start.x;
		screenState.cursorPosition.y = selection.start.y;
		screenState.selection = undefined;
	}

	#collectSelection(screenState: ScreenState) {
		screenState.selection = screenState.selection!;

		let text = "";

		let selection: typeof screenState.selection = JSON.parse(JSON.stringify(screenState.selection));
		selection = selection!;

		// Flip them if required
		let flip = false;

		if (selection.end.y < selection.start.y) {
			flip = true;
		}
		if (selection.start.y === selection.end.y && selection.end.x < selection.start.x) {
			flip = true;
		}

		if (flip) {
			selection.end = screenState.selection.start;
			selection.start = screenState.selection.end;
		}

		for (let i = selection.start.y; i <= selection.end.y; i++) {
			const selectionLength =
				selection.end.y === i
					? selection.end.x - selection.start.x
					: screenState.content[i]?.length
					? screenState.content[i]?.length
					: 0;

			let content = screenState.content[i] ? screenState.content[i] : "";

			text += (selection.start.y === i ? content.slice(selection.start.x) : content).slice(
				0,
				selection.end.y === i ? selectionLength : undefined
			);
			text += "\n";
		}

		return text;
	}
}

export class ScreenModeExiting extends ScreenMode {
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

export class ScreenModeSaving extends ScreenMode {
	fileNameCursorPosition = 0;
	startFilename: undefined | string = undefined;

	updateStatus(screenState: ScreenState) {
		screenState.statusStyle = "full";
		this.fileNameCursorPosition = screenState.note.filename.length;
	}

	handleCommand(command: string, screenState: ScreenState): boolean {
		switch (command) {
			case "CTL-c":
				// Cancel exit
				screenState.mode = ScreenGlobalState.WRITING;
				screenState.mode.updateStatus(screenState);

				// Reset filename
				screenState.note.filename = this.startFilename || "";
				this.startFilename = undefined;
				return true;
			default:
				return false;
		}
	}

	type(char: string, screenState: ScreenState) {
		if (this.startFilename === undefined) {
			this.startFilename = screenState.note.filename;
		}

		if (screenState.note.filename.length === 0) {
			screenState.note.filename = char;
			this.fileNameCursorPosition = 1;
			return;
		}

		const start = screenState.note.filename.slice(0, this.fileNameCursorPosition);
		const end = screenState.note.filename.slice(this.fileNameCursorPosition);

		screenState.note.filename = start + char + end;
		this.fileNameCursorPosition += 1;
	}

	moveCursor(direction: [number, number], ctrl: boolean, shift: boolean, screenState: ScreenState) {
		if (equals(direction, [-1, 0])) {
			this.fileNameCursorPosition = Math.max(0, this.fileNameCursorPosition - 1);
		} else if (equals(direction, [1, 0])) {
			this.fileNameCursorPosition = Math.min(
				screenState.note.filename.length,
				this.fileNameCursorPosition + 1
			);
		}

		if (ctrl) {
			if (equals(direction, [-1, 0])) {
				this.fileNameCursorPosition = 0;
			} else if (equals(direction, [1, 0])) {
				this.fileNameCursorPosition = screenState.note.filename.length;
			}
		}
	}

	delete(ctrl: boolean, screenState: ScreenState) {
		if (screenState.note.filename.length === 0) {
			return;
		}

		const start = screenState.note.filename.slice(0, this.fileNameCursorPosition);
		const end = screenState.note.filename.slice(this.fileNameCursorPosition + 1);

		screenState.note.filename = start + end;
	}

	backspace(ctrl: boolean, screenState: ScreenState) {
		if (screenState.note.filename.length === 0) {
			return;
		}

		const start = screenState.note.filename.slice(0, this.fileNameCursorPosition - 1);
		const end = screenState.note.filename.slice(this.fileNameCursorPosition);

		screenState.note.filename = start + end;
		this.fileNameCursorPosition = Math.max(0, this.fileNameCursorPosition - 1);
	}

	enter(screenState: ScreenState) {
		this.startFilename = undefined;
		screenState.storageAdapter.saveNote(screenState.note, screenState.content);
		screenState.closeCallback();
	}
}
