# MindFuel

A personal, mobile-first motivation Shorts feed powered by the YouTube Data API.

## Features
- Instagram-style vertical feed
- Study, Discipline, Success, Money, Mindset, Confidence categories
- Automatic YouTube discovery + approved channels
- Save, history, share, hide
- Local-only admin panel
- No AI API required
- Mobile responsive

## Important architecture note
This personal version uses YouTube's official API and opens/embeds YouTube content rather than downloading or re-hosting videos. The API key is stored locally in the browser when entered through Settings. This is convenient for personal use but is not a secure multi-user production architecture.

## Run locally
```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## YouTube API setup
1. Open Google Cloud Console.
2. Create/select a project.
3. Enable **YouTube Data API v3**.
4. Create an API key.
5. In MindFuel → Settings, paste the key.
6. Optionally restrict the key to your website/referrer.

The search API has quota costs, so MindFuel searches on refresh/category changes rather than on every swipe.

## GitHub Pages
This app can be hosted as a static Vite site. For easiest deployment, use GitHub Actions with a Pages workflow or a static hosting service that builds `npm run build` and publishes `dist/`.

## Personal admin
The Admin button is intentionally local-only. Add approved YouTube channels by URL, @handle, or channel ID. Because there is no authentication/database in this version, do not expose the admin controls as a public multi-user CMS.
