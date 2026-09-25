function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/* ---------- Render dynamic content from assets/data/*.json ---------- */
function renderHero(hero) {
    const badge = document.getElementById('hero-badge');
    const roleEl = document.getElementById('role-cycle');
    const bio = document.getElementById('hero-bio');
    if (badge) badge.textContent = hero.badge;
    if (bio) bio.textContent = hero.bio;
    if (roleEl) {
        roleEl.setAttribute('data-roles', JSON.stringify(hero.roles || []));
        roleEl.textContent = (hero.roles && hero.roles[0]) || '';
    }
}

function renderAbout(about) {
    const paragraphs = document.getElementById('about-paragraphs');
    if (paragraphs) {
        paragraphs.innerHTML = about.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    }
    const quickFacts = document.getElementById('about-quick-facts');
    if (quickFacts) {
        const f = about.quickFacts || {};
        quickFacts.innerHTML = `
            <li><strong class="text-slate-900">DEGREE:</strong> ${escapeHtml(f.degree)}</li>
            <li><strong class="text-slate-900">LOCATION:</strong> ${escapeHtml(f.location)}</li>
            <li><strong class="text-slate-900">INTERESTS:</strong> ${escapeHtml(f.interests)}</li>
        `;
    }
}

function renderEducation(list) {
    const el = document.getElementById('education-container');
    if (!el) return;
    el.innerHTML = list.map(edu => {
        const ongoing = edu.status === 'ongoing';
        const badgeClass = ongoing ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600';
        const badgeLabel = ongoing ? 'Ongoing' : 'Completed';
        return `
        <div class="card reveal p-8 rounded-xl">
            <span class="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${badgeClass} mb-3">${badgeLabel}</span>
            <h3 class="text-xl font-bold text-slate-900 mb-1">${escapeHtml(edu.school)}</h3>
            <p class="text-sm text-slate-700 font-semibold mb-1">${escapeHtml(edu.degree)}${edu.fieldOfStudy ? ' in ' + escapeHtml(edu.fieldOfStudy) : ''}</p>
            <p class="text-xs text-slate-500 mb-2">${escapeHtml(edu.startYear)} – ${edu.endYear ? escapeHtml(edu.endYear) : 'Present'}</p>
            ${edu.grade ? `<p class="text-xs text-slate-500">Grade: ${escapeHtml(edu.grade)}</p>` : ''}
        </div>`;
    }).join('');
}

function renderStats(stats) {
    const el = document.getElementById('stats-container');
    if (!el) return;
    el.innerHTML = stats.map((s, i) => `
        <div class="${i === 0 ? 'pl-0 pr-8' : (i === stats.length - 1 ? 'pl-8' : 'pl-8 pr-8')}">
            <p class="text-4xl md:text-5xl font-extrabold text-${escapeHtml(s.color)}-600">${escapeHtml(s.value)}</p>
            <p class="text-sm text-slate-500 mt-1">${escapeHtml(s.label)}</p>
        </div>
    `).join('');
}

