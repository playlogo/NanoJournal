import { Server, res, req, Context, NextFunc } from "https://deno.land/x/faster@v12.1/mod.ts";

export default function router_tags(server: Server) {
	// Get all known tags
	server.get("/tags", res("json"), async (ctx: Context, next: NextFunc) => {
		console.log(ctx.body);
		ctx.res.body = { msg: "json response example" };
		await next();
	});

	// Update / Create a tag
	server.post("/tags/:tag", res("json"), req("json"), async (ctx: Context, next: NextFunc) => {
		console.log(ctx.body);
		ctx.res.body = { msg: "json response example" };
		await next();
	});
}
