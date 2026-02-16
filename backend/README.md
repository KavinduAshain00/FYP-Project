# Backend - Gemini (Tutor) integration

This backend includes a simple server-side proxy to call a Gemini/Vertex AI model as an educational "tutor".

## Environment variables

- `MONGODB_URI` - your MongoDB connection string
- `PORT` - server port (defaults to 5000)
- `JWT_SECRET` - secret used to sign auth tokens
- `GEMINI_API_KEY` - API key for the Generative Language / Vertex AI API (or use service account credentials via `GOOGLE_APPLICATION_CREDENTIALS`)
- `GEMINI_MODEL` - optional model id (defaults to `gemini-1.5`)

See `.env.example` for a sample.

**Admin:** Admin access is stored in the database (`User.role`: `"user"` or `"admin"`). To promote the first admin, run from `backend/`: `node scripts/setAdminByEmail.js <email>`. Existing admins can change roles via `PUT /api/admin/users/:id` with `{ "role": "admin" }` or `{ "role": "user" }`.

## Install

From the `backend/` folder:

```bash
npm install
```

## Start

```bash
npm run dev
# or
npm start
```

## Tutor endpoint

POST `/api/tutor`

Headers: Authorization (Bearer token from login)
Body: { message: string, context?: object }

Example (frontend uses `tutorAPI.ask(message, context)`):

```js
await fetch('/api/tutor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <token>' },
  body: JSON.stringify({
    message: 'Why is my button not clickable?',
    context: { file: 'index.html' },
  }),
});
```

Response: { answer: string }

## Notes & Security

- The server expects an authenticated user (it uses existing `auth` middleware).
- A rate limiter is applied (per-user default: 6 requests/min). In production, replace/increase limits and use a distributed store (Redis) for rate limiting.
- For production usage prefer service account credentials with the Google client libraries and proper scopes, rather than plain API keys.
- You should also add prompt filtering and content safety checks to reduce harmful or unsafe outputs.

## Next steps / Improvements

- Add streaming responses (SSE or websockets) for longer or progressive answers
- Integrate usage & quota metrics, caching for repeated prompts
- Add server-side moderation and sanitize user-provided content before sending to the model
