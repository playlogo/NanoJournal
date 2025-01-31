import { Server } from "https://deno.land/x/faster@v12.1/mod.ts";

import Database from "./db.ts";
import router_static from "./api/static.ts";
import router_notes from "./api/notes.ts";

// Create sigint listener
Deno.addSignalListener("SIGTERM", () => {
	console.log(`[main] Received SIGTERM`);
	Database.close();
	Deno.exit(0);
});

// Init database
await Database.init();

// Create API
const server = new Server();

// Add routes
router_notes(server);
router_static(server);

// Listen!
await server.listen({ port: 8000 });
