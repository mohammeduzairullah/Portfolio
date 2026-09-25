const GH_OWNER = 'mohammeduzairullah';
const GH_REPO = 'portfolio-template-editable';
const GH_BRANCH = 'main';
const TOKEN_KEY = `portfolio_admin_gh_token:${GH_OWNER}/${GH_REPO}`;

const DATA_FILES = {
    hero: 'assets/data/hero.json',
    about: 'assets/data/about.json',
    education: 'assets/data/education.json',
    stats: 'assets/data/stats.json',
    skills: 'assets/data/skills.json',
    experience: 'assets/data/experience.json',
    certifications: 'assets/data/certifications.json'
};

const state = {}; // state[key] = { sha, data }

function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

function b64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}
function b64DecodeUnicode(str) {
    return decodeURIComponent(escape(atob(str)));
}

function ghHeaders() {
    return {
        Authorization: `Bearer ${getToken()}`,
        Accept: 'application/vnd.github+json'
    };
}

async function ghGetFile(path) {
    const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`, {
        headers: ghHeaders()
    });
    if (!res.ok) throw new Error(`Couldn't load ${path} (${res.status})`);
    const data = await res.json();
    return { sha: data.sha, json: JSON.parse(b64DecodeUnicode(data.content)) };
}

async function ghPutFile(path, sha, jsonData, message) {
    const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
        method: 'PUT',
        headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            content: b64EncodeUnicode(JSON.stringify(jsonData, null, 2) + '\n'),
            sha,
            branch: GH_BRANCH
        })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Couldn't save ${path} (${res.status})`);
    }
    return res.json();
}

const toast = document.getElementById('toast');
function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2400);
}

function field(container, { label, type = 'text', value = '', options = null }) {
    const wrap = document.createElement('div');
    wrap.className = 'mb-3';
    const lab = document.createElement('label');
    lab.className = 'field-label';
    lab.textContent = label;
    wrap.appendChild(lab);

    let input;
    if (type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 3;
    } else if (type === 'select') {
        input = document.createElement('select');
        (options || []).forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt;
            if (opt === value) o.selected = true;
            input.appendChild(o);
        });
    } else {
        input = document.createElement('input');
        input.type = type;
    }
    input.className = 'search-input w-full px-3 py-2 rounded-md text-sm';
    if (type !== 'select') input.value = value;
    wrap.appendChild(input);
    container.appendChild(wrap);
    return input;
}

function removeButton(onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Remove';
    btn.className = 'btn-outline text-[10px] px-3 py-1.5 rounded-md font-bold uppercase tracking-wide';
    btn.addEventListener('click', onClick);
    return btn;
}

function saveBar(onSave, onReload) {
    const bar = document.createElement('div');
    bar.className = 'flex gap-3 mt-4';
    const save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'Save Changes';
    save.className = 'btn-primary px-5 py-2.5 rounded-lg text-sm font-bold';
    save.addEventListener('click', onSave);
    const reload = document.createElement('button');
    reload.type = 'button';
    reload.textContent = 'Reload from GitHub';
    reload.className = 'btn-outline px-5 py-2.5 rounded-lg text-sm font-semibold';
    reload.addEventListener('click', onReload);
    bar.appendChild(save);
    bar.appendChild(reload);
    return bar;
}

/* ---------- Hero panel ---------- */
function renderHeroPanel() {
    const el = document.getElementById('tab-hero');
    el.innerHTML = '';
    const data = { badge: state.hero.data.badge, roles: [...state.hero.data.roles], bio: state.hero.data.bio };

    const card = document.createElement('div');
    card.className = 'entry-card';
    const badge = field(card, { label: 'Badge line (above your name)', value: data.badge });
    const roles = field(card, { label: 'Cycling roles (one per line)', type: 'textarea', value: data.roles.join('\n') });
    const bio = field(card, { label: 'Bio paragraph (below your name)', type: 'textarea', value: data.bio });
    badge.addEventListener('input', () => data.badge = badge.value);
    roles.addEventListener('input', () => data.roles = roles.value.split('\n').map(s => s.trim()).filter(Boolean));
    bio.addEventListener('input', () => data.bio = bio.value);
    el.appendChild(card);

    el.appendChild(saveBar(
        async () => {
            try {
                const res = await ghPutFile(DATA_FILES.hero, state.hero.sha, data, 'Update hero content via admin portal');
                state.hero.sha = res.content.sha;
                state.hero.data = data;
                showToast('Hero content saved — live site will update shortly.');
            } catch (e) { showToast(e.message); }
        },
        async () => { await loadPanel('hero'); showToast('Reloaded from GitHub.'); }
    ));
}

