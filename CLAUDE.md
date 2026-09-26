# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anti-MailSpoofing School is an educational web app for learning email authentication (SPF, DKIM, DMARC and alignment). It is a defensive teaching tool: it sends no email, makes no DNS queries and has no network access. Part of "100 Security Tools with Generative AI" (Day 035).

## Commands

- `npm test` runs `node --test` (Node.js 22+, no dependencies). GitHub Actions runs it on push and pull_request.
- Open `index.html` directly (file://) or serve the folder with any static server. There is no build step.

## Architecture

Classic scripts (no ES modules, so file:// works). Load order in `index.html`:

1. `js/i18n.js` - `I18n` with `ja` and `en` dictionaries, `t(key, values)`, `apply()` for `data-i18n*` attributes, language choice (`?lang=` → localStorage `anti-mailspoofing-language` → `navigator.language`)
2. `js/mailauth-core.js` - `MailAuthCore`: IP parsing, SPF evaluation (ip4/ip6 CIDR and `all`; include/a/mx/exists/ptr/redirect are listed as not evaluated), organizational domain (short suffix list), alignment, DMARC parsing and evaluation, `evaluateMessage()`. Pure, no DOM
3. `js/mailauth-data.js` - `MailAuthData`: ten simulation presets and twelve challenge questions (documentation domains and addresses only)
4. `js/main.js` - tabs (WAI-ARIA tabs, arrow keys), help `<dialog>`, language button
5. `js/learn.js` - topic cards and the five-step flow, drawn from a small state object
6. `js/simulate.js` - form → `MailAuthCore.evaluateMessage` → DNS lookups, steps, result and suggestions. A run id prevents overlapping runs
7. `js/challenge-logic.js` - `ChallengeLogic`: streaks count only at the highest unlocked level; three in a row unlock the next level; no immediate repeats
8. `js/challenge.js` - challenge UI; the correct answer is always computed with `MailAuthCore`

## Rules

- All evaluation belongs in `js/mailauth-core.js`. UI scripts must not re-implement SPF/DMARC logic.
- Question answers are computed. `expected` in the data is only checked by the tests; never edit it to make a test pass.
- CSP forbids inline scripts and styles: no inline event handlers, no `style=` attributes, no `.style.` writes, no `innerHTML`/`insertAdjacentHTML`, no `alert()`. Build DOM with `createElement` and `textContent`.
- UI text lives in `js/i18n.js` (both languages, same keys). Other scripts contain no Japanese outside comments.
- Colors used for text are the variables in the `:root` block at the end of `style.css`; `test/contrast.test.js` checks them.
- README tables are generated from the core; `test/readme.test.js` recomputes them.

## Tests

- `test/core.test.js` - SPF, IP parsing, organizational domain, alignment, DMARC
- `test/data.test.js` - presets, questions, documentation-only examples, challenge progression
- `test/html.test.js` - CSP, ARIA, forbidden patterns, script order
- `test/i18n.test.js` - dictionary keys, no Japanese in English, keys used exist
- `test/contrast.test.js` - palette contrast ratios
- `test/format.test.js` - line lengths and minimum file sizes
- `test/readme.test.js` - README tables, YAML structure, heading parity, images, directory tree
