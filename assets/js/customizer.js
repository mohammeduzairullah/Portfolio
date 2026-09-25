(() => {
    const appearance = window.PortfolioAppearance;
    const path = 'assets/data/appearance.json';
    let saved, draft, sha, busy = false, photoVersion = 0;
    const dialog = document.createElement('dialog');
    dialog.className = 'customizer';
    dialog.setAttribute('aria-labelledby', 'customizer-title');
    dialog.innerHTML = `
        <div class="customizer-heading"><div><p class="customizer-eyebrow">MAKE IT YOURS</p><h2 id="customizer-title">Portfolio appearance</h2></div><button type="button" id="customizer-close" aria-label="Close appearance editor">✕</button></div>
        <p class="customizer-intro">Preview your style here, then save it for everyone visiting your portfolio.</p>
        <form id="appearance-form">
            <fieldset id="appearance-fields">
                <div class="customizer-grid"><div>
                    <label for="appearance-theme">Theme</label><select id="appearance-theme"><option value="light">Light</option><option value="dark">Dark</option><option value="system">Follow device</option></select>
                    <p class="customizer-label">Color presets</p><div class="preset-list"><button type="button" data-preset="violet">Violet</button><button type="button" data-preset="ocean">Ocean</button><button type="button" data-preset="forest">Forest</button><button type="button" data-preset="sunset">Sunset</button></div>
                    <div class="color-controls"><label>Primary<input id="appearance-accent" type="color"></label><label>Secondary<input id="appearance-secondary" type="color"></label><label>Highlight<input id="appearance-highlight" type="color"></label></div>
                    <label for="appearance-photo">Profile photo</label><p id="photo-guidance" class="customizer-help">Recommended: 800 × 800 px, square, with your face centered. JPG, PNG or WebP, up to 10 MB. Photos are resized to fit within 800 × 800 px and displayed in a circle.</p><input id="appearance-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-guidance photo-status">
                    <p id="photo-status" class="customizer-help" role="status"></p>
                    <label for="appearance-position">Photo vertical position</label><input id="appearance-position" type="range" min="0" max="100" step="1">
                </div><div class="appearance-preview"><span class="customizer-eyebrow">LIVE PREVIEW</span><img data-profile-photo alt="Profile photo preview"><h3 class="gradient-text">Your next chapter.</h3><p>Your work. Your personality.<br>A portfolio that feels like you.</p><span class="btn-primary preview-button">View Work ↗</span><span class="preview-tag">Available for opportunities</span></div></div>
                <div class="customizer-actions"><button type="button" id="appearance-reset" class="btn-outline">Reset appearance</button><button type="button" id="appearance-cancel" class="btn-outline">Cancel</button><button type="submit" class="btn-primary">Save to GitHub</button></div>
            </fieldset>
        </form><p id="appearance-status" role="status" aria-live="polite"></p>`;
    document.body.appendChild(dialog);
    const find = id => dialog.querySelector('#' + id);
    const status = find('appearance-status');
    const fields = find('appearance-fields');
    const presets = { violet: ['#6366f1', '#ec4899', '#f59e0b'], ocean: ['#0369a1', '#0f766e', '#38bdf8'], forest: ['#15803d', '#0f766e', '#eab308'], sunset: ['#c2410c', '#be185d', '#fbbf24'] };
    function refresh() {
        for (const key of ['theme', 'accent', 'secondary', 'highlight']) find('appearance-' + key).value = draft[key];
        find('appearance-position').value = draft.photoPosition;
        appearance.apply(draft);
    }
    function close() { if (!busy) dialog.close(); }
    dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    dialog.addEventListener('close', () => { photoVersion++; appearance.apply(saved); document.body.classList.remove('customizer-open'); });
    find('customizer-close').onclick = close;
    find('appearance-cancel').onclick = close;
    document.getElementById('customize-portfolio').onclick = async () => {
        await appearance.ready;
        saved = { ...appearance.current };
        draft = { ...saved };
        busy = true;
        fields.disabled = true;
        status.textContent = 'Loading saved appearance from GitHub…';
        find('appearance-photo').value = '';
        find('photo-status').textContent = '';
        refresh();
        dialog.showModal();
        document.body.classList.add('customizer-open');
        try {
            if (previewOnly) { sha = undefined; draft = { ...saved }; refresh(); fields.disabled = false; status.textContent = 'Preview mode. Connect to GitHub to publish your appearance.'; return; }
            const response = await fetch(ghFileURL(path) + '?ref=' + encodeURIComponent(GH_BRANCH), { headers: ghHeaders() });
            if (response.status === 404) { sha = undefined; }
            else {
                if (!response.ok) throw new Error(`Couldn't load appearance (${response.status}). Close and try again.`);
                const file = await response.json();
                sha = file.sha;
                saved = appearance.normalize(JSON.parse(b64DecodeUnicode(file.content)));
            }
            draft = { ...saved };
            refresh();
            fields.disabled = false;
            status.textContent = 'Changes stay in preview until you save.';
        } catch (error) { status.textContent = error.message; }
        finally { busy = false; }
    };
    for (const key of ['theme', 'accent', 'secondary', 'highlight']) {
        find('appearance-' + key).addEventListener('input', event => { draft[key] = event.target.value; appearance.apply(draft); });
    }
    find('appearance-position').oninput = event => { draft.photoPosition = Number(event.target.value); appearance.apply(draft); };
    dialog.querySelectorAll('[data-preset]').forEach(button => button.onclick = () => {
        [draft.accent, draft.secondary, draft.highlight] = presets[button.dataset.preset]; refresh();
    });
    find('appearance-reset').onclick = () => { photoVersion++; draft = { ...appearance.defaults }; find('appearance-photo').value = ''; find('photo-status').textContent = ''; refresh(); };
    find('appearance-photo').onchange = async event => {
        const file = event.target.files[0];
        if (!file) return;
        const version = ++photoVersion;
        const photoStatus = find('photo-status');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
            photoStatus.textContent = 'Choose a JPG, PNG or WebP smaller than 10 MB.'; event.target.value = ''; return;
        }
        busy = true;
        fields.disabled = true;
        photoStatus.textContent = 'Preparing photo…';
        const url = URL.createObjectURL(file);
        try {
            const img = new Image(); img.src = url; await img.decode();
            const canvas = document.createElement('canvas');
            const scale = Math.min(1, 800 / Math.max(img.naturalWidth, img.naturalHeight));
            canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            if (version !== photoVersion) return;
            draft.photo = canvas.toDataURL('image/webp', 0.88);
            draft.photoPosition = 50;
            photoStatus.textContent = `${img.naturalWidth} × ${img.naturalHeight} px selected.${Math.min(img.naturalWidth, img.naturalHeight) < 800 ? ' A larger image will look sharper.' : ''}`;
            refresh();
        } catch { photoStatus.textContent = 'This image could not be opened. Please choose another photo.'; }
        finally { URL.revokeObjectURL(url); busy = false; fields.disabled = false; }
    };
    find('appearance-form').onsubmit = async event => {
        event.preventDefault();
        if (busy) return;
        busy = true; fields.disabled = true;
        status.textContent = 'Saving appearance…';
        try {
            const result = await ghPutFile(path, sha, appearance.normalize(draft), 'Update portfolio appearance via admin portal');
            sha = result.content.sha; saved = { ...draft };
            status.textContent = 'Saved! GitHub Pages will show your new appearance after deployment finishes.';
        } catch (error) { status.textContent = `Not saved: ${error.message}. Your preview is still here. If the file changed elsewhere, close and reopen before retrying.`; }
        finally { busy = false; fields.disabled = false; }
    };
})();
