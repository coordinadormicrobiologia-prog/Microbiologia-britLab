<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1TykrEA8UMW_cCXk09WSZE_qcPuKbf66-

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Proxy / Apps Script expectations

The frontend expects the proxy endpoint GET `/api/proxy?action=getEntries` to return JSON in the form:

```json
{ "ok": true, "data": [ /* array of entries */ ] }
```

and POST requests (save/delete) to return their own response object such as `{ "ok": true, "id": "..." }`.

Important:
- The proxy must not return a POST response when the client requests GET (avoid serving cached POST responses).
- Add `Cache-Control: no-store` (or equivalent) to avoid edge caching that could make a GET return a save response.
- After appendRow() in Google Apps Script call `SpreadsheetApp.flush()` to force persistence before returning.
- For delete operations the proxy should verify the requester is the owner or has admin privileges before deleting.
