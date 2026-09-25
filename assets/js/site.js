/* Public site settings shared by the portfolio and its editor. */
window.PortfolioSite = (() => {
    const defaults = {
        identity: { firstName: 'Your', lastName: 'Name', initials: 'YN.', title: 'My Portfolio', description: 'Welcome to my portfolio.', photoAlt: '', copyrightName: '', copyrightYear: '', footerText: 'All rights reserved.' },
        contact: { email: '', phone: '', linkedin: '', github: '', introduction: 'Let’s work together.', invitation: 'Get in touch about opportunities and collaborations.' },
        headings: { about: 'About me', education: 'Education', skills: 'Tools & Technologies', experience: 'Work Experience', certifications: 'Certifications & Training', contact: 'Let’s work together' },
        emailjs: { enabled: false, publicKey: '', serviceId: '', templateId: '' }
    };
    function normalize(value = {}) {
        const result = {};
        for (const group of Object.keys(defaults)) {
            result[group] = {};
            for (const [key, fallback] of Object.entries(defaults[group])) {
                const v = value?.[group]?.[key];
                result[group][key] = typeof fallback === 'boolean' ? v === true : typeof v === 'string' ? v : fallback;
            }
        }
        return result;
    }
    function safeURL(value) {
        try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
    }
    let current = normalize();
    function apply(value) {
        current = normalize(value);
        document.querySelectorAll('[data-site-text]').forEach(el => {
            const [group, key] = el.dataset.siteText.split('.');
            el.textContent = current[group]?.[key] || '';
        });
        const name = [current.identity.firstName, current.identity.lastName].filter(Boolean).join(' ');
        if (!document.body.classList.contains('editor-page')) {
            document.title = current.identity.title || `${name} — Portfolio`;
            const meta = document.querySelector('meta[name="description"]');
            if (meta) meta.content = current.identity.description;
        }
        document.querySelectorAll('[data-profile-photo]').forEach(img => { img.alt = current.identity.photoAlt || `${name} profile photo`; });
        const footer = document.getElementById('copyright');
        if (footer) footer.textContent = `© ${current.identity.copyrightYear || new Date().getFullYear()} ${current.identity.copyrightName || name}. ${current.identity.footerText}`;
        for (const key of ['email', 'phone', 'linkedin', 'github']) {
            const row = document.querySelector(`[data-contact-row="${key}"]`);
            if (!row) continue;
            const value = current.contact[key].trim();
            const href = key === 'email' ? (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : '') : key === 'phone' ? (/^[+\d\s().-]+$/.test(value) ? `tel:${value.replace(/[^+\d]/g, '')}` : '') : safeURL(value);
            row.hidden = !href;
            const link = row.querySelector('a');
            link.textContent = value;
            if (href) link.href = href; else link.removeAttribute('href');
            const copy = row.querySelector('[data-copy]');
            if (copy) copy.dataset.copy = value;
        }
        const form = document.getElementById('contact-form');
        const config = current.emailjs;
        const enabled = config.enabled && config.publicKey && config.serviceId && config.templateId;
        if (form) form.hidden = !enabled;
        const fallback = document.getElementById('contact-fallback');
        if (fallback) { fallback.hidden = !!enabled; fallback.textContent = current.contact.email ? 'Please reach out using the email link.' : 'Contact details will be added soon.'; }
    }
    const ready = fetch('assets/data/site.json', { cache: 'no-cache' })
        .then(r => { if (!r.ok) throw new Error('Site settings unavailable'); return r.json(); })
        .then(data => { apply(data); return current; })
        .catch(() => { apply(defaults); return current; });
    return { defaults, normalize, safeURL, apply, ready, get current() { return current; } };
})();
