import { Server, serveStatic, redirect, Context, NextFunc } from "https://deno.land/x/faster@v12.1/mod.ts";
import { lookup } from "https://deno.land/x/mrmime@v2.0.0/mod.ts";

export default function router_static(server: Server) {
	server.get("/*", serveStatic("./dist"), async (ctx: Context, next: NextFunc) => {
		const ext = ctx.req.url.match(/\.(?<ext>[^.]*?)(?=\?|#|$)/)![1];

		if (ext) {
			const stats = await Deno.stat(`${Deno.cwd()}/dist/${new URL(ctx.req.url).pathname}`);

			ctx.res.headers = new Headers({
				"content-type": lookup(ext)!,
				"content-length": `${stats.size}`,
				"last-modified": stats.mtime!.toUTCString(),
			});
		}

		await next();
	});

	server.get("/", redirect("/index.html"));
	server.get("", redirect("/index.html"));
}
