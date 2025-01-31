import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

import { exists } from "./utils.ts";

class Database {
	db: DB | null = null;

	async init() {
		if (!(await exists("data/"))) {
			await Deno.mkdir("data/");
		}

		// Open a database
		this.db = new DB("data/notes.db");

		this.db.execute(
			`CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY,filename TEXT,creationDate INTEGER, lastEditDate INTEGER)`
		);
	}

	close() {
		this.db?.close();
	}
}

export default new Database();
