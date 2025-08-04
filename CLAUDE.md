# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anti-MailSpoofing School is an educational web application for learning about email authentication mechanisms (SPF, DKIM, DMARC). It's a defensive security tool designed to help users understand and defend against email spoofing attacks.

## Architecture

### Core Structure
- **Frontend-only application**: Pure HTML/CSS/JavaScript, no backend required
- **Three main modes**: Learn, Simulate, and Challenge tabs
- **Module pattern**: Each tab has its own JavaScript module (learn.js, simulate.js, challenge.js)
- **Tab management**: main.js handles tab switching and initialization

### File Organization
```
/
├── index.html         # Main HTML with 3-tab structure
├── style.css          # All styling including tab navigation, cards, forms
└── js/
    ├── main.js        # Tab switching logic and initialization
    ├── learn.js       # Educational content cards generation
    ├── simulate.js    # Email authentication simulation logic
    └── challenge.js   # Quiz functionality
```

## Development Commands

Since this is a static site with no build process:
- **Run locally**: Open index.html directly in browser or use a local server
- **Test changes**: Refresh browser after editing files
- **Deploy**: Commit to main branch for GitHub Pages deployment

## Key Implementation Details

### Tab System
- Tab switching managed via data-tab attributes and active CSS classes
- Each tab content is a section with corresponding ID (learn, simulate, challenge)
- JavaScript modules dynamically inject content into their respective sections

### Email Authentication Logic
The simulate.js contains simplified email authentication logic:
- SPF validation checks if sending IP is in the SPF record
- DKIM is a simple pass/fail radio button
- DMARC policy enforcement based on SPF/DKIM results

### Security Context
This is a defensive security educational tool. The codebase simulates email authentication mechanisms to help users understand how to protect against spoofing attacks. No actual email sending or malicious functionality exists.

## Important Notes

- GitHub Pages deployment URL: https://ipusiron.github.io/anti-mailspoofing-school/
- MIT Licensed open source project
- Part of "100 Security Tools with Generative AI" project series