import index from "./frontend/index.html";
import path from "path";

const server = Bun.serve({
    routes: {
        "/": index,
        "/images/*": async (req) => {
            const url = new URL(req.url);
            const filePath = path.join(import.meta.dir, "frontend", url.pathname);
            const file = Bun.file(filePath);
            if (await file.exists()) {
                return new Response(file);
            }
            return new Response("Not found", { status: 404 });
        },
    },
    development: {
        hmr: true,
    },
    port: 3000,
});

console.log(`Listening on http://localhost:${server.port}`);
