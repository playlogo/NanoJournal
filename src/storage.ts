interface Note {
	creationDate: Date;
	lastEditDate: Date;
	fileName: string;

	id: string;
}

export abstract class StorageAdapter {
	abstract listNotes(): Promise<string[]>;
	abstract loadNote(id: string): Promise<string[]>;
	abstract saveNote(id: string, fileName: string, content: string[]): Promise<void>;
}

export class StorageAdapterLocalStorage implements StorageAdapter {
	constructor(demo: boolean) {
		if (demo) {
			if (window.localStorage.getItem("notes") === null) {
				window.localStorage.setItem(
					"notes",
					JSON.stringify([
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo2" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo3" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo4" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo5" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo6" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo7" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo8" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo9" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo10" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo11" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo12" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo13" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo14" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo15" },
						{ creationDate: new Date(), lastEditDate: new Date(), fileName: "demo16" },
					])
				);
			}
		}
	}

	async listNotes() {
		if (window.localStorage.getItem("notes") === null) {
			return [];
		}

		return (JSON.parse(window.localStorage.getItem("notes")!) as Note[])
			.sort((a, b) => (a.lastEditDate > b.lastEditDate ? -1 : 1))
			.map((note) => note.fileName);
	}

	async loadNote(id: string) {
		if (window.localStorage.getItem("note_" + id) === null) {
			throw new Error("Note not found");
		}

		return JSON.parse(window.localStorage.getItem(`note_${id}`)!) as string[];
	}

	async saveNote(id: string, fileName: string, content: string[]) {
		const notes = JSON.parse(window.localStorage.getItem("notes")!) as Note[];

		if (fileName === "") {
			// Find next free untitled name
			const nextId =
				notes
					.filter((note) => note.fileName.startsWith("Untitled"))
					.map((note) => {
						return parseInt(note.fileName.replace("Untitled", ""));
					})
					.sort((a, b) => (a > b ? 1 : -1))[0] + 1;

			fileName = "Untitled" + nextId;
		}

		window.localStorage.setItem(`note_${id}`, JSON.stringify(content));

		const notesList = await this.listNotes();

		if (!notesList.includes(fileName)) {
			// Add note to note list if it doesn't exist
			notes.push({ creationDate: new Date(), fileName: fileName, lastEditDate: new Date(), id: id });
			window.localStorage.setItem("notes", JSON.stringify(notes));
		} else {
			// Update note creation date
			const note = notes.find((note) => note.fileName === fileName);
			note!.lastEditDate = new Date();
			window.localStorage.setItem("notes", JSON.stringify(notes));
		}
	}
}

export class StorageAdapterRemote implements StorageAdapter {
	lastNoteList: Note[] = [];

	async listNotes() {
		const res = await fetch(`/api/notes`);
		const body = (await res.json()) as Note[];

		this.lastNoteList = body;

		return body.sort((a, b) => (a.lastEditDate > b.lastEditDate ? -1 : 1)).map((note) => note.fileName);
	}

	async loadNote(id: string) {
		const res = await fetch(`/api/notes/${id}`);
		const body = await res.json();

		return body as string[];
	}

	async saveNote(id: string, fileName: string, content: string[]) {
		if (fileName === "") {
			// Find next free untitled name
			const nextId =
				this.lastNoteList
					.filter((note) => note.fileName.startsWith("Untitled"))
					.map((note) => {
						return parseInt(note.fileName.replace("Untitled", ""));
					})
					.sort((a, b) => (a > b ? 1 : -1))[0] + 1;

			fileName = "Untitled" + nextId;
		}

		const res = await fetch(`/api/notes/${fileName}`, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ id: id, fileName: fileName, content }),
		});

		if (!res.ok) {
			throw new Error("Failed to save note");
		}
	}
}
