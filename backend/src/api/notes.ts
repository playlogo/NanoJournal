import { Server, res, req, Context, NextFunc } from "https://deno.land/x/faster@v12.1/mod.ts";

import NotesManager from "../notes/manager.ts";

export default function router_notes(server: Server) {
	// List notes
	server.get("/api/notes", res("json"), async (ctx: Context, next: NextFunc) => {
		ctx.res.body = await NotesManager.listNotes();

		await next();
	});

	// Upload a note
	server.post("/api/notes", res("json"), req("json"), async (ctx: Context, next: NextFunc) => {
		try {
			const id = await NotesManager.saveNote(ctx.body.filename, ctx.body.id, ctx.body.content);

			ctx.res.body = { id: id };
		} catch (err) {
			ctx.res.status = 500;
			ctx.res.statusText = `${err}`;

			console.error(err);
		}

		await next();
	});

	// Load note
	server.get("/api/notes/:id", res("json"), async (ctx: Context, next: NextFunc) => {
		try {
			let content = await NotesManager.loadNote(ctx.params.id);

			ctx.res.body = { content: content };
		} catch (err) {
			ctx.res.status = 500;
			ctx.res.statusText = `${err}`;

			if (!(err instanceof Deno.errors.NotFound)) {
				console.error(err);
			}
		}

		await next();
	});
}