/* ---------- About panel ---------- */
function renderAboutPanel() {
    const el = document.getElementById('tab-about');
    el.innerHTML = '';
    const data = { paragraphs: [...state.about.data.paragraphs], quickFacts: { ...state.about.data.quickFacts } };

    const rows = document.createElement('div');
    function draw() {
        rows.innerHTML = '';
        data.paragraphs.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = 'entry-card';
            const para = field(card, { label: `Paragraph ${i + 1}`, type: 'textarea', value: p });
            para.addEventListener('input', () => data.paragraphs[i] = para.value);
            card.appendChild(removeButton(() => { data.paragraphs.splice(i, 1); draw(); }));
            rows.appendChild(card);
        });
    }
    draw();
    el.appendChild(rows);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add Paragraph';
    addBtn.className = 'btn-outline px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide mb-4';
    addBtn.addEventListener('click', () => { data.paragraphs.push('New paragraph.'); draw(); });
    el.appendChild(addBtn);

    const factsCard = document.createElement('div');
    factsCard.className = 'entry-card';
    const degree = field(factsCard, { label: 'Quick Facts: Degree', value: data.quickFacts.degree });
    const location = field(factsCard, { label: 'Quick Facts: Location', value: data.quickFacts.location });
    const interests = field(factsCard, { label: 'Quick Facts: Interests', type: 'textarea', value: data.quickFacts.interests });
    degree.addEventListener('input', () => data.quickFacts.degree = degree.value);
    location.addEventListener('input', () => data.quickFacts.location = location.value);
    interests.addEventListener('input', () => data.quickFacts.interests = interests.value);
    el.appendChild(factsCard);

    el.appendChild(saveBar(
        async () => {
            try {
                const res = await ghPutFile(DATA_FILES.about, state.about.sha, data, 'Update about content via admin portal');
                state.about.sha = res.content.sha;
                state.about.data = data;
                showToast('About content saved — live site will update shortly.');
            } catch (e) { showToast(e.message); }
        },
        async () => { await loadPanel('about'); showToast('Reloaded from GitHub.'); }
    ));
}

/* ---------- Education panel ---------- */
function renderEducationPanel() {
    const el = document.getElementById('tab-education');
    el.innerHTML = '';
    const rows = document.createElement('div');
    const entries = state.education.data.map(e => ({ ...e }));

    function draw() {
        rows.innerHTML = '';
        entries.forEach((edu, i) => {
            const card = document.createElement('div');
            card.className = 'entry-card';
            const school = field(card, { label: 'School / Institution', value: edu.school });
            const degree = field(card, { label: 'Degree', value: edu.degree });
            const fieldOfStudy = field(card, { label: 'Field of Study', value: edu.fieldOfStudy });
            const startYear = field(card, { label: 'Start Year', value: edu.startYear });
            const endYear = field(card, { label: 'End Year (leave blank if ongoing)', value: edu.endYear });
            const status = field(card, { label: 'Status', type: 'select', value: edu.status, options: ['ongoing', 'completed'] });
            const grade = field(card, { label: 'Grade (optional)', value: edu.grade });
            school.addEventListener('input', () => edu.school = school.value);
            degree.addEventListener('input', () => edu.degree = degree.value);
            fieldOfStudy.addEventListener('input', () => edu.fieldOfStudy = fieldOfStudy.value);
            startYear.addEventListener('input', () => edu.startYear = startYear.value);
            endYear.addEventListener('input', () => edu.endYear = endYear.value);
            status.addEventListener('change', () => edu.status = status.value);
            grade.addEventListener('input', () => edu.grade = grade.value);
            card.appendChild(removeButton(() => { entries.splice(i, 1); draw(); }));
            rows.appendChild(card);
        });
    }
    draw();
    el.appendChild(rows);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add Education';
    addBtn.className = 'btn-outline px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide mb-4';
    addBtn.addEventListener('click', () => {
        entries.push({ id: `edu-${Date.now()}`, school: 'New School', degree: '', fieldOfStudy: '', startYear: '', endYear: '', status: 'ongoing', grade: '' });
        draw();
    });
    el.appendChild(addBtn);

    el.appendChild(saveBar(
        async () => {
            try {
                const res = await ghPutFile(DATA_FILES.education, state.education.sha, entries, 'Update education via admin portal');
                state.education.sha = res.content.sha;
                state.education.data = entries;
                showToast('Education saved — live site will update shortly.');
            } catch (e) { showToast(e.message); }
        },
        async () => { await loadPanel('education'); showToast('Reloaded from GitHub.'); }
    ));
}

/* ---------- Stats panel ---------- */
function renderStatsPanel() {
    const el = document.getElementById('tab-stats');
    el.innerHTML = '';
    const rows = document.createElement('div');
    const entries = state.stats.data.map(s => ({ ...s }));

    function draw() {
        rows.innerHTML = '';
        entries.forEach((s, i) => {
            const card = document.createElement('div');
            card.className = 'entry-card';
            const value = field(card, { label: 'Value (e.g. 12+)', value: s.value });
            const label = field(card, { label: 'Label', value: s.label });
            const color = field(card, { label: 'Color', type: 'select', value: s.color, options: ['indigo', 'pink', 'amber', 'emerald', 'sky', 'rose', 'violet'] });
            value.addEventListener('input', () => s.value = value.value);
            label.addEventListener('input', () => s.label = label.value);
            color.addEventListener('change', () => s.color = color.value);
            card.appendChild(removeButton(() => { entries.splice(i, 1); draw(); }));
            rows.appendChild(card);
        });
    }
    draw();
    el.appendChild(rows);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add Stat';
    addBtn.className = 'btn-outline px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide mb-4';
    addBtn.addEventListener('click', () => {
        entries.push({ value: '0+', label: 'New Stat', color: 'indigo' });
        draw();
    });
    el.appendChild(addBtn);

    el.appendChild(saveBar(
        async () => {
            try {
                const res = await ghPutFile(DATA_FILES.stats, state.stats.sha, entries, 'Update stats via admin portal');
                state.stats.sha = res.content.sha;
                state.stats.data = entries;
                showToast('Stats saved — live site will update shortly.');
            } catch (e) { showToast(e.message); }
        },
        async () => { await loadPanel('stats'); showToast('Reloaded from GitHub.'); }
    ));
}

/* ---------- Skills panel ---------- */
function renderSkillsPanel() {
    const el = document.getElementById('tab-skills');
    el.innerHTML = '';
    const rows = document.createElement('div');
    const entries = state.skills.data.map(c => ({ category: c.category, items: [...c.items] }));

    function draw() {
        rows.innerHTML = '';
        entries.forEach((cat, i) => {
            const card = document.createElement('div');
            card.className = 'entry-card';
            const name = field(card, { label: 'Category Name', value: cat.category });
            const items = field(card, { label: 'Skills (comma-separated)', type: 'textarea', value: cat.items.join(', ') });
            name.addEventListener('input', () => cat.category = name.value);
            items.addEventListener('input', () => cat.items = items.value.split(',').map(s => s.trim()).filter(Boolean));
            card.appendChild(removeButton(() => { entries.splice(i, 1); draw(); }));
            rows.appendChild(card);
        });
    }
    draw();
    el.appendChild(rows);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add Category';
    addBtn.className = 'btn-outline px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide mb-4';
    addBtn.addEventListener('click', () => {
        entries.push({ category: 'New Category', items: [] });
        draw();
    });
    el.appendChild(addBtn);

    el.appendChild(saveBar(
        async () => {
            try {
                const res = await ghPutFile(DATA_FILES.skills, state.skills.sha, entries, 'Update skills via admin portal');
                state.skills.sha = res.content.sha;
                state.skills.data = entries;
                showToast('Skills saved — live site will update shortly.');
            } catch (e) { showToast(e.message); }
        },
        async () => { await loadPanel('skills'); showToast('Reloaded from GitHub.'); }
    ));
}

/* ---------- Experience panel ---------- */
function renderExperiencePanel() {
    const el = document.getElementById('tab-experience');
    el.innerHTML = '';
    const rows = document.createElement('div');
    // Migrate legacy single link/linkLabel fields into the links array.
    const entries = state.experience.data.map(e => {
        const links = e.links && e.links.length
            ? e.links.map(l => ({ ...l }))
            : (e.link ? [{ label: e.linkLabel || 'View', url: e.link }] : []);
        const { link, linkLabel, ...rest } = e;
        return { ...rest, links };
    });

    function draw() {
        rows.innerHTML = '';
        entries.forEach((exp, i) => {
            const card = document.createElement('div');
            card.className = 'entry-card';
            const type = field(card, { label: 'Type', type: 'select', value: exp.type, options: ['project', 'internship', 'experience'] });
            const title = field(card, { label: 'Title', value: exp.title });
            const subtitle = field(card, { label: 'Subtitle (role / company — duration)', value: exp.subtitle });
            const description = field(card, { label: 'Description', type: 'textarea', value: exp.description });
            const tags = field(card, { label: 'Tags (optional, e.g. HTML • CSS • JavaScript)', value: exp.tags });
            type.addEventListener('change', () => exp.type = type.value);
            title.addEventListener('input', () => exp.title = title.value);
            subtitle.addEventListener('input', () => exp.subtitle = subtitle.value);
            description.addEventListener('input', () => exp.description = description.value);
            tags.addEventListener('input', () => exp.tags = tags.value);

            const linksLabel = document.createElement('p');
            linksLabel.className = 'field-label';
            linksLabel.textContent = 'Links (optional — repo, live site, etc.)';
            card.appendChild(linksLabel);

            const linksWrap = document.createElement('div');
            card.appendChild(linksWrap);

            function drawLinks() {
                linksWrap.innerHTML = '';
                exp.links.forEach((lnk, li) => {
                    const row = document.createElement('div');
                    row.className = 'flex gap-2 items-center mb-2';
                    const labelInput = document.createElement('input');
                    labelInput.type = 'text';
                    labelInput.placeholder = 'Label (e.g. View Repo, View Live Site)';
                    labelInput.value = lnk.label || '';
                    labelInput.className = 'search-input px-3 py-2 rounded-md text-sm w-1/3';
                    const urlInput = document.createElement('input');
                    urlInput.type = 'url';
                    urlInput.placeholder = 'https://...';
                    urlInput.value = lnk.url || '';
                    urlInput.className = 'search-input px-3 py-2 rounded-md text-sm flex-1';
                    labelInput.addEventListener('input', () => lnk.label = labelInput.value);
                    urlInput.addEventListener('input', () => lnk.url = urlInput.value);
                    row.appendChild(labelInput);
                    row.appendChild(urlInput);
                    row.appendChild(removeButton(() => { exp.links.splice(li, 1); drawLinks(); }));
                    linksWrap.appendChild(row);
                });
            }
            drawLinks();

            const addLinkBtn = document.createElement('button');
            addLinkBtn.type = 'button';
            addLinkBtn.textContent = '+ Add Link';
            addLinkBtn.className = 'btn-outline text-[10px] px-3 py-1.5 rounded-md font-bold uppercase tracking-wide mb-4';
            addLinkBtn.addEventListener('click', () => { exp.links.push({ label: '', url: '' }); drawLinks(); });
            card.appendChild(addLinkBtn);

            card.appendChild(document.createElement('br'));
            const removeEntryBtn = removeButton(() => { entries.splice(i, 1); draw(); });
            removeEntryBtn.textContent = 'Remove This Entry';
            card.appendChild(removeEntryBtn);
            rows.appendChild(card);
        });
    }
    draw();
    el.appendChild(rows);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add Experience';
    addBtn.className = 'btn-outline px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide mb-4';
    addBtn.addEventListener('click', () => {
        entries.push({ id: `exp-${Date.now()}`, type: 'project', title: 'New Entry', subtitle: '', description: '', tags: '', links: [] });
        draw();
    });
    el.appendChild(addBtn);

    el.appendChild(saveBar(
        async () => {
            try {
                const payload = entries.map(e => ({ ...e, links: e.links.filter(l => l.url) }));
                const res = await ghPutFile(DATA_FILES.experience, state.experience.sha, payload, 'Update experience via admin portal');
                state.experience.sha = res.content.sha;
                state.experience.data = payload;
                showToast('Experience saved — live site will update shortly.');
            } catch (e) { showToast(e.message); }
        },
        async () => { await loadPanel('experience'); showToast('Reloaded from GitHub.'); }
    ));
}

