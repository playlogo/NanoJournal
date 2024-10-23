import { Editor } from "./screens/editor.js";
import { Menu } from "./screens/menu.js";

import { StorageAdapter, StorageAdapterLocal } from "./storage.js";

export class ManagerState {
	storageAdapter: StorageAdapter;
	notes: string[] | undefined;

	editor: Editor | undefined;
	currentlyEditing: boolean | string = false;

	context: CanvasRenderingContext2D;

	constructor(demo: boolean, context: CanvasRenderingContext2D) {
		this.notes = undefined;
		this.context = context;

		if (demo) {
			this.storageAdapter = new StorageAdapterLocal(demo);
		} else {
			throw new Error("Not implemented");
		}

		// Load notes
		setTimeout(
			(() => {
				this.notes = this.storageAdapter.noteList();
			}).bind(this),
			10
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

		// Reload notes
		setTimeout(
			(() => {
				this.notes = this.storageAdapter.noteList();
			}).bind(this),
			10
		);
	}
}

export class Manager {
	state: ManagerState;
	menuScreen: Menu;

	constructor(context: CanvasRenderingContext2D, demo: boolean) {
		this.state = new ManagerState(demo, context);

		// Handle keyboard input#
		const cb = this.keydown.bind(this);
		window.addEventListener("keydown", cb);

		// Create menuscreen
		this.menuScreen = new Menu(context, this.state);
	}

	render() {
		if (this.state.currentlyEditing !== false) {
			this.state.editor!.render();
		} else {
			this.menuScreen.render();
		}
	}

	keydown(event: KeyboardEvent) {
		if (this.state.currentlyEditing !== false) {
			this.state.editor!.key(event);
		} else {
			this.menuScreen.key(event);
		}
	}
}
