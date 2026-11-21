# Aven — Learning that understands you

A pastel, student-friendly mathematics learning app focused on identifying *why* a learner may be stuck, checking the hypothesis, and giving a targeted hint rather than simply revealing answers.


## Run locally
1. Install Node.js 20+ (https://nodejs.org/).
2. Unzip this project and open the folder in your code editor or terminal.
3. Run `npm install`
4. Run `npm run dev`
5. Open http://localhost:5173

The app runs in local-demo mode by default. Demo accounts, profile, sessions, and bookmarks are stored in the browser's local storage. This is suitable for local judging/demo only—not secure real account authentication.


## Optional live AI tutoring
1. Copy `.env.example` to `.env`
2. Add a Gemini API key to `GEMINI_API_KEY` (keep it secret; never commit `.env`)
3. Restart `npm run dev`

The server will use Gemini when configured and fall back to the built-in demo diagnostic if the API is unavailable. The built-in diagnostic is intentionally limited and should not be represented as a trained misconception model.


## Current features
- Login/signup demo flows, local profile and settings
- Dashboard and topic cards
- Practice questions for number sense, operations, fractions, decimals, percentages, ratios, integers, and intro algebra
- Answer + reasoning submission
- AI/demonstration diagnostic with evidence, verification prompt, and targeted hint
- Saved attempts, session history, bookmarks, and progress page
- Responsive mobile navigation and pastel UI
- Local persistence for demo sessions


## Limitations / next production steps
- Demo login is not secure account authentication. Use Supabase Auth or another managed provider for production, with user-scoped database policies.
- Local browser storage is not cross-device sync or encrypted storage. Avoid entering personal information.
- Demo diagnostic is rule-based. Live Gemini is generative and can make mistakes; its suggestions are hypotheses, not certainty.
- Progress accuracy is simple saved-attempt accuracy, not validated mastery or learning efficacy.
- More curriculum, item-level misconception tags, robust answer normalization, accessibility QA, unit/integration tests, privacy policy, and deployment review are needed before representing this as a production service.

## AI disclosure for hackathon
Aven uses AI-assisted development and (when configured) Gemini API responses for tutoring. Built-in demo diagnostics are rule-based and clearly labeled. Disclose all AI coding and model usage in the submission per the event rules.