/* ---------- Certifications panel ---------- */
function renderCertificationsPanel() {
    const el = document.getElementById('tab-certifications');
    el.innerHTML = '';
    const rows = document.createElement('div');
    const entries = state.certifications.data.map(c => ({ ...c }));

    function draw() {
        rows.innerHTML = '';
        entries.forEach((cert, i) => {
            const card = document.createElement('div');
            card.className = 'entry-card';
            const title = field(card, { label: 'Title', value: cert.title });
            const issuer = field(card, { label: 'Issuer', value: cert.issuer });
            const certId = field(card, { label: 'Certificate ID (optional)', value: cert.certId });
            const link = field(card, { label: 'Verify Link (optional)', value: cert.link });
            title.addEventListener('input', () => cert.title = title.value);
            issuer.addEventListener('input', () => cert.issuer = issuer.value);
            certId.addEventListener('input', () => cert.certId = certId.value);
            link.addEventListener('input', () => cert.link = link.value);
            card.appendChild(removeButton(() => { entries.splice(i, 1); draw(); }));
            rows.appendChild(card);
        });
    }
    draw();
    el.appendChild(rows);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.textContent = '+ Add Certification';
    addBtn.className = 'btn-outline px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide mb-4';
    addBtn.addEventListener('click', () => {
        entries.push({ id: `cert-${Date.now()}`, title: 'New Certification', issuer: '', certId: '', link: '' });
        draw();
    });
    el.appendChild(addBtn);

    el.appendChild(saveBar(
        async () => {
            try {
                const res = await ghPutFile(DATA_FILES.certifications, state.certifications.sha, entries, 'Update certifications via admin portal');
                state.certifications.sha = res.content.sha;
                state.certifications.data = entries;
                showToast('Certifications saved — live site will update shortly.');
            } catch (e) { showToast(e.message); }
        },
        async () => { await loadPanel('certifications'); showToast('Reloaded from GitHub.'); }
    ));
}

const PANEL_RENDERERS = {
    hero: renderHeroPanel,
    about: renderAboutPanel,
    education: renderEducationPanel,
    stats: renderStatsPanel,
    skills: renderSkillsPanel,
    experience: renderExperiencePanel,
    certifications: renderCertificationsPanel
};

async function loadPanel(key) {
    const panelEl = document.getElementById(`tab-${key}`);
    panelEl.innerHTML = '<p class="text-sm text-slate-500">Loading…</p>';
    try {
        const { sha, json } = await ghGetFile(DATA_FILES[key]);
        state[key] = { sha, data: json };
        PANEL_RENDERERS[key]();
    } catch (e) {
        panelEl.innerHTML = `<p class="text-sm text-rose-600">${e.message}</p>`;
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hidden');
        });
    });
}

async function connect(token) {
    localStorage.setItem(TOKEN_KEY, token);
    const status = document.getElementById('gh-token-status');
    status.textContent = 'Connecting…';
    try {
        const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${GH_REPO}`, { headers: ghHeaders() });
        if (!res.ok) throw new Error('Token rejected or missing repo access (' + res.status + ')');
        status.textContent = 'Connected to ' + GH_OWNER + '/' + GH_REPO + '.';
        document.getElementById('admin-panels').classList.remove('hidden');
        setupTabs();
        await Promise.all(Object.keys(DATA_FILES).map(loadPanel));
    } catch (e) {
        status.textContent = e.message;
        document.getElementById('admin-panels').classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('gh-token-input');
    const connectBtn = document.getElementById('gh-token-connect');
    const clearBtn = document.getElementById('gh-token-clear');

    const saved = getToken();
    if (saved) {
        tokenInput.value = saved;
        connect(saved);
    }

    connectBtn.addEventListener('click', () => {
        const token = tokenInput.value.trim();
        if (!token) return;
        connect(token);
    });

    clearBtn.addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        tokenInput.value = '';
        document.getElementById('gh-token-status').textContent = 'Token forgotten.';
        document.getElementById('admin-panels').classList.add('hidden');
    });
});
