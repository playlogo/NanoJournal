import { Editor } from "./screens/editor.js";
import { Menu } from "./screens/menu.js";

import { StorageAdapter, StorageAdapterLocalStorage, StorageAdapterRemote } from "./storage.js";

export class ManagerState {
	storageAdapter: StorageAdapter;
	notes: string[] | undefined = undefined;

	editor: Editor | undefined;
	currentlyEditing: boolean | string = false;

	context: CanvasRenderingContext2D;

	menuScreen: Menu;

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
			1000
		);
	}

	openEditor(noteName?: string) {
		if (noteName) {
			this.currentlyEditing = noteName;
		} else {
			this.currentlyEditing = "";
		}

		const cb = this.editorCloseCallback.bind(this);
		this.editor = new Editor(this.currentlyEditing, this.context, this.storageAdapter, cb);
	}

	editorCloseCallback() {
		this.currentlyEditing = false;
		this.editor = undefined;

		// Reset menu state
		this.menuScreen.state.cursorPos = { x: 0, y: 0 };
		this.menuScreen.state.notesScrollPos = 0;

		setTimeout(
			(async () => {
				this.notes = await this.storageAdapter.listNotes();
			}).bind(this),
			1000
		);
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
		if (this.state.currentlyEditing !== false) {
			this.state.editor!.render();
		} else {
			this.state.menuScreen.render();
		}
	}

	keydown(event: KeyboardEvent) {
		if (this.state.currentlyEditing !== false) {
			this.state.editor!.key(event);
		} else {
			this.state.menuScreen.key(event);
		}
	}
}
