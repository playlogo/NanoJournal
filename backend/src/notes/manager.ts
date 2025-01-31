import Database from "../db.ts";
import { exists } from "../utils.ts";

class Manager {
	async listNotes() {
		const notes = [];

		for (const [id, filename, creationDate, lastEditDate] of Database.db!.query(
			"SELECT id, filename, creationDate, lastEditDate FROM notes"
		)) {
			notes.push({ id, filename, creationDate, lastEditDate });
		}

		return notes;
	}

	async loadNote(id: string) {
		const content = (await Deno.readTextFile(`data/notes/${id}.txt`)).split("\n");
		return content;
	}

	async saveNote(filename: string, id: string, content: string[]) {
		// Parse content for tags
		//TODO

		// Store content to markdown file
		if (!(await exists("data/notes"))) {
			await Deno.mkdir("data/notes", { recursive: true });
		}

		await Deno.writeTextFile(`data/notes/${id}.txt`, content.join("\n"));

		// Update database
		const noteExists = Database.db!.query("SELECT filename FROM notes WHERE id = ?", [id]);

		if (noteExists.length > 0) {
			Database.db!.query("UPDATE notes SET filename = ?, lastEditDate = ? WHERE id = ?", [
				filename,
				Date.now(),
				id,
			]);
		} else {
			Database.db!.query(
				"INSERT INTO notes (id, filename,creationDate, lastEditDate) VALUES (?, ?, ?, ?)",
				[id, filename, Date.now(), Date.now()]
			);
		}
	}
}

export default new Manager();
