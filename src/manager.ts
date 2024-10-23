import { Editor } from "./screens/editor.js";
import { Menu } from "./screens/menu.js";

import { StorageAdapter, StorageAdapterLocal } from "./storage.js";

class ManagerState {
	noteNames: string[];
	currentlyEditing: boolean | string = false;
	storageAdapter: StorageAdapter;

	constructor(demo: boolean) {
		this.noteNames = [];

		if (demo) {
			this.storageAdapter = new StorageAdapterLocal();
		} else {
			throw new Error("Not implemented");
		}
	}
}

export class Manager {
	state: ManagerState;
	menuScreen: Menu;
	editor: Editor;

	constructor(context: CanvasRenderingContext2D, demo: boolean) {
		this.state = new ManagerState(demo);

		// Handle keyboard input#
		const cb = this.keydown.bind(this);
		window.addEventListener("keydown", cb);

		// Create menuscreen
		this.menuScreen = new Menu(context);
	}

	render() {
		if (this.state.currentlyEditing) {
			this.editor.render();
		} else {
			this.menuScreen.render();
		}
	}

	keydown(event: KeyboardEvent) {
		if (this.state.currentlyEditing) {
			this.editor.key(event);
		} else {
			this.menuScreen.key(event);
		}
	}
}
