import { readdir } from "node:fs/promises";

async function run() {
    const oauthKeys = await (Bun.file("./gcp-oauth.keys.json")).json();
    const tokens = await (Bun.file("./.gdrive-server-credentials.json")).json();

    const clientId = oauthKeys.installed?.client_id || oauthKeys.web?.client_id;
    const clientSecret = oauthKeys.installed?.client_secret || oauthKeys.web?.client_secret;

    console.log("Refreshing token...");
    const refreshResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: tokens.refresh_token,
            grant_type: "refresh_token",
        }),
    });

    if (!refreshResp.ok) {
        console.error("Failed to refresh token", await refreshResp.text());
        process.exit(1);
    }
    const { access_token } = await refreshResp.json();
    console.log("Token refreshed.");

    const folderId = "1YE_ECZpM7ME_uoOzVZiqfPlD-kRrWoAh";
    const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const listResp = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType)`,
        { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const { files } = await listResp.json();
    console.log("Drive files found:", files);

    const localFiles = await readdir("./docs");
    console.log("Local files found:", localFiles);

    for (const f of files) {
        // Strip out any non alpha-numeric to match local name
        const expectedLocalName = f.name.replace(/[^a-zA-Z0-9]+/g, '_') + '.md';

        if (localFiles.includes(expectedLocalName)) {
            console.log(`Uploading ${expectedLocalName} to ${f.name} (${f.id})...`);

            const content = await Bun.file(`./docs/${expectedLocalName}`).text();

            // For Google Docs, we need to upload with uploadType=media and specify plain text
            const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${f.id}?uploadType=media`;

            const resp = await fetch(uploadUrl, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    // Standard text/plain or text/markdown depending on what they accept
                    "Content-Type": "text/plain"
                },
                body: content
            });

            if (resp.ok) {
                console.log(`[OK] Updated ${f.name}`);
            } else {
                console.error(`[ERROR] Failed to update ${f.name}:`, await resp.text());
            }
        }
    }
    console.log("Done.");
}

run().catch(console.error);
