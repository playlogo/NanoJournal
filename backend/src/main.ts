import { req, res, Server } from "https://deno.land/x/faster@v12.1/mod.ts";

const server = new Server();

server.post("/example_json", res("json"), req("json"), async (ctx: any, next: any) => {
	console.log(ctx.body);
	ctx.res.body = { msg: "json response example" };
	await next();
});
await server.listen({ port: 8000 });

export default { fetch: server.fetch };

server.get("/tags", res("json"), req("text"), async (ctx: any, next: any) => {
	ctx.res.body = { msg: "json response example" };
	await next();
});

server.post("/tags/:id", res("json"), req("json"), async (ctx: any, next: any) => {
	console.log(ctx.body);
	ctx.res.body = { msg: "json response example" };
	await next();
});

server.post("/tags/:id", res("json"), req("json"), async (ctx: any, next: any) => {
	console.log(ctx.body);
	ctx.res.body = { msg: "json response example" };
	await next();
});
// Idea
/*
- Store memos in db
- Ability to store assets



- Provide a exporter util to export them to files

*/

/*
- Daily notes -> Calender view
- Normal notes
- Tags for day


*/
/* Tags
- /tags: List user tags, stored for day (optional prop day)
- POST /tags/:id Add tag to day (optional prop day)
- DELETE /tags/:id Remove tag from day (optional prop day)

{
    "tag": "work",
    "color": "#ff0000",
    "enabled": true
}

*/
