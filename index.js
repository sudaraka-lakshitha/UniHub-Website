/* ============================================================
   index.js — Dynamic landing page stats loader
   ============================================================ */

(function () {
  'use strict';

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loadHomeStats() {
    let focusData = {};
    let streakVal = 0;
    
    // --- 1. Focus Stats ---
    try {
      const rawFocus = localStorage.getItem('unihub_focus_data');
      if (rawFocus) {
        focusData = JSON.parse(rawFocus);
      }
    } catch (e) {}

    // Streak check (look for hub key first, fallback to focus data)
    try {
      const rawStreak = localStorage.getItem('unihub_focus_streak');
      if (rawStreak) {
        streakVal = parseInt(rawStreak, 10);
      } else {
        streakVal = Math.floor((focusData.totalSessions || 0) / 3);
      }
    } catch (e) {}

    const totalSessions = focusData.totalSessions || 0;
    const tasks = focusData.tasks || [];

    // Set KPI badges in text
    const sessEl = document.getElementById('hero-stat-sessions');
    const tasksEl = document.getElementById('hero-stat-tasks');
    const fSessEl = document.getElementById('fc-sessions');
    const fStreakEl = document.getElementById('fc-streak');

    if (sessEl) sessEl.textContent = totalSessions;
    if (tasksEl) tasksEl.textContent = tasks.length;
    if (fSessEl) fSessEl.textContent = totalSessions;
    if (fStreakEl) fStreakEl.textContent = streakVal;

    // --- 2. GPA Stats ---
    let savedSemesters = [];
    try {
      const rawGpa = localStorage.getItem('semesterResults');
      if (rawGpa) {
        savedSemesters = JSON.parse(rawGpa);
      }
    } catch (e) {}

    const semCountEl = document.getElementById('hero-stat-saved-semesters');
    if (semCountEl) {
      semCountEl.textContent = savedSemesters.length;
    }
    // Update main text badge too
    const semStatEl = document.getElementById('hero-stat-gpa');
    if (semStatEl) {
      semStatEl.textContent = savedSemesters.length;
    }

    const gpaValueEl = document.getElementById('hero-gpa');
    const gpaTrendEl = document.getElementById('gpa-trend');

    if (savedSemesters.length > 0) {
      let totalCredits = 0;
      let totalPoints = 0;
      savedSemesters.forEach(function (r) {
        totalCredits += r.credits;
        totalPoints += r.points;
      });
      const overallGpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
      if (gpaValueEl) gpaValueEl.textContent = overallGpa;
      if (gpaTrendEl) gpaTrendEl.textContent = `▲ ${savedSemesters.length} semester(s) saved`;
    } else {
      if (gpaValueEl) gpaValueEl.textContent = '—';
      if (gpaTrendEl) gpaTrendEl.textContent = '▲ No semesters saved';
    }

    // --- 3. Dynamic Progress Bars (Category breakdown) ---
    const progressListEl = document.getElementById('hero-progress-list');
    if (progressListEl) {
      if (tasks && tasks.length > 0) {
        const groups = {};
        tasks.forEach(function (t) {
          const tag = t.tag || 'gen';
          if (!groups[tag]) {
            groups[tag] = { total: 0, done: 0 };
          }
          groups[tag].total++;
          if (t.done || t.completed) {
            groups[tag].done++;
          }
        });

        const tagLabels = { math: 'Mathematics', sci: 'Science', eng: 'English', gen: 'General' };
        const arr = [];
        for (const tag in groups) {
          const label = tagLabels[tag] || (tag.charAt(0).toUpperCase() + tag.slice(1));
          const pct = Math.round((groups[tag].done / groups[tag].total) * 100);
          arr.push({ label: label, pct: pct });
        }

        // Sort by completion percent descending
        arr.sort((a, b) => b.pct - a.pct);

        // Render top 3 categories
        let htmlContent = '';
        const fillClasses = ['pf2', 'pf1', 'pf3'];
        arr.slice(0, 3).forEach(function (item, idx) {
          const fillClass = fillClasses[idx] || 'pf1';
          htmlContent += `
            <div class="prog-item">
              <div class="prog-label">
                <span>${escapeHtml(item.label)}</span>
                <span>${item.pct}%</span>
              </div>
              <div class="prog-track">
                <div class="prog-fill ${fillClass}" style="width: 0%" data-w="${item.pct}%"></div>
              </div>
            </div>
          `;
        });
        progressListEl.innerHTML = htmlContent;
      } else {
        // Fallback placeholder when no tasks
        progressListEl.innerHTML = `
          <div style="font-size:0.78rem; color:var(--text-secondary); text-align:center; padding:1.2rem 0; line-height:1.5;">
            <i class="fas fa-tasks" style="font-size:1.4rem; opacity:0.3; display:block; margin-bottom:8px; color:var(--accent-blue);"></i>
            No active objectives.<br>
            <a href="focus.html" style="color:var(--accent-blue); text-decoration:underline; font-weight:700;">Set tasks in Focus Mode</a>
          </div>
        `;
      }
    }

    // --- 4. Animate Progress Bars ---
    setTimeout(function () {
      document.querySelectorAll('.prog-fill[data-w]').forEach(function (bar) {
        bar.style.width = bar.getAttribute('data-w');
      });
    }, 250);
  }

  // Reload statistics if profile triggers changes or data resets
  window.addEventListener('unihub_profile_change', loadHomeStats);

  document.addEventListener('DOMContentLoaded', loadHomeStats);
}());
