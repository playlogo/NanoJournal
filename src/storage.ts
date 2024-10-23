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
	noteList() {
		if (window.localStorage.getItem("notes") === null) {
			return [];
		}

		const out: string[] = [];

		(JSON.parse(window.localStorage.getItem("notes")!) as Note[]).forEach((note) => {
			out.push(note.fileName);
		});

		return out;
	}

	loadNote(fileName: string) {
		if (window.localStorage.getItem("note_" + fileName) === null) {
			throw new Error("Note not found");
		}

		return JSON.parse(window.localStorage.getItem(`note_${fileName}`)!) as string[];
	}

	saveNote(fileName: string, content: string[]): void {
		window.localStorage.setItem(`note_${fileName}`, JSON.stringify(content));

		// Add note to note list if it doesn't exist
		if (!this.noteList().includes(fileName)) {
			const notes = JSON.parse(window.localStorage.getItem("notes")!) as Note[];
			notes.push({ creationDate: new Date(), fileName: fileName });
			window.localStorage.setItem("notes", JSON.stringify(notes));
		}
	}
}
