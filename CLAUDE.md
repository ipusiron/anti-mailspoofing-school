# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anti-MailSpoofing School is an educational web application for learning about email authentication mechanisms (SPF, DKIM, DMARC). This is a defensive security educational tool - no actual email sending or malicious functionality exists.

## Development Commands

Since this is a static site with no build process:
- **Run locally**: `python -m http.server` or open index.html directly in browser
- **Test changes**: Refresh browser after editing files
- **Deploy**: Commit to main branch for GitHub Pages deployment (https://ipusiron.github.io/anti-mailspoofing-school/)

## Architecture

### Core Structure
- **Frontend-only application**: Pure HTML/CSS/JavaScript, no backend or build step
- **Three main modes**: Learn, Simulate, and Challenge tabs
- **Module pattern**: Each tab has its own JavaScript module in `js/`
- **Tab management**: main.js handles tab switching via data-tab attributes and active CSS classes
- **Help modal**: Managed in main.js with ESC key and background click close support

### JavaScript Module Responsibilities
- `main.js`: Tab switching, help modal control
- `learn.js`: Educational content with interactive flow diagrams and CSS animations
- `simulate.js`: 7 preset scenarios, DNS visualization, step-by-step async execution with `async/await`
- `challenge.js`: 9-question database (3 per level), progressive unlock system (3 consecutive correct answers unlock next level)

## Key Implementation Patterns

### State Management
- Challenge mode uses `challengeState` object for tracking progress, unlocked levels, and streaks
- Animation control uses `isPlaying` flag with proper `clearTimeout()` cleanup
- Form state synchronization between preset scenarios and custom input

### Security
- XSS protection via `escapeHtml()` function in simulate.js
- Double-submit prevention via button/radio disabling after answer submission

### Email Authentication Logic (Simplified)
- SPF: Checks if sending IP matches `ip4:` in SPF record string
- DKIM: Simple pass/fail radio button
- DMARC: SPF OR DKIM pass = DMARC pass; otherwise apply policy (none/quarantine/reject)

## Important Notes

- UI is entirely in Japanese
- Part of "100 Security Tools with Generative AI" project series (Day 035)
- MIT Licensed