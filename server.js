import { Hono } from "https://deno.land/x/hono@v3.4.1/mod.ts";
import * as uuid from "https://deno.land/std@0.207.0/uuid/mod.ts";

const app = new Hono();

app.post("/shorten", async (ctx) => {
    const body = await ctx.req.json();
    const url = body.url;
    const id = uuid.v1.generate();

    // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
    const expireIn = 24 * 60 * 60 * 1000
    const kv = await Deno.openKv();
    await kv.set(["urls", id], url, { expireIn });

    return new Response(JSON.stringify({ id }), {
        status: 200,
        headers: { "access-control-allow-origin": "*" },
    });
});

app.get("/:id", async (ctx) => {
    const id = ctx.req.param("id");

    const kv = await Deno.openKv();
    const url = (await kv.get(["urls", id])).value;

    if (url) {
        return new Response(JSON.stringify({ url }), {
            status: 200,
            headers: { "access-control-allow-origin": "*" },
        });
    }

    return new Response("No URL found.", {
        status: 404,
        headers: { "access-control-allow-origin": "*" },
    });
});

Deno.serve(app.fetch);