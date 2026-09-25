/* Shared by the portfolio and its editor. No credentials belong in this file. */
window.PortfolioAppearance = (() => {
    const defaults = { theme: 'light', accent: '#6366f1', secondary: '#ec4899', highlight: '#f59e0b', photo: 'assets/img/profile-placeholder.svg', photoPosition: 50 };
    function normalize(value = {}) {
        const result = { ...defaults, ...value };
        result.theme = ['light', 'dark', 'system'].includes(result.theme) ? result.theme : 'light';
        for (const key of ['accent', 'secondary', 'highlight']) {
            if (!/^#[0-9a-f]{6}$/i.test(result[key])) result[key] = defaults[key];
        }
        if (typeof result.photo !== 'string' || !/^(assets\/img\/[^?#]+|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/.test(result.photo)) result.photo = defaults.photo;
        result.photoPosition = Math.max(0, Math.min(100, Number(result.photoPosition) || 0));
        return result;
    }
    let current = { ...defaults };
    const media = matchMedia('(prefers-color-scheme: dark)');
    function apply(value) {
        current = normalize(value);
        const root = document.documentElement;
        root.dataset.theme = current.theme === 'system' ? (media.matches ? 'dark' : 'light') : current.theme;
        root.style.setProperty('--accent', current.accent);
        root.style.setProperty('--accent-2', current.secondary);
        root.style.setProperty('--accent-3', current.highlight);
        document.querySelectorAll('[data-profile-photo]').forEach(img => {
            img.src = current.photo;
            img.style.objectPosition = `50% ${current.photoPosition}%`;
        });
        window.dispatchEvent(new CustomEvent('portfolio-appearance-change'));
    }
    media.addEventListener('change', () => apply(current));
    const ready = fetch('assets/data/appearance.json', { cache: 'no-cache' })
        .then(response => { if (!response.ok) throw new Error('Appearance unavailable'); return response.json(); })
        .then(value => { apply(value); return normalize(value); })
        .catch(() => { apply(defaults); return { ...defaults }; });
    return { defaults, normalize, apply, ready, get current() { return current; } };
})();
