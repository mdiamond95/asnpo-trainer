# Fund Balance

A Duolingo-style study app for capital/project accounting and consolidation in Canadian not-for-profits under ASNPO (CPA Canada Handbook – Accounting, Part III). Built as a Progressive Web App you add to your iPhone home screen.

## Use it
1. Open https://mdiamond95.github.io/asnpo-trainer/ in Safari.
2. Tap Share, then **Add to Home Screen**.
3. Open **Fund Balance** from the home screen. It works offline.

Progress (XP, streak, review schedule) is stored on the phone. Use **Progress → Copy backup** now and then.

## How it works
- **Lessons**: 5-minute sessions with multiple choice, true/false, sorting, matching, calculations and a journal-entry builder. Missed questions come back at the end of the lesson.
- **Review**: every concept you've learned is scheduled with the FSRS spaced-repetition algorithm ([ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)). Each review picks a different question for the concept so you can't memorize one wording.
- **Flags**: tap *Flag* after any answer that looks wrong; the Progress tab collects them so they can be fixed.

## Content
Lessons live in `content/unit-NN.yaml` (schema: `src/content/types.ts`). Questions paraphrase the Handbook and cite it at section level; they never quote it.

```
npm run check:content   # validates every question (balanced entries, answer indexes, refs)
```

## Develop
```
npm install
npm run dev            # local dev server
npm test               # grading tests
npm run build          # PWA build for GitHub Pages (dist/)
npm run build:single   # one-file build for a claude.ai preview (dist-single/preview.html)
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`. In the repo's **Settings → Pages**, set *Source* to **GitHub Actions** once.
