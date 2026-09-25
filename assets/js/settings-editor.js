/* Profile, contact and integration settings use the same GitHub save flow. */
function renderSitePanel() {
    const panel = document.getElementById('tab-site');
    panel.innerHTML = '';
    const data = PortfolioSite.normalize(state.site.data);
    drafts.site = data;
    const form = document.createElement('form');
    form.className = 'settings-form';
    function group(title, help) {
        const card = document.createElement('fieldset'); card.className = 'entry-card';
        const legend = document.createElement('legend'); legend.textContent = title; card.appendChild(legend);
        if (help) { const p = document.createElement('p'); p.className = 'settings-help'; p.textContent = help; card.appendChild(p); }
        form.appendChild(card); return card;
    }
    function add(card, section, key, label, type = 'text', required = false) {
        const input = field(card, { label, type, value: data[section][key] });
        input.required = required;
        input.addEventListener('input', () => { data[section][key] = input.value; });
        if (type === 'url') input.addEventListener('input', () => input.setCustomValidity(input.value && !PortfolioSite.safeURL(input.value) ? 'Use a full https:// or http:// link.' : ''));
        return input;
    }
    let card = group('Your identity', 'Your name, initials, photo description and browser-tab information.');
    add(card, 'identity', 'firstName', 'First name / first line', 'text', true);
    add(card, 'identity', 'lastName', 'Last name / second line');
    add(card, 'identity', 'initials', 'Logo initials');
    add(card, 'identity', 'title', 'Browser-tab title');
    add(card, 'identity', 'description', 'Search description', 'textarea');
    add(card, 'identity', 'photoAlt', 'Photo description (blank uses your name)');
    add(card, 'identity', 'copyrightName', 'Footer name (blank uses your name)');
    const year = add(card, 'identity', 'copyrightYear', 'Footer year (blank updates automatically)'); year.pattern = '[0-9]{4}|';
    add(card, 'identity', 'footerText', 'Footer text');
    card = group('Contact details', 'Empty contact fields are hidden from your portfolio.');
    add(card, 'contact', 'email', 'Email address', 'email');
    const phone = add(card, 'contact', 'phone', 'Phone number');
    phone.addEventListener('input', () => phone.setCustomValidity(phone.value && !/^[+\d\s().-]+$/.test(phone.value) ? 'Use a phone number with digits, spaces, +, parentheses or hyphens.' : ''));
    add(card, 'contact', 'linkedin', 'LinkedIn profile URL', 'url');
    add(card, 'contact', 'github', 'GitHub profile URL', 'url');
    add(card, 'contact', 'introduction', 'Contact introduction', 'textarea');
    add(card, 'contact', 'invitation', 'Contact invitation', 'textarea');
    card = group('Section headings');
    for (const [key, label] of Object.entries({ about:'About heading', education:'Education heading', skills:'Skills heading', experience:'Experience heading', certifications:'Certificates heading', contact:'Contact heading' })) add(card, 'headings', key, label);
    card = group('Contact form · EmailJS', 'Optional. You can turn the form off and use your email link instead. Use your own EmailJS account when making a copy of this portfolio.');
    const enabledLabel = document.createElement('label'); enabledLabel.className = 'emailjs-switch';
    const enabled = document.createElement('input'); enabled.type = 'checkbox'; enabled.checked = data.emailjs.enabled;
    enabledLabel.append(enabled, document.createTextNode(' Enable contact form')); card.appendChild(enabledLabel);
    const inputs = [add(card, 'emailjs', 'publicKey', 'EmailJS public key'), add(card, 'emailjs', 'serviceId', 'EmailJS service ID'), add(card, 'emailjs', 'templateId', 'EmailJS template ID')];
    function toggleEmail() { data.emailjs.enabled = enabled.checked; inputs.forEach(input => { input.required = enabled.checked; }); }
    enabled.addEventListener('change', toggleEmail); toggleEmail();
    const help = document.createElement('p'); help.className = 'settings-help';
    help.textContent = 'In your EmailJS template, set To Email to your inbox and Reply-To to {{from_email}}. Available fields: {{from_name}}, {{from_email}}, {{phone}}, {{reason}}, {{message}}. Enter only the public key here; these settings are published with your site.';
    card.appendChild(help);
    const docs = document.createElement('a'); docs.href = 'https://www.emailjs.com/docs/tutorial/creating-email-template/'; docs.target = '_blank'; docs.rel = 'noopener'; docs.textContent = 'EmailJS setup guide ↗'; docs.className = 'settings-docs'; card.appendChild(docs);
    form.onsubmit = event => { event.preventDefault(); };
    form.appendChild(saveBar(async () => {
        if (!form.reportValidity()) return;
        try {
            const snapshot = PortfolioSite.normalize(data);
            const result = await ghPutFile(DATA_FILES.site, state.site.sha, snapshot, 'Update profile and settings via live editor');
            state.site = { sha: result.content.sha, data: snapshot };
            showToast('Profile and settings published.');
        } catch (error) { showToast(error.message); }
    }, async () => { await loadPanel('site'); }));
    panel.appendChild(form);
}
PANEL_RENDERERS.site = renderSitePanel;
