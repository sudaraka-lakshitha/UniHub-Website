/* ============================================================
   dashboard.js — Progress Dashboard Logic for UniHub
   ============================================================ */

(function () {
  'use strict';

  const CIRCUMFERENCE = 2 * Math.PI * 50; // ~314.16

  function getGpaColorClass(gpa) {
    if (gpa >= 3.7) return 'gpa-val-ex';
    if (gpa >= 3.0) return 'gpa-val-good';
    if (gpa >= 2.0) return 'gpa-val-avg';
    return 'gpa-val-weak';
  }

  function getGpaColorHex(gpa) {
    // Return HSL mapped colors or matching Hex codes
    if (gpa >= 3.7) return '#10b981'; // Emerald
    if (gpa >= 3.0) return '#3b82f6'; // Blue
    if (gpa >= 2.0) return '#f97316'; // Orange
    return '#f43f5e'; // Rose
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.loadDashboard = function () {
    // --- 1. Load Local State ---
    let focusData = {};
    let streakVal = 0;
    
    try {
      const rawFocus = localStorage.getItem('unihub_focus_data');
      if (rawFocus) focusData = JSON.parse(rawFocus);
    } catch (e) {}

    try {
      const rawStreak = localStorage.getItem('unihub_focus_streak');
      if (rawStreak) {
        streakVal = parseInt(rawStreak, 10);
      } else {
        streakVal = Math.floor((focusData.totalSessions || 0) / 3);
      }
    } catch (e) {}

    const totalSessions = focusData.totalSessions || 0;
    const focMin = focusData.focMin || 0;
    const tasks = focusData.tasks || [];
    const completedTasks = tasks.filter(t => t.done || t.completed).length;

    let savedSemesters = [];
    try {
      const rawGpa = localStorage.getItem('semesterResults');
      if (rawGpa) savedSemesters = JSON.parse(rawGpa);
    } catch (e) {}

    // --- 2. Update KPI Stats ---
    document.getElementById('kpi-sessions').textContent = totalSessions;
    document.getElementById('kpi-mins').textContent = focMin;
    document.getElementById('kpi-tasks').textContent = tasks.length;
    document.getElementById('kpi-done').textContent = completedTasks;
    document.getElementById('kpi-semesters').textContent = savedSemesters.length;
    document.getElementById('kpi-streak').textContent = streakVal;

    // --- 3. GPA Ring & Semester History ---
    const gpaListEl = document.getElementById('gpa-list');
    const overallGpaDisp = document.getElementById('overall-gpa');
    const meterFill = document.getElementById('meterFill');

    if (savedSemesters.length === 0) {
      if (overallGpaDisp) overallGpaDisp.textContent = '—';
      if (meterFill) {
        meterFill.style.strokeDashoffset = CIRCUMFERENCE;
        meterFill.style.stroke = 'var(--border-color)';
      }
      if (gpaListEl) {
        gpaListEl.innerHTML = `
          <div class="no-data">
            <i class="fas fa-calculator"></i>
            No GPA records saved yet.<br>
            <a href="gpa.html" style="color:var(--accent-blue); text-decoration:underline; font-weight:700;">Calculate and save GPA</a>
          </div>
        `;
      }
    } else {
      let totalCredits = 0;
      let totalPoints = 0;
      gpaListEl.innerHTML = '';

      savedSemesters.forEach(function (sem) {
        const semGpa = sem.points / sem.credits;
        totalCredits += sem.credits;
        totalPoints += sem.points;

        const row = document.createElement('div');
        row.className = 'gpa-item';
        row.innerHTML = `
          <div class="gpa-item-label">
            <strong>${escapeHtml(sem.level)} · ${escapeHtml(sem.semester)}</strong>
            <div style="font-size:0.72rem; color:var(--text-muted); font-weight:500; margin-top:2px;">
              ${sem.credits} credits graded
            </div>
          </div>
          <div class="gpa-item-val ${getGpaColorClass(semGpa)}">
            ${semGpa.toFixed(2)}
          </div>
        `;
        gpaListEl.appendChild(row);
      });

      const cumulativeGpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
      if (overallGpaDisp) overallGpaDisp.textContent = cumulativeGpa.toFixed(2);

      if (meterFill) {
        const ratio = Math.min(cumulativeGpa / 4.0, 1);
        const offset = CIRCUMFERENCE - (CIRCUMFERENCE * ratio);
        meterFill.style.strokeDasharray = CIRCUMFERENCE;
        meterFill.style.strokeDashoffset = offset.toFixed(2);
        meterFill.style.stroke = getGpaColorHex(cumulativeGpa);
      }
    }

    // --- 4. Task Breakdown Chart ---
    const breakdownEl = document.getElementById('task-breakdown');
    if (tasks.length === 0) {
      if (breakdownEl) {
        breakdownEl.innerHTML = `
          <div class="no-data">
            <i class="fas fa-tasks"></i>
            No tasks found.<br>
            <a href="focus.html" style="color:var(--accent-blue); text-decoration:underline; font-weight:700;">Add items in Focus Mode</a>
          </div>
        `;
      }
    } else {
      if (breakdownEl) {
        // Group tasks by category
        const counts = {};
        tasks.forEach(function (t) {
          const tag = t.tag || 'gen';
          counts[tag] = (counts[tag] || 0) + 1;
        });

        const maxCount = Math.max.apply(null, Object.values(counts));
        const tagLabels = { math: 'Maths', sci: 'Science', eng: 'English', gen: 'General' };
        const fillClasses = { math: 'tb-math', sci: 'tb-sci', eng: 'tb-eng', gen: 'tb-gen' };

        breakdownEl.innerHTML = '';
        Object.entries(counts).forEach(function ([tag, count]) {
          const label = tagLabels[tag] || (tag.charAt(0).toUpperCase() + tag.slice(1));
          const fillClass = fillClasses[tag] || 'tb-custom';
          const fillPct = Math.round((count / maxCount) * 100);

          const row = document.createElement('div');
          row.className = 'tag-row';
          row.innerHTML = `
            <div class="tag-name">${escapeHtml(label)}</div>
            <div class="tag-bar-track">
              <div class="tag-bar-fill ${fillClass}" style="width: 0%" data-w="${fillPct}%"></div>
            </div>
            <div class="tag-count">${count}</div>
          `;
          breakdownEl.appendChild(row);
        });

        // Trigger bars animation
        setTimeout(function () {
          document.querySelectorAll('.tag-bar-fill[data-w]').forEach(function (bar) {
            bar.style.width = bar.getAttribute('data-w');
          });
        }, 150);
      }
    }

    // --- 5. Focus Summary Timeline ---
    const timelineEl = document.getElementById('focus-timeline');
    if (totalSessions === 0) {
      if (timelineEl) {
        timelineEl.innerHTML = `
          <div class="no-data">
            <i class="fas fa-clock"></i>
            No logged timer history.<br>
            <a href="focus.html" style="color:var(--accent-blue); text-decoration:underline; font-weight:700;">Initiate focus cycles</a>
          </div>
        `;
      }
    } else {
      if (timelineEl) {
        timelineEl.innerHTML = '';
        const rows = [
          { icon: "fa-clock", title: "Total focus sessions logged", value: `${totalSessions} session(s)` },
          { icon: "fa-hourglass-half", title: "Time spent working in timer mode", value: `${focMin} min (~ ${(focMin / 60).toFixed(1)} hrs)` },
          { icon: "fa-fire", title: "Academic streak compounding", value: `${streakVal} day streak` },
          { icon: "fa-check-double", title: "Active checklist completions", value: `${completedTasks} / ${tasks.length} resolved` }
        ];

        rows.forEach(function (item) {
          const div = document.createElement('div');
          div.className = 'tl-row';
          div.innerHTML = `
            <div class="tl-dot"></div>
            <i class="fas ${item.icon}" style="color:var(--text-muted); font-size:0.85rem; width:16px;"></i>
            <span class="tl-text">${item.title}</span>
            <span class="tl-val">${item.value}</span>
          `;
          timelineEl.appendChild(div);
        });
      }
    }

    // --- 6. Last Note Preview ---
    const notePreviewEl = document.getElementById('session-note-preview');
    if (notePreviewEl) {
      const noteStr = localStorage.getItem('unihub_sessionNote') || '';
      if (noteStr.trim()) {
        const sliced = noteStr.length > 250 ? noteStr.substring(0, 250) + '...' : noteStr;
        notePreviewEl.innerHTML = `
          <p style="font-size:0.82rem; color:var(--text-primary); line-height:1.75; white-space:pre-wrap; font-weight:500;">
            ${escapeHtml(sliced)}
          </p>
        `;
      } else {
        notePreviewEl.innerHTML = `
          <div class="no-data" style="padding:1rem 0;">
            <i class="fas fa-sticky-note" style="font-size:1.8rem; margin-bottom:8px;"></i>
            No note summaries found.<br>
            Write comments inside the Focus Note area.
          </div>
        `;
      }
    }

    // --- 7. Timetable System ---
    loadTimetable();
    renderTimetableTable();
    renderTimetableEditor();
  };

  // Timetable State & Constants
  const HOURS = [
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM'
  ];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  let timetable = {};

  function loadTimetable() {
    try {
      const raw = localStorage.getItem('unihub_timetable_v1');
      timetable = raw ? JSON.parse(raw) : {};
    } catch (e) {
      timetable = {};
    }
  }

  function saveTimetable() {
    try {
      localStorage.setItem('unihub_timetable_v1', JSON.stringify(timetable));
    } catch (e) {}
  }

  function renderTimetableTable() {
    const tbody = document.getElementById('timetableBody');
    if (!tbody) return;

    tbody.innerHTML = HOURS.map(function (h) {
      return `
        <tr>
          <td class="timetable-time"><strong>${h}</strong></td>
          ${DAYS.map(function (d) {
            const v = (timetable[d + '_' + h] || '').trim();
            return `<td class="${v ? 'timetable-slot-active' : 'timetable-slot-empty'}">${v ? escapeHtml(v) : '—'}</td>`;
          }).join('')}
        </tr>
      `;
    }).join('');
  }

  function renderTimetableEditor() {
    const editor = document.getElementById('timetableEditor');
    const daySelector = document.getElementById('daySelector');
    if (!editor || !daySelector) return;

    const day = daySelector.value || 'Monday';
    editor.innerHTML = HOURS.map(function (h) {
      const val = timetable[day + '_' + h] || '';
      return `
        <div class="timetable-edit-row">
          <label class="timetable-edit-label"><strong>${h}</strong></label>
          <input type="text" class="timetable-edit-input" data-time-slot="${h}" value="${escapeHtml(val)}" placeholder="Add lecture or study task...">
        </div>
      `;
    }).join('');
  }

  // Reload if profile updates
  window.addEventListener('unihub_profile_change', window.loadDashboard);

  document.addEventListener('DOMContentLoaded', function () {
    window.loadDashboard();
    
    // Initial gauge reset for drawing animation
    const fill = document.getElementById('meterFill');
    if (fill) {
      fill.style.strokeDasharray = CIRCUMFERENCE;
      fill.style.strokeDashoffset = CIRCUMFERENCE;
    }

    // Set up timetable selector and change listeners
    const daySelector = document.getElementById('daySelector');
    if (daySelector) {
      daySelector.addEventListener('change', renderTimetableEditor);
    }

    const timetableEditor = document.getElementById('timetableEditor');
    if (timetableEditor) {
      timetableEditor.addEventListener('input', function (e) {
        if (!e.target.dataset.timeSlot) return;
        const day = daySelector.value || 'Monday';
        timetable[day + '_' + e.target.dataset.timeSlot] = e.target.value;
        saveTimetable();
        renderTimetableTable();
      });
    }
  });
}());
