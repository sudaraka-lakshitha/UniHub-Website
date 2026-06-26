/* ============================================================
   resources.js — Study Resources Bookmark Manager
   ============================================================ */

(function () {
  'use strict';

  const TYPE_ICONS = { link: 'fa-link', note: 'fa-sticky-note', video: 'fa-play-circle', doc: 'fa-file-alt', other: 'fa-box' };
  const TYPE_LABELS = { link: 'Link', note: 'Note', video: 'Video', doc: 'Document', other: 'Other' };
  const TYPE_CLASSES = { link: 'rt-link', note: 'rt-note', video: 'rt-video', doc: 'rt-doc', other: 'rt-other' };

  let resources = [];
  let activeFilter = 'all';

  // --- LOCAL STORAGE DATA SYNC ---
  function loadResources() {
    try {
      const raw = localStorage.getItem('unihub_resources');
      if (raw) {
        resources = JSON.parse(raw);
        return;
      }
    } catch (e) {}

    // Populate with premium educational resources if empty
    const starters = [
      { id: 1, title: 'Khan Academy', type: 'link', url: 'https://www.khanacademy.org', cat: 'General', desc: 'Free courses on Maths, Science, Computing and more.', date: 'Starter' },
      { id: 2, title: 'Wolfram Alpha', type: 'link', url: 'https://www.wolframalpha.com', cat: 'Maths', desc: 'Powerful computational engine — great for checking equations.', date: 'Starter' },
      { id: 3, title: 'MIT OpenCourseWare', type: 'link', url: 'https://ocw.mit.edu', cat: 'Engineering', desc: 'Free lecture notes, assignments, and exams from MIT courses.', date: 'Starter' },
      { id: 4, title: 'Pomodoro Technique Guide', type: 'note', url: '', cat: 'Study Skills', desc: 'Work for 25 min, break for 5 min. After 4 sessions take a longer 15-min break. Repeat.', date: 'Starter' }
    ];
    resources = starters;
    saveResources();
  }

  function saveResources() {
    localStorage.setItem('unihub_resources', JSON.stringify(resources));
  }

  function showMessage(msg, ok) {
    const notif = document.getElementById('res-notif');
    if (!notif) return;
    notif.textContent = msg;
    notif.className = 'res-notif show ' + (ok ? 'ok' : 'bad');
    setTimeout(function () {
      notif.className = 'res-notif';
    }, 3500);
  }

  // --- ADD BOOKMARK ---
  window.addResource = function () {
    const titleVal = document.getElementById('res-title').value.trim();
    if (!titleVal) {
      showMessage('Please enter a course title.', false);
      return;
    }

    const typeVal = document.getElementById('res-type').value;
    const urlVal = document.getElementById('res-url').value.trim();
    const catVal = document.getElementById('res-cat').value.trim() || 'General';
    const descVal = document.getElementById('res-desc').value.trim();

    // Soft url checks
    if (urlVal && !/^https?:\/\//i.test(urlVal)) {
      showMessage('Invalid URL. Ensure it starts with http:// or https://', false);
      return;
    }

    const newRes = {
      id: Date.now(),
      title: titleVal,
      type: typeVal,
      url: urlVal,
      cat: catVal,
      desc: descVal,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    resources.unshift(newRes);
    saveResources();
    renderResources();
    showMessage('✅ Resource saved successfully!', true);
    window.addActivityLog(`Resource '${titleVal}' bookmarked.`, 'resource');

    // Clean inputs
    document.getElementById('res-title').value = '';
    document.getElementById('res-type').value = 'link';
    document.getElementById('res-url').value = '';
    document.getElementById('res-cat').value = '';
    document.getElementById('res-desc').value = '';
  };

  // --- REMOVE BOOKMARK ---
  window.deleteResource = function (id) {
    const removed = resources.find(r => r.id === id);
    resources = resources.filter(r => r.id !== id);
    saveResources();
    renderResources();
    showMessage('🗑️ Resource removed.', true);
    if (removed) {
      window.addActivityLog(`Resource '${removed.title}' removed.`, 'resource');
    }
  };

  // --- FILTER BOOKMARKS ---
  window.setFilter = function (filter, buttonEl) {
    activeFilter = filter;
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    if (buttonEl) buttonEl.classList.add('active');
    renderResources();
  };

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // --- RENDER CARDS GRID ---
  window.renderResources = function () {
    const grid = document.getElementById('res-grid');
    const searchVal = (document.getElementById('search-inp').value || '').toLowerCase().trim();
    const statsRow = document.getElementById('res-stats-row');

    if (!grid) return;

    // Filter resources list matching query and category pill
    const filtered = resources.filter(function (r) {
      if (activeFilter !== 'all' && r.type !== activeFilter) return false;
      if (searchVal) {
        const queryTarget = `${r.title} ${r.cat} ${r.desc}`.toLowerCase();
        return queryTarget.includes(searchVal);
      }
      return true;
    });

    // Update Statistics badges
    if (statsRow) {
      statsRow.style.display = resources.length > 0 ? 'flex' : 'none';
      document.getElementById('stat-total').textContent = resources.length;
      document.getElementById('stat-links').textContent = resources.filter(r => r.type === 'link').length;
      document.getElementById('stat-notes').textContent = resources.filter(r => r.type === 'note').length;
      document.getElementById('stat-other-cnt').textContent = resources.filter(r => ['video', 'doc', 'other'].includes(r.type)).length;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-res">
          <i class="fas fa-search"></i>
          <p>${(searchVal || activeFilter !== 'all') ? 'No resources match your search filter.' : 'No study resources saved yet.'}</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(function (r) {
      const icon = TYPE_ICONS[r.type] || 'fa-box';
      const fillClass = TYPE_CLASSES[r.type] || 'rt-other';
      const label = TYPE_LABELS[r.type] || 'Other';

      let linkHtml = '';
      if (r.url) {
        // Strip out protocol prefixes for display
        const displayUrl = r.url.replace(/^https?:\/\//i, '').substring(0, 45);
        linkHtml = `
          <a class="res-url" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-external-link-alt"></i> ${escapeHtml(displayUrl)}${r.url.length > 45 ? '...' : ''}
          </a>
        `;
      }

      return `
        <div class="res-card">
          <div class="res-card-top">
            <div class="res-type-icon ${fillClass}">
              <i class="fas ${icon}"></i>
            </div>
            <div class="res-meta">
              <div class="res-title">${escapeHtml(r.title)}</div>
              <div class="res-cat">${r.cat ? `${escapeHtml(r.cat)} · ` : ''}${label}</div>
            </div>
          </div>
          ${r.desc ? `<p class="res-desc">${escapeHtml(r.desc)}</p>` : ''}
          ${linkHtml}
          <div class="res-card-actions">
            <button class="btn-del-res" onclick="deleteResource(${r.id})">
              <i class="fas fa-trash-alt"></i> Remove
            </button>
            <span class="res-date">${r.date || ''}</span>
          </div>
        </div>
      `;
    }).join('');
  };

  // Dynamic updates hooks
  window.addEventListener('unihub_profile_change', window.renderResources);

  // --- INITIALIZE ---
  document.addEventListener('DOMContentLoaded', function () {
    loadResources();
    renderResources();
  });
}());
