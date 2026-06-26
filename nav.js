/* ============================================================
   nav.js — Shared Navigation, Shell & Theme Logic for UniHub
   ============================================================ */

(function () {
  'use strict';

  // --- STATE DEFAULTS ---
  const DEFAULT_PROFILE = {
    name: "Guest Student",
    email: "guest@unihub.edu",
    avatar: "G"
  };

  const DEFAULT_LOGS = [];

  // --- LOCAL STORAGE KEY LOADERS ---
  function getProfile() {
    try {
      const raw = localStorage.getItem('unihub_profile');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // Set default if not found
    localStorage.setItem('unihub_profile', JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }

  function saveProfile(prof) {
    localStorage.setItem('unihub_profile', JSON.stringify(prof));
    // Trigger event for dynamic page updates
    window.dispatchEvent(new Event('unihub_profile_change'));
  }

  function getActivityLogs() {
    try {
      const raw = localStorage.getItem('unihub_activity_logs');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    localStorage.setItem('unihub_activity_logs', JSON.stringify(DEFAULT_LOGS));
    return DEFAULT_LOGS;
  }

  function saveActivityLogs(logs) {
    localStorage.setItem('unihub_activity_logs', JSON.stringify(logs));
  }

  // --- TOAST MANAGER ---
  window.showToast = function (message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close-btn" aria-label="Close notification">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close-btn');
    const dismiss = () => {
      toast.classList.add('toast-removing');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    };

    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
  };

  // --- LOG ACTIVITY GLOBALLY ---
  window.addActivityLog = function (text, category) {
    const logs = getActivityLogs();
    const newLog = {
      id: "log_" + Date.now(),
      text: text,
      time: "Just now",
      category: category || "general"
    };
    logs.unshift(newLog);
    // Keep max 20 logs
    if (logs.length > 20) logs.pop();
    saveActivityLogs(logs);
    updateBellDropdown();
  };

  // --- UPDATE BELL NOTIFICATION UI ---
  function updateBellDropdown() {
    const badge = document.getElementById('bell-badge');
    const list = document.getElementById('notification-list');
    if (!list) return;

    const logs = getActivityLogs();
    if (logs.length === 0) {
      if (badge) badge.style.display = "none";
      list.innerHTML = `<div class="notification-empty">Activity logs cleared.</div>`;
      return;
    }

    if (badge) {
      badge.textContent = logs.length;
      badge.style.display = "block";
    }

    list.innerHTML = logs.map(function (log) {
      let icon = "✅";
      if (log.category === "streak") icon = "🌟";
      if (log.category === "timer") icon = "🍅";
      if (log.category === "gpa") icon = "📊";
      if (log.category === "resource") icon = "📚";

      return `
        <div class="notification-item">
          <span class="notification-icon">${icon}</span>
          <div class="notification-content">
            <p class="notification-text">${log.text}</p>
            <span class="notification-time">${log.time}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- INITIALIZE PROFILE DETAILS IN UI ---
  function populateProfileUI() {
    const prof = getProfile();
    
    // Update trigger elements
    const avatarBadge = document.querySelector('.profile-avatar');
    const nameLabel = document.querySelector('.profile-name');
    const menuName = document.querySelector('.profile-menu-header .full-name');
    const menuEmail = document.querySelector('.profile-menu-header .email');

    if (avatarBadge) avatarBadge.textContent = prof.avatar;
    if (nameLabel) nameLabel.textContent = prof.name.split(' ')[0]; // Show first name
    if (menuName) menuName.textContent = prof.name;
    if (menuEmail) menuEmail.textContent = prof.email;

    // Load Focus XP dynamically from localStorage and display
    const rawXp = localStorage.getItem('unihub_focus_points');
    const currentXp = rawXp ? parseInt(rawXp, 10) : 0;
    const xpEl = document.getElementById('nav-profile-xp');
    if (xpEl) xpEl.textContent = currentXp;
  }

  // --- INJECT PROFILE EDITOR MODAL DYNAMICALLY ---
  function injectProfileModal() {
    if (document.getElementById('profile-edit-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'profile-edit-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-container glass-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <div class="modal-title-icon">
              <i class="fas fa-user-edit"></i>
            </div>
            <h3>Edit User Profile</h3>
          </div>
          <button id="profile-modal-close" class="modal-close-btn" aria-label="Close profile editor">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form id="profile-edit-form" class="profile-edit-grid" onsubmit="event.preventDefault();">
          <div class="profile-edit-field">
            <label for="edit-profile-name">Full Name</label>
            <input type="text" id="edit-profile-name" required placeholder="Enter name">
          </div>
          <div class="profile-edit-field">
            <label for="edit-profile-email">Email Address</label>
            <input type="email" id="edit-profile-email" required placeholder="Enter email address">
          </div>
          <div class="profile-edit-field">
            <label>Choose Avatar Letter</label>
            <div class="avatar-selector" id="avatar-selector-row">
              <!-- Choices dynamically injected -->
            </div>
          </div>
          <button type="button" id="save-profile-btn" class="modal-action-btn">Save Profile Updates</button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    // Setup close callback
    const closeBtn = document.getElementById('profile-modal-close');
    closeBtn.addEventListener('click', closeProfileModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeProfileModal();
    });

    // Populate Save button callback
    const saveBtn = document.getElementById('save-profile-btn');
    saveBtn.addEventListener('click', handleSaveProfile);
  }

  function openProfileModal() {
    injectProfileModal();
    const isFirstTime = !localStorage.getItem('unihub_profile');
    const prof = getProfile();

    document.getElementById('edit-profile-name').value = isFirstTime ? '' : prof.name;
    document.getElementById('edit-profile-email').value = isFirstTime ? '' : prof.email;

    // Change title dynamically
    const titleEl = document.querySelector('.modal-title-group h3');
    if (titleEl) {
      titleEl.textContent = isFirstTime ? 'Set Up Your Profile' : 'Edit User Profile';
    }

    // Generate avatar choices based on initials of name
    const initialsRow = document.getElementById('avatar-selector-row');
    initialsRow.innerHTML = '';
    const letters = getInitialsChoices(isFirstTime ? '' : prof.name);
    
    letters.forEach(function (letter) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'avatar-select-btn' + (prof.avatar === letter ? ' active' : '');
      btn.textContent = letter;
      btn.addEventListener('click', function () {
        document.querySelectorAll('.avatar-select-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      initialsRow.appendChild(btn);
    });

    // Handle Name changes to refresh choices dynamically
    const nameInp = document.getElementById('edit-profile-name');
    nameInp.addEventListener('input', function() {
      const activeVal = document.querySelector('.avatar-select-btn.active')?.textContent || '';
      initialsRow.innerHTML = '';
      const newLetters = getInitialsChoices(nameInp.value);
      newLetters.forEach(function (letter) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'avatar-select-btn' + ((activeVal === letter || (activeVal === '' && letter === newLetters[0])) ? ' active' : '');
        btn.textContent = letter;
        btn.addEventListener('click', function () {
          document.querySelectorAll('.avatar-select-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
        initialsRow.appendChild(btn);
      });
    });

    document.getElementById('profile-edit-modal-overlay').classList.add('show');
    document.getElementById('profile-dropdown').classList.remove('show');
  }

  function getInitialsChoices(fullName) {
    const clean = fullName.trim().toUpperCase();
    if (!clean) return ['U'];
    const parts = clean.split(/\s+/);
    const letters = [];
    // Add first letter
    letters.push(parts[0].charAt(0));
    // Add second letter initials if multi-word
    if (parts.length > 1 && parts[parts.length - 1].charAt(0)) {
      letters.push(parts[parts.length - 1].charAt(0));
      letters.push(parts[0].charAt(0) + parts[parts.length - 1].charAt(0));
    }
    // Fallback constants
    if (!letters.includes('🎓')) letters.push('🎓');
    if (!letters.includes('⚡')) letters.push('⚡');
    return Array.from(new Set(letters)).slice(0, 5);
  }

  function closeProfileModal() {
    const modal = document.getElementById('profile-edit-modal-overlay');
    if (modal) modal.classList.remove('show');
  }

  function handleSaveProfile() {
    const name = document.getElementById('edit-profile-name').value.trim();
    const email = document.getElementById('edit-profile-email').value.trim();
    const avatar = document.querySelector('.avatar-select-btn.active')?.textContent || 'U';

    if (!name || !email) {
      window.showToast('Please fill out all fields.');
      return;
    }

    const updated = { name, email, avatar };
    saveProfile(updated);
    populateProfileUI();
    closeProfileModal();
    window.showToast('Profile updated successfully!');
    window.addActivityLog('User profile details updated.', 'general');
  }

  // --- AUDIO MUTE MANAGER ---
  function initVolumeControl() {
    const volBtn = document.getElementById('volume-toggle');
    if (!volBtn) return;

    let isMuted = false;
    try {
      isMuted = JSON.parse(localStorage.getItem('unihub_muted') || 'false');
    } catch (e) {}

    updateVolumeButtonUI(volBtn, isMuted);

    volBtn.addEventListener('click', function () {
      isMuted = !isMuted;
      localStorage.setItem('unihub_muted', JSON.stringify(isMuted));
      updateVolumeButtonUI(volBtn, isMuted);
      window.showToast(isMuted ? "Audio alerts muted." : "Audio alerts active!");
      // Dispatch event so active synths/players can mute immediately
      window.dispatchEvent(new CustomEvent('unihub_volume_change', { detail: { muted: isMuted } }));
    });
  }

  function updateVolumeButtonUI(btn, isMuted) {
    if (isMuted) {
      btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      btn.title = "Unmute alerts";
      btn.classList.add('active');
    } else {
      btn.innerHTML = '<i class="fas fa-volume-up"></i>';
      btn.title = "Mute alerts";
      btn.classList.remove('active');
    }
  }

  // --- THEME MANAGER ---
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
    
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'light'
        ? '<i class="fas fa-moon"></i>'
        : '<i class="fas fa-sun"></i>';
      themeBtn.title = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    }
  }

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('unihub_theme', next);
    applyTheme(next);
  };

  function initTheme() {
    const saved = localStorage.getItem('unihub_theme') || 'dark';
    applyTheme(saved);
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', window.toggleTheme);
    }
  }

  // --- ACTIVE NAVBAR HIGHLIGHTING ---
  function setActiveNav() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a[data-page]').forEach(function (link) {
      link.classList.toggle('active', link.dataset.page === page);
    });
  }

  // --- NAVBAR SCROLL DETECTOR ---
  function initScrolledClass() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- HAMBURGER DRAWER ---
  function initHamburger() {
    const btn = document.getElementById('nav-hamburger');
    const menu = document.getElementById('nav-links');
    if (!btn || !menu) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      btn.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    // Close when clicking outside
    document.addEventListener('click', function () {
      if (menu.classList.contains('open')) {
        menu.classList.remove('open');
        btn.innerHTML = '<i class="fas fa-bars"></i>';
      }
    });
    menu.addEventListener('click', function(e){ e.stopPropagation(); });
  }

  // --- LIVE CLOCK AND DATE ---
  function initClock() {
    const clockEl = document.getElementById('live-clock');
    const dateEl = document.getElementById('live-date');
    if (!clockEl) return;

    function tick() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hh}:${mm}:${ss}`;
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric'
        });
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  // --- SCROLL REVEAL OBSERVER ---
  function initReveal() {
    if (!window.IntersectionObserver) {
      // Fallback
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(function (el) {
      obs.observe(el);
    });
  }

  // --- HEADER DROPDOWNS HOOKS ---
  function initDropdownHooks() {
    const bellBtn = document.getElementById('bell-toggle');
    const bellMenu = document.getElementById('bell-dropdown');
    const profBtn = document.getElementById('profile-trigger');
    const profMenu = document.getElementById('profile-dropdown');

    if (bellBtn && bellMenu) {
      bellBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        bellMenu.classList.toggle('show');
        if (profMenu) profMenu.classList.remove('show');
      });
    }

    if (profBtn && profMenu) {
      profBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        profMenu.classList.toggle('show');
        if (bellMenu) bellMenu.classList.remove('show');
      });
    }

    // Edit profile trigger hook
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
      editBtn.addEventListener('click', openProfileModal);
    }

    // Reset data trigger hook
    const resetDataBtn = document.getElementById('reset-data-btn');
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', function () {
        // Purge focus, GPA, profile and timetable
        localStorage.removeItem('unihub_focus_data');
        localStorage.removeItem('unihub_focus_streak');
        localStorage.removeItem('unihub_focus_points');
        localStorage.removeItem('unihub_last_xp_claim');
        localStorage.removeItem('semesterResults');
        localStorage.removeItem('unihub_resources');
        localStorage.removeItem('unihub_sessionNote');
        localStorage.removeItem('unihub_student_type');
        localStorage.removeItem('unihub_custom_curriculum');
        localStorage.removeItem('unihub_profile');
        localStorage.removeItem('unihub_timetable_v1');
        
        // Reset logs
        localStorage.setItem('unihub_activity_logs', JSON.stringify(DEFAULT_LOGS));
        
        // Clean music db
        try {
          indexedDB.deleteDatabase('UniHubMusicDB');
        } catch(e) {}

        window.showToast("Focus and GPA records reset!");
        window.addActivityLog('Application focus and GPA logs reset.', 'general');
        if (profMenu) profMenu.classList.remove('show');
        
        // Refresh page to load initial mock details
        setTimeout(() => window.location.reload(), 1200);
      });
    }

    // Notification clear hook
    const clearLogsBtn = document.getElementById('clear-notifications');
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        saveActivityLogs([]);
        updateBellDropdown();
        window.showToast("Activity logs cleared.");
      });
    }

    document.addEventListener('click', function () {
      if (bellMenu) bellMenu.classList.remove('show');
      if (profMenu) profMenu.classList.remove('show');
    });

    if (bellMenu) bellMenu.addEventListener('click', e => e.stopPropagation());
    if (profMenu) profMenu.addEventListener('click', e => e.stopPropagation());
  }

  // --- SITE PURGE / FULL FACTORY RESET ---
  window.confirmResetSiteData = function (event) {
    if (event) event.preventDefault();
    const ok = confirm('⚠️ WARNING: Are you sure you want to reset UniHub to its original factory state?\n\nThis will permanently delete all your:\n- Tasks and task list records\n- Saved GPA semester records\n- Uploaded focus music files\n- Bookmarked study resources\n- Focus timer history and stats\n- Custom user profile details\n- Theme preferences\n\nThis action cannot be undone.');
    if (ok) {
      localStorage.clear();
      try {
        const req = indexedDB.deleteDatabase('UniHubMusicDB');
        req.onsuccess = function () {
          alert('UniHub has been successfully reset to its original state.');
          window.location.reload();
        };
        req.onerror = function () {
          window.location.reload();
        };
        setTimeout(function () { window.location.reload(); }, 1000);
      } catch (e) {
        window.location.reload();
      }
    }
  };

  // --- CUSTOM CURSOR & RIPPLE SPARKLE ---
  function initCustomCursor() {
    if (window.matchMedia('(pointer: fine)').matches) {
      const follower = document.createElement('div');
      follower.id = 'cursorFollower';
      follower.className = 'cursor-follower';

      const dot = document.createElement('div');
      dot.id = 'cursorDot';
      dot.className = 'cursor-dot';

      document.body.appendChild(follower);
      document.body.appendChild(dot);

      let mouseX = -100;
      let mouseY = -100;
      let followerX = -100;
      let followerY = -100;

      document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
      });

      function renderCursor() {
        const ease = 0.16;
        followerX += (mouseX - followerX) * ease;
        followerY += (mouseY - followerY) * ease;

        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';

        requestAnimationFrame(renderCursor);
      }
      requestAnimationFrame(renderCursor);

      const clickablesSelector = 'a, button, input, select, textarea, .profile-trigger, .chk, .tedit, .tdel, .quick-link, .day-select-control, .theme-toggle';

      document.addEventListener('mouseover', function (e) {
        if (e.target.closest(clickablesSelector)) {
          follower.classList.add('hovered');
          dot.classList.add('hovered');
        }
      });

      document.addEventListener('mouseout', function (e) {
        if (e.target.closest(clickablesSelector)) {
          follower.classList.remove('hovered');
          dot.classList.remove('hovered');
        }
      });

      document.addEventListener('mousedown', function () {
        follower.style.transform = 'translate(-50%, -50%) scale(0.8)';
        dot.style.transform = 'translate(-50%, -50%) scale(0.6)';
      });
      document.addEventListener('mouseup', function () {
        follower.style.transform = 'translate(-50%, -50%) scale(1)';
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
      });
    }
  }

  function initClickSparkle() {
    document.addEventListener('mousedown', function (event) {
      const spark = document.createElement('div');
      spark.className = 'click-spark-body';
      spark.style.left = event.clientX + 'px';
      spark.style.top = event.clientY + 'px';

      document.body.appendChild(spark);

      spark.addEventListener('animationend', function () {
        spark.remove();
      });
      setTimeout(function () {
        spark.remove();
      }, 500);
    });
  }

  // --- BOOT PROCESS ---
  document.addEventListener('DOMContentLoaded', function () {
    const hasProfile = localStorage.getItem('unihub_profile');

    initTheme();
    populateProfileUI();
    updateBellDropdown();
    setActiveNav();
    initScrolledClass();
    initHamburger();
    initClock();
    initReveal();
    initVolumeControl();
    initDropdownHooks();
    initCustomCursor();
    initClickSparkle();

    if (!hasProfile) {
      setTimeout(openProfileModal, 600);
    }
  });
}());
