import { Editor } from "./screens/editor.js";
import { Menu } from "./screens/menu.js";

import { Note, StorageAdapter, StorageAdapterLocalStorage, StorageAdapterRemote } from "./storage.js";
import { BG, FG, LINE_HEIGHT } from "./style.js";
import { generateUUID } from "./utils.js";

export class ManagerState {
	storageAdapter: StorageAdapter;
	notes: Note[] | undefined = undefined;

	editor: Editor | undefined;
	currentlyEditing: Note | undefined = undefined;

	context: CanvasRenderingContext2D;

	menuScreen: Menu;

	modal: Modal | undefined = undefined;

	constructor(demo: boolean, context: CanvasRenderingContext2D) {
		this.context = context;

		if (demo) {
			this.storageAdapter = new StorageAdapterLocalStorage(demo);
		} else {
			this.storageAdapter = new StorageAdapterRemote();
		}

		this.menuScreen = new Menu(this.context, this);

		// Load notes
		setTimeout(
			(async () => {
				this.notes = await this.storageAdapter.listNotes();
			}).bind(this),
			10
		);
	}

	openEditor(note?: Note) {
		if (note) {
			this.currentlyEditing = note;
		} else {
			this.currentlyEditing = {
				id: generateUUID(),
				filename: "",
				creationDate: Date.now(),
				lastEditDate: Date.now(),
			};
		}

		const cb = this.editorCloseCallback.bind(this);
		this.editor = new Editor(this.currentlyEditing!, this.context, this.storageAdapter, this, cb);
	}

	editorCloseCallback() {
		this.currentlyEditing = undefined;
		this.editor = undefined;

		// Reset menu state
		this.menuScreen.state.cursorPos = { x: 0, y: 0 };
		this.menuScreen.state.notesScrollPos = 0;

		setTimeout(
			(async () => {
				this.notes = await this.storageAdapter.listNotes();
			}).bind(this),
			10
		);
	}
}

export class Modal {
	managerState: ManagerState;

	message: string;
	cb: Function;

	constructor(managerState: ManagerState, message: string, closeCallback: Function) {
		this.managerState = managerState;

		this.message = message;
		this.cb = closeCallback;
	}

	render() {
		const ctx = this.managerState.context;

		// Draw white bordered rectangle at center of screen
		const WIDTH = 360;
		const HIGHT = 140;

		const BORDER = 6;

		ctx.fillStyle = FG;
		ctx.fillRect(
			(ctx.canvas.width - WIDTH - BORDER * 2) / 2,
			(ctx.canvas.height - HIGHT - BORDER * 2) / 2,
			WIDTH + BORDER * 2,
			HIGHT + BORDER * 2
		);

		ctx.fillStyle = BG;
		ctx.fillRect((ctx.canvas.width - WIDTH) / 2, (ctx.canvas.height - HIGHT) / 2, WIDTH, HIGHT);

		// Text
		ctx.fillStyle = FG;

		let lineIndex = 0;
		for (const line of this.message.split("|")) {
			ctx.fillText(
				line,
				(ctx.canvas.width - ctx.measureText(line).width) / 2,
				(ctx.canvas.height - 70) / 2 + lineIndex * LINE_HEIGHT
			);
			lineIndex++;
		}

		// Button
		const BUTTON_HIGHT = 20;
		const BUTTON_PADDING = 40;
		const BUTTON_TEXT = "<OK>";

		const button_width = BUTTON_PADDING + ctx.measureText(BUTTON_TEXT).width + BUTTON_PADDING;

		ctx.fillStyle = FG;
		ctx.fillRect(
			(ctx.canvas.width - button_width) / 2,
			(ctx.canvas.height + 55) / 2,
			button_width,
			BUTTON_HIGHT
		);

		ctx.fillStyle = BG;
		ctx.fillText(
			BUTTON_TEXT,
			(ctx.canvas.width - ctx.measureText(BUTTON_TEXT).width) / 2,
			(ctx.canvas.height + 85) / 2
		);
	}

	key(event: KeyboardEvent) {
		if (event.key === "Enter") {
			this.managerState.modal = undefined;

			this.cb();
		}
	}
}

export class Manager {
	state: ManagerState;

	constructor(context: CanvasRenderingContext2D, demo: boolean) {
		this.state = new ManagerState(demo, context);

		// Handle keyboard input#
		const cb = this.keydown.bind(this);
		window.addEventListener("keydown", cb);
	}

	render() {
		if (this.state.currentlyEditing !== undefined) {
			this.state.editor!.render();
		} else {
			this.state.menuScreen.render();
		}

		if (this.state.modal) {
			this.state.modal.render();
		}
	}

	keydown(event: KeyboardEvent) {
		if (this.state.modal) {
			this.state.modal.key(event);
		} else {
			if (this.state.currentlyEditing !== undefined) {
				this.state.editor!.key(event);
			} else {
				this.state.menuScreen.key(event);
			}
		}
	}
}
