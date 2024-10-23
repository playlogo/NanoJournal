interface Note {
	creationDate: Date;
	fileName: string;
}

export abstract class StorageAdapter {
	abstract noteList(): string[];
	abstract loadNote(fileName: string): string[];
	abstract saveNote(fileName: string, content: string[]): void;
}

export class StorageAdapterLocal implements StorageAdapter {
	constructor(demo: boolean) {
		if (demo) {
			if (window.localStorage.getItem("notes") === null) {
				window.localStorage.setItem(
					"notes",
					JSON.stringify([
						{ creationDate: new Date(), fileName: "demo" },
						{ creationDate: new Date(), fileName: "demo2" },
						{ creationDate: new Date(), fileName: "demo3" },
						{ creationDate: new Date(), fileName: "demo4" },
						{ creationDate: new Date(), fileName: "demo5" },
						{ creationDate: new Date(), fileName: "demo6" },
						{ creationDate: new Date(), fileName: "demo7" },
						{ creationDate: new Date(), fileName: "demo8" },
						{ creationDate: new Date(), fileName: "demo9" },
						{ creationDate: new Date(), fileName: "demo10" },
						{ creationDate: new Date(), fileName: "demo11" },
						{ creationDate: new Date(), fileName: "demo12" },
						{ creationDate: new Date(), fileName: "demo13" },
						{ creationDate: new Date(), fileName: "demo14" },
						{ creationDate: new Date(), fileName: "demo15" },
						{ creationDate: new Date(), fileName: "demo16" },
					])
				);
			}
		}
	}

	noteList() {
		if (window.localStorage.getItem("notes") === null) {
			return [];
		}

		return (JSON.parse(window.localStorage.getItem("notes")!) as Note[])
			.sort((a, b) => (a.creationDate > b.creationDate ? -1 : 1))
			.map((note) => note.fileName);
	}

	loadNote(fileName: string) {
		if (window.localStorage.getItem("note_" + fileName) === null) {
			throw new Error("Note not found");
		}

		return JSON.parse(window.localStorage.getItem(`note_${fileName}`)!) as string[];
	}

	saveNote(fileName: string, content: string[]): void {
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

		window.localStorage.setItem(`note_${fileName}`, JSON.stringify(content));

		if (!this.noteList().includes(fileName)) {
			// Add note to note list if it doesn't exist
			notes.push({ creationDate: new Date(), fileName: fileName });
			window.localStorage.setItem("notes", JSON.stringify(notes));
		} else {
			// Update note creation date
			const note = notes.find((note) => note.fileName === fileName);
			note!.creationDate = new Date();
			window.localStorage.setItem("notes", JSON.stringify(notes));
		}
	}
}
