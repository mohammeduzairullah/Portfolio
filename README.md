# Portfolio Template Editable

A one-page portfolio site for an aspiring **Project Coordinator** / future **IT Project Manager**, deployed on GitHub Pages. Content (hero, about, education, stats, skills, work experience, certifications) is data-driven and editable through a private admin portal — no code editing required for day-to-day updates.

🌐 **GitHub Pages:** [Portfolio Template Editable](https://mohammeduzairullah.github.io/portfolio-template-editable/)

---

## Key Features

- **Single-page layout** with smooth-scrolling nav and scrollspy (nav link highlights the section in view).
- **Data-driven content** — hero text, About paragraphs, education, stats, skills, work experience, and certifications all live in `assets/data/*.json` and render client-side, instead of being hardcoded in HTML.
- **Admin portal** (`admin.html`) — connect with a GitHub personal access token (stored only in your browser) and edit any of the sections above through forms; saving commits straight to this repo and the live site rebuilds automatically.
- **Work Experience** section merges projects, internships, and jobs into one filterable list (dropdown by type), with support for multiple links per entry (e.g. a GitHub repo *and* a live deployed site).
- **Certifications** section is a searchable grid of compact cards.
- **Contact form** sends real email via [EmailJS](https://www.emailjs.com) (no backend required) instead of linking out to a form.
- Scroll-reveal animations, tilt-on-hover cards, cursor glow (desktop only), a cycling role headline, and copy-to-clipboard buttons for email/phone.
- Respects `prefers-reduced-motion`; degrades gracefully without JavaScript-dependent animation getting stuck.

---

## Built With

- **HTML5 + Tailwind CSS (via CDN)** — no build step.
- **Vanilla JavaScript (ES6)** — content rendering, interactivity, and the admin portal's GitHub API calls, all with no framework or bundler.
- **Google Fonts** — `Plus Jakarta Sans` (body) and `Playfair Display` (accents).
- **EmailJS** — client-side email delivery for the contact form.
- **GitHub REST API (Contents endpoint)** — used by the admin portal to read/write the JSON data files directly.

---

## Project Structure

```text
├── index.html                    # Page shell; content sections are populated by assets/js/main.js
├── admin.html                    # Private admin portal (not linked from the site, blocked in robots.txt)
├── robots.txt                    # Keeps admin.html out of search engines
├── assets/
│   ├── css/style.css             # Theme, layout, animations
│   ├── js/
│   │   ├── main.js               # Fetches assets/data/*.json, renders sections, wires up interactivity
│   │   └── admin.js              # Admin portal: GitHub token auth + per-section edit forms
│   ├── data/
│   │   ├── hero.json             # Badge line, cycling role headlines, bio paragraph
│   │   ├── about.json            # About paragraphs + Quick Facts
│   │   ├── education.json        # School, degree, field of study, years, status, grade
│   │   ├── stats.json            # The stat counters under the hero
│   │   ├── skills.json           # Skill categories and tags
│   │   ├── experience.json       # Work experience entries (type: project/internship/experience)
│   │   └── certifications.json   # Certification cards
│   └── img/PIC.png               # Profile photo
└── README.md
```

---

## Editing Content

Two ways to update the site:

1. **Admin portal (recommended for content):** open `admin.html` under the deployed site's path, paste a GitHub fine-grained personal access token scoped to only this repo with **Contents: Read and write**, and use the Hero / About / Education / Stats / Skills / Experience / Certifications tabs. Saving commits directly to `main`; GitHub Pages rebuilds automatically.
2. **Direct edits:** the `assets/data/*.json` files can be hand-edited and committed like any other file, and `index.html`/`assets/css/style.css`/`assets/js/main.js` for structural or design changes.

The admin token is stored only in that browser's `localStorage` and is used solely for direct calls to GitHub's API — it's never embedded in any committed file.

---

## Customizing Appearance

Open `admin.html`, connect to GitHub, and choose **Customize appearance**. Choose Light, Dark, or Follow device; pick a color preset or change the three colors individually. Upload a profile photo and adjust its vertical position in the circular preview. Recommended photo size: **800 × 800 px**; JPG, PNG, or WebP up to 10 MB. Uploaded photos are resized to fit within 800 × 800 px.

Changes preview immediately. **Cancel**, the close button, or Escape restores the saved appearance. **Reset appearance** previews the original colors and photo; save to publish that reset. **Save to GitHub** writes colors, theme, and the resized photo together to `assets/data/appearance.json`. GitHub Pages shows the changes after its deployment finishes. No separate image upload or build tooling is needed.

When sharing a copy with friends, set `GH_OWNER`, `GH_REPO`, and `GH_BRANCH` at the top of `assets/js/admin.js` to their repository. They must also replace personal content and configure their own EmailJS account below.

## Contact Form Setup

The contact form uses EmailJS. Credentials live in `assets/js/main.js` (`EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`) — the public key is meant to be client-side, same model as a Stripe publishable key.
