# Portfolio Template Editable

A GitHub Pages portfolio with a live browser editor. It starts with neutral example content and a placeholder avatar. Replace the examples with your own details through the editor.

## Make your own copy

1. Choose **Use this template → Create a new repository** on GitHub.
2. In your repository, choose **Settings → Pages → Deploy from a branch → main → / (root)** and save.
3. Open your deployed site and choose **Edit portfolio** in the footer (or visit `admin.html` under your site URL).
4. Check the GitHub username, repository and branch. GitHub Pages addresses are detected automatically; custom domains can be configured in the form.
5. Create a fine-grained personal access token limited to your repository with **Contents: Read and write**. Enter it in the editor and connect. Never add the token to a file or commit it.
6. Edit your profile, content, colors and photo. The preview changes immediately. Choose **Publish this section** for every section you edit. GitHub Pages deploys the saved changes automatically.

No code changes are required for normal personalization. The token is kept in the current browser tab’s session. **Disconnect** removes it. Repository details (without the token) are remembered in local storage. GitHub controls write access; opening the editor does not grant visitors permission to publish.

## Editor features

- **Profile & settings:** name, logo initials, browser title, description, photo description, footer, email, phone, social links, contact text, section headings and EmailJS.
- **Intro / About / Education / Stats / Skills / Experience / Certificates:** edit existing entries, add entries or remove them.
- **Colors & photo:** light, dark or device theme; color presets and custom colors; photo upload and vertical positioning. Recommended photo: **800 × 800 px**, JPG, PNG or WebP, up to 10 MB. Photos are resized to fit within 800 × 800 px and shown in a circle.
- **Live preview:** unpublished changes are visible only in your editor. You can try the editor without a token; publishing requires a connection.
- **Reload from GitHub:** discards that section’s draft after confirmation. Save errors preserve the draft. If a file changes elsewhere, copy your edits before reloading.

## EmailJS (optional)

The contact form starts **disabled**, with no EmailJS account configured. Add your own EmailJS settings and enable it in the editor if you want a contact form. Otherwise, add your email address so visitors can use your email link.

In **Profile & settings → Contact form · EmailJS**, enter your public key, service ID and template ID. Never enter an EmailJS private key or your GitHub token in these fields; site settings are public.

Configure **To Email** in your EmailJS template as your inbox and **Reply-To** as `{{from_email}}`. The form supplies:

- `{{from_name}}`
- `{{from_email}}`
- `{{phone}}`
- `{{reason}}`
- `{{message}}`

See [EmailJS template setup](https://www.emailjs.com/docs/tutorial/creating-email-template/) and [form field matching](https://www.emailjs.com/docs/sdk/send-form/). Preview mode never sends email.

## Project layout

- `index.html`: public portfolio shell
- `admin.html`: live editor and repository connection
- `assets/data/site.json`: identity, contacts, headings and EmailJS public settings
- `assets/data/appearance.json`: theme, colors and profile photo
- Other `assets/data/*.json`: content sections
- `assets/js/site.js`, `appearance.js`, `main.js`: public site rendering
- `assets/js/admin.js`, `settings-editor.js`, `customizer.js`: editing and GitHub saves
- `assets/css/style.css`, `editor.css`: portfolio and editor styles

Uses HTML, CSS, vanilla JavaScript, Tailwind CDN, GitHub’s Contents API and optional EmailJS. No build step or application server is needed. Search metadata is updated by JavaScript; previews from services that do not execute JavaScript may use the initial HTML metadata.

## Local verification

Requires Node.js. Run `node --test tests/editor.test.cjs` for connection, publishing, conflict, network failure, Unicode and settings validation tests.

Run `node tests/server.cjs`, then open `http://127.0.0.1:4173/admin.html` for local preview. The isolated test editor at `/__test__/admin.html` simulates GitHub using the fake token `test-token`. Its saves stay in memory and never reach GitHub. Restarting the server clears test data. Visiting `/__mock__/fail-next-save` makes the next simulated save return a conflict for testing draft recovery.
