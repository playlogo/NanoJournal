import { BG, FG, FONT_NORMAL, FONT_ITALIC, LINE_HEIGHT } from "../style.js";
import { ManagerState } from "../manager.js";
import { logo, icon_plus, icon_search, icon_text_index } from "./resources.js";
import { equals } from "../utils.js";

class MenuState {
	cursorPos = { x: 0, y: 0 };
	notesScrollPos = 0;

	managerState: ManagerState;

	constructor(state: ManagerState) {
		this.managerState = state;
	}

	moveCursor(direction: [number, number]) {
		const maxX = 2;
		const maxY = 10;

		// Move left
		if (equals(direction, [-1, 0])) {
			if (this.cursorPos.x === 0) {
				this.cursorPos.x = maxX;
			} else {
				this.cursorPos.x--;
			}
		}

		// Move right
		if (equals(direction, [1, 0])) {
			if (this.cursorPos.x === maxX) {
				this.cursorPos.x = 0;
			} else {
				this.cursorPos.x++;
			}
		}

		// Move up
		if (equals(direction, [0, 1])) {
			if (this.cursorPos.y == 0) {
				this.cursorPos.y =
					this.managerState.notes === undefined ? 0 : this.managerState.notes.length - 1;
			} else {
				this.cursorPos.y--;
			}
		}

		// Move down
		if (equals(direction, [0, -1])) {
			if (
				this.cursorPos.y ==
				(this.managerState.notes === undefined ? 0 : this.managerState.notes.length - 1)
			) {
				this.cursorPos.y = 0;
			} else {
				this.cursorPos.y++;
			}
		}

		// Scroll down
		if (this.cursorPos.y - this.notesScrollPos > maxY - 1) {
			this.notesScrollPos++;
		}

		// Scroll up
		if (this.cursorPos.y < this.notesScrollPos) {
			this.notesScrollPos = this.cursorPos.y;
		}

		if (this.cursorPos.y - this.notesScrollPos > maxY) {
			this.notesScrollPos =
				this.managerState.notes === undefined ? 0 : this.managerState.notes.length - maxY;
		}
	}

	enter() {
		switch (this.cursorPos.x) {
			case 0:
				// Load note
				if (this.managerState.notes === undefined) {
					return;
				}

				const fileName = this.managerState.notes![this.cursorPos.y];
				this.managerState.openEditor(fileName);
				break;
			case 1:
				// Create a new empty one
				this.managerState.openEditor();
				break;
			case 2:
				// Search
				// TODO: Implement search
				break;
		}
	}
}

export class Menu {
	context: CanvasRenderingContext2D;
	managerState: ManagerState;
	state: MenuState;

	TOP_OFFSET = 100;

	constructor(context: CanvasRenderingContext2D, state: ManagerState) {
		this.context = context;
		this.managerState = state;
		this.state = new MenuState(state);
	}

	// Draw to the screen
	render() {
		// Clear the screen
		this.context.fillStyle = BG;
		this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.font = FONT_NORMAL;

		// Render logo
		this._render_logo();

		// Render notes list
		this._render_notes_list();

		// Render icons
		this._render_icons();
	}

	_render_logo() {
		const logoLines = logo.split("\n");

		// Calc logo size
		const logoWidth =
			logoLines.sort((a, b) => b.length - a.length)[0].length * this.context.measureText(" ").width;
		const logoHeight = logoLines.length * LINE_HEIGHT;

		// Print logo at center top
		this.context.fillStyle = FG;

		for (let i = 0; i < logoLines.length; i++) {
			this.context.fillText(
				logoLines[i],
				(this.context.canvas.width - logoWidth) / 2,
				(this.context.canvas.height - logoHeight - 400 + this.TOP_OFFSET) / 2 + i * LINE_HEIGHT
			);
		}
	}

	_render_notes_list() {
		// Title text
		this.context.fillStyle = FG;
		this.context.fillText(
			this.state.managerState.notes != undefined
				? `Notes: ${this.state.managerState.notes.length}`
				: "Loading...",
			this.context.canvas.width / 2 - 270,
			this.context.canvas.height / 2 - 120 + this.TOP_OFFSET
		);

		if (this.state.managerState.notes === undefined) {
			return;
		}

		// Notes list
		this.context.font = FONT_ITALIC;

		for (
			let i = this.state.notesScrollPos;
			i < this.state.managerState.notes!.length && i < this.state.notesScrollPos + 10;
			i++
		) {
			if (this.state.cursorPos.y === i && this.state.cursorPos.x === 0) {
				// Draw rectangle
				this.context.fillStyle = FG;
				this.context.fillRect(
					this.context.canvas.width / 2 - 274,
					this.context.canvas.height / 2 -
						100 +
						this.TOP_OFFSET +
						i * LINE_HEIGHT -
						14 -
						this.state.notesScrollPos * LINE_HEIGHT,
					24 * this.context.measureText(" ").width,
					LINE_HEIGHT
				);

				this.context.fillStyle = BG;
			} else {
				this.context.fillStyle = FG;
			}

			this.context.fillText(
				this.state.managerState.notes![i].substring(0, 24),
				this.context.canvas.width / 2 - 270,
				this.context.canvas.height / 2 -
					100 +
					this.TOP_OFFSET +
					i * LINE_HEIGHT -
					this.state.notesScrollPos * LINE_HEIGHT
			);
		}

		return;
	}

	_render_icons() {
		this.context.font = FONT_NORMAL;

		const icons = [icon_plus, icon_search];

		for (let icon = 0; icon < icons.length; icon++) {
			this.context.fillStyle = FG;

			// Draw lines
			const iconLines = icons[icon].split("\n");

			for (let line = 0; line < iconLines.length; line++) {
				this.context.fillText(
					iconLines[line],
					this.context.canvas.width / 2 + 48 + icon * 130,
					this.context.canvas.height / 2 - 100 + this.TOP_OFFSET + LINE_HEIGHT * line
				);
			}

			// Highlight
			if (this.state.cursorPos.x === icon + 1) {
				// Draw box
				this.context.fillStyle = FG;
				const startPadding =
					(iconLines[icon_text_index].length - iconLines[icon_text_index].trimStart().length) *
					this.context.measureText(" ").width;

				this.context.fillRect(
					this.context.canvas.width / 2 + 48 + icon * 130 + startPadding - 4,
					this.context.canvas.height / 2 - 100 + this.TOP_OFFSET + 16 * icon_text_index,
					iconLines[icon_text_index].trim().length * this.context.measureText(" ").width + 8,
					LINE_HEIGHT
				);

				// Rewrite text
				this.context.fillStyle = BG;

				this.context.fillText(
					iconLines[icon_text_index],
					this.context.canvas.width / 2 + 48 + icon * 130,
					this.context.canvas.height / 2 - 100 + this.TOP_OFFSET + LINE_HEIGHT * icon_text_index
				);
			}
		}
	}

	// Handle keyboard input
	key(event: KeyboardEvent) {
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
					: [0, 0]
			);
		}

		// New line - Enter
		if (event.key === "Enter") {
			this.state.enter();
		}

		// Fallback
		console.log(event.key);
	}
}