function renderSkills(categories) {
    const el = document.getElementById('skills-container');
    if (!el) return;
    el.innerHTML = categories.map(cat => `
        <div class="reveal">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">${escapeHtml(cat.category)}</h3>
            <div class="flex flex-wrap gap-3">
                ${cat.items.map(item => `<span class="skill-tag px-4 py-2.5 rounded-lg text-sm font-medium">${escapeHtml(item)}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

const EXP_TYPE_BADGES = {
    project: ['Project', 'bg-indigo-100 text-indigo-600'],
    internship: ['Internship', 'bg-pink-100 text-pink-600'],
    experience: ['Work Experience', 'bg-amber-100 text-amber-600']
};

function renderExperience(list) {
    const el = document.getElementById('experience-container');
    if (!el) return;
    el.innerHTML = list.map(item => {
        const [label, badgeClass] = EXP_TYPE_BADGES[item.type] || ['Other', 'bg-slate-100 text-slate-600'];
        // Back-compat: older entries may still use a single link/linkLabel pair instead of links[].
        const links = (item.links && item.links.length ? item.links : (item.link ? [{ label: item.linkLabel, url: item.link }] : []))
            .filter(l => l.url);
        return `
        <div data-exp-type="${escapeHtml(item.type)}" class="card tilt-card reveal p-8 rounded-xl flex flex-col justify-between">
            <div>
                <span class="inline-block text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${badgeClass} mb-3">${label}</span>
                <h3 class="text-xl font-bold text-slate-900 mb-2">${escapeHtml(item.title)}</h3>
                ${item.subtitle ? `<p class="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-4">${escapeHtml(item.subtitle)}</p>` : ''}
                <p class="text-sm text-slate-600 mb-6 leading-relaxed">${escapeHtml(item.description)}</p>
            </div>
            ${item.tags || links.length ? `
            <div class="flex flex-wrap gap-4 items-center">
                ${item.tags ? `<span class="text-xs font-semibold text-indigo-500 tracking-wider uppercase">${escapeHtml(item.tags)}</span>` : ''}
                ${links.length ? `<div class="flex flex-wrap gap-3 ml-auto">${links.map(l => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener" class="text-xs text-slate-900 underline hover:text-indigo-600">${escapeHtml(l.label || 'View')} ↗</a>`).join('')}</div>` : ''}
            </div>` : ''}
        </div>`;
    }).join('');
}

function renderCertifications(list) {
    const el = document.getElementById('certifications-container');
    if (!el) return;
    el.innerHTML = list.map(c => `
        <div data-cert-item class="card reveal aspect-square p-2.5 rounded-lg flex flex-col justify-between text-center">
            <div class="flex-1 flex items-center justify-center"><p class="text-[11px] font-semibold text-slate-900 leading-snug">${escapeHtml(c.title)}</p></div>
            <div>
                <p class="text-[8px] text-slate-400 mb-1 truncate">${escapeHtml(c.issuer)}${c.certId ? ' · ID ' + escapeHtml(c.certId) : ''}</p>
                ${c.link ? `<a href="${escapeHtml(c.link)}" target="_blank" rel="noopener" class="text-[8px] font-bold uppercase tracking-wide text-indigo-600 hover:underline">View ↗</a>` : ''}
            </div>
        </div>
    `).join('');
}

async function loadContent() {
    try {
        const [hero, about, education, stats, skills, experience, certifications] = await Promise.all([
            fetch('assets/data/hero.json').then(r => r.json()),
            fetch('assets/data/about.json').then(r => r.json()),
            fetch('assets/data/education.json').then(r => r.json()),
            fetch('assets/data/stats.json').then(r => r.json()),
            fetch('assets/data/skills.json').then(r => r.json()),
            fetch('assets/data/experience.json').then(r => r.json()),
            fetch('assets/data/certifications.json').then(r => r.json())
        ]);
        renderHero(hero);
        renderAbout(about);
        renderEducation(education);
        renderStats(stats);
        renderSkills(skills);
        renderExperience(experience);
        renderCertifications(certifications);
    } catch (e) {
        console.error('Failed to load portfolio content', e);
    }
}

/* ---------- Interactive behavior (runs after content is rendered) ---------- */
function initInteractions() {

    /* ---------- Mobile nav toggle ---------- */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
        const setOpen = (open) => {
            hamburger.classList.toggle('open', open);
            mobileMenu.classList.toggle('open', open);
            hamburger.setAttribute('aria-expanded', String(open));
        };
        hamburger.addEventListener('click', () => setOpen(!mobileMenu.classList.contains('open')));
        hamburger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(!mobileMenu.classList.contains('open'));
            }
        });
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => setOpen(false));
        });
    }

    /* ---------- Reveal on scroll ---------- */
    const revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length) {
        const reveal = (el) => el.classList.add('in-view');
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        reveal(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });
            revealEls.forEach(el => observer.observe(el));
            // Safety net: guarantee visibility even if the observer never fires
            // (e.g. inside an embedded webview that doesn't run a compositor step).
            setTimeout(() => revealEls.forEach(reveal), 1500);
        } else {
            revealEls.forEach(reveal);
        }
    }

    /* ---------- Back to top ---------- */
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('show', window.scrollY > 500);
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ---------- Cursor glow (pointer devices only) ---------- */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const glow = document.createElement('div');
        glow.className = 'cursor-glow';
        document.body.appendChild(glow);
        window.addEventListener('mousemove', (e) => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
            glow.style.opacity = '1';
        });
        document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
    }

    /* ---------- Tilt effect on cards (pointer devices only) ---------- */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.querySelectorAll('.tilt-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `perspective(700px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateY(0)';
            });
        });
    }

    /* ---------- Role cycler (home page hero) ---------- */
    const roleEl = document.getElementById('role-cycle');
    if (roleEl) {
        let roles = [];
        try { roles = JSON.parse(roleEl.getAttribute('data-roles')); } catch (e) { roles = []; }
        if (roles.length > 1) {
            let i = 0;
            setInterval(() => {
                roleEl.classList.add('fade');
                setTimeout(() => {
                    i = (i + 1) % roles.length;
                    roleEl.textContent = roles[i];
                    roleEl.classList.remove('fade');
                }, 350);
            }, 2600);
        }
    }

    /* ---------- Copy to clipboard ---------- */
    const toast = document.getElementById('toast');
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toast.classList.remove('show'), 1800);
    }
    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const value = btn.getAttribute('data-copy');
            try {
                await navigator.clipboard.writeText(value);
                showToast('Copied to clipboard');
            } catch (e) {
                showToast('Copy failed — please copy manually');
            }
        });
    });

    /* ---------- Certificate search filter ---------- */
    const certSearch = document.getElementById('cert-search');
    if (certSearch) {
        const items = document.querySelectorAll('[data-cert-item]');
        certSearch.addEventListener('input', () => {
            const q = certSearch.value.trim().toLowerCase();
            items.forEach(item => {
                const match = item.textContent.toLowerCase().includes(q);
                item.style.display = match ? '' : 'none';
            });
        });
    }

    /* ---------- Work experience type filter ---------- */
    const expFilter = document.getElementById('exp-filter');
    if (expFilter) {
        const cards = document.querySelectorAll('[data-exp-type]');
        expFilter.addEventListener('change', () => {
            const val = expFilter.value;
            cards.forEach(card => {
                const match = val === 'all' || card.getAttribute('data-exp-type') === val;
                card.style.display = match ? '' : 'none';
            });
        });
    }

    /* ---------- EmailJS contact form ---------- */
    const EMAILJS_PUBLIC_KEY = '45pnnty5ZfPsjgzA_';
    const EMAILJS_SERVICE_ID = 'service_f14bydq';
    const EMAILJS_TEMPLATE_ID = 'template_od5ehqc';

    const contactForm = document.getElementById('contact-form');
    if (contactForm && window.emailjs) {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalLabel = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, contactForm)
                .then(() => {
                    showToast('Message sent — thank you!');
                    contactForm.reset();
                })
                .catch(() => {
                    showToast('Something went wrong — please email me directly.');
                })
                .finally(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalLabel;
                });
        });
    }

    /* ---------- Scrollspy: highlight nav link for section in view ---------- */
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.nav-link, #mobile-menu a');
    if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
        const setActive = (id) => {
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + id);
            });
        };
        const spy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        sections.forEach(section => spy.observe(section));
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadContent();
    initInteractions();
});
