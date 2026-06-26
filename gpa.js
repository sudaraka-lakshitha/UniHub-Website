/* ============================================================
   gpa.js — GPA Calculator Logic with curriculum datasets
   ============================================================ */

(function () {
  'use strict';

  // --- OFFICIAL UNIVERSITY CURRICULUM SUBJECT DATA ---
  const CURRICULUM = {
    "Level I": {
      "Semester 1": [
        { code:"EN 1101", name:"Integrated English Language Skills for Technology (I)", credit:"NG" },
        { code:"FT 1101", name:"Workshop Practice", credit:1 },
        { code:"FT 1201", name:"Basic Mathematics", credit:2 },
        { code:"FT 1202", name:"Biology", credit:2 },
        { code:"FT 1203", name:"Chemistry", credit:2 },
        { code:"FT 1301", name:"Physics", credit:3 },
        { code:"IA 1201", name:"Pre-Calculus and Coordinate Geometry", credit:2 },
        { code:"IA 1202", name:"Electricity and Magnetism", credit:2 },
        { code:"IA 1203", name:"Communication Skills for Engineering Technologists", credit:2 }
      ],
      "Semester 2": [
        { code:"EN 1102", name:"Integrated English Language Skills for Technology (II)", credit:"NG" },
        { code:"FT 1102", name:"Technology and Historical Transformation", credit:1 },
        { code:"FT 1204", name:"Computer Applications", credit:2 },
        { code:"IA 1204", name:"Vectors and Matrices", credit:2 },
        { code:"IA 1205", name:"Introduction to Calculus", credit:2 },
        { code:"IA 1206", name:"Introduction to Computer Programming", credit:2 },
        { code:"IA 1207", name:"Computer Architecture I", credit:2 },
        { code:"IA 1208", name:"Engineering Mechanics", credit:2 },
        { code:"IA 1209", name:"Design Project", credit:"NG" },
        { code:"IA 1301", name:"Analog and Digital Electronics I", credit:3 }
      ]
    },
    "Level II": {
      "Semester 1": [
        { code:"EN 2101", name:"Primary English Communication Skills for Technology (I)", credit:"NG" },
        { code:"FT 2201", name:"Management of Technology", credit:2 },
        { code:"IA 2101", name:"Technical Drawing and CAD", credit:1 },
        { code:"IA 2102", name:"Introduction to Engineering Materials Technology", credit:1 },
        { code:"IA 2201", name:"Ordinary Differential Equations", credit:2 },
        { code:"IA 2202", name:"Probability and Statistics", credit:2 },
        { code:"IA 2203", name:"Computer Architecture II", credit:2 },
        { code:"IA 2204", name:"Industrial Management and Marketing", credit:2 },
        { code:"IA 2301", name:"Analog and Digital Electronics II", credit:3 }
      ],
      "Semester 2": [
        { code:"EN 2102", name:"English Communication Skills for Technology (II)", credit:"NG" },
        { code:"IA 2103", name:"Workshop Practice - Welding Techniques", credit:1 },
        { code:"IA 2104", name:"Internet Programming", credit:1 },
        { code:"IA 2205", name:"Statistical Data Analysis", credit:2 },
        { code:"IA 2206", name:"Electromagnetic Fields", credit:2 },
        { code:"IA 2207", name:"Waves and Vibrations & AC Theory", credit:2 },
        { code:"IA 2208", name:"Electronic Circuit Simulations and Analysis", credit:2 },
        { code:"IA 2209", name:"Microcontroller Laboratory", credit:2 },
        { code:"IA 2210", name:"Rapid Application Development", credit:2 },
        { code:"IA 2211", name:"Mobile Application Development", credit:2 }
      ]
    },
    "Level III": {
      "Semester 1": [
        { code:"EN 3101", name:"Advanced Communication Skills in English for Technology (I)", credit:"NG" },
        { code:"IA 3101", name:"Introduction to Field Programmable Gate Arrays", credit:1 },
        { code:"IA 3201", name:"Applied Numerical Methods", credit:2 },
        { code:"IA 3202", name:"Sensors and Transducers", credit:2 },
        { code:"IA 3203", name:"Digital Signal Processing", credit:2 },
        { code:"IA 3204", name:"Data Acquisition Systems", credit:2 },
        { code:"IA 3205", name:"Introduction to Robotics", credit:2 },
        { code:"IA 3206", name:"Non-conventional Energy Sources & their Applications", credit:2 },
        { code:"IA 3207", name:"Data Communication and Networking", credit:2 },
        { code:"IA 3208", name:"Computer Programming (Mini Project)", credit:2 }
      ],
      "Semester 2": [
        { code:"FT 3101", name:"Development Economics", credit:1 },
        { code:"FT 3201", name:"Environmental Law", credit:2 },
        { code:"FT 3202", name:"Occupational Health and Safety", credit:2 },
        { code:"FT 3203", name:"Sociology and Values for a Technological Society", credit:2 },
        { code:"IA 3601", name:"Industrial Training", credit:6 }
      ]
    },
    "Level IV": {
      "Semester 1": [
        { code:"EN 4101", name:"Academic Writing Skills for Technology", credit:"NG" },
        { code:"FT 4101", name:"Intellectual Property Rights", credit:1 },
        { code:"FT 4201", name:"Innovation and Entrepreneurship", credit:2 },
        { code:"IA 4201", name:"Power Electronics", credit:2 },
        { code:"IA 4202", name:"Induction Motor Drives and Programmable Logic Controllers", credit:2 },
        { code:"IA 4203", name:"Industrial Automation and Control", credit:2 },
        { code:"IA 4204", name:"Instrumentation Laboratory", credit:2 },
        { code:"IA 4205", name:"Engineering Economics and Financial Accounting", credit:2 },
        { code:"IA 4301", name:"Precision Measurement Techniques and Calibration of Instruments", credit:3 }
      ],
      "Semester 2": [
        { code:"EN 4102", name:"Advanced Communication Skills in English for Technology (II)", credit:"NG" },
        { code:"IA 4206", name:"Shielding and Protection of Electronic Instruments", credit:2 },
        { code:"IA 4207", name:"Special Instrumentation Techniques", credit:2 },
        { code:"IA 4208", name:"Fibre Optics and Laser Instrumentation", credit:2 },
        { code:"IA 4209", name:"Nuclear and Medical Instrumentation", credit:2 },
        { code:"IA 4801", name:"Research Project", credit:8 }
      ]
    }
  };

  const GRADE_VALUES = {
    "A+": 4.0, "A": 4.0, "A-": 3.7,
    "B+": 3.3, "B": 3.0, "B-": 2.7,
    "C+": 2.3, "C": 2.0, "C-": 1.7,
    "D": 1.0,  "F": 0.0
  };

  // --- STATE VARIABLES ---
  let calculatedCredits = 0;
  let calculatedPoints = 0;
  let calculatedGpa = 0.00;
  let currentLevel = '';
  let currentSemester = '';
  let currentCalculated = false;

  // Track dynamic custom course rows
  let customCourseCount = 0;

  // Track student type and custom curriculum
  let studentType = 'iat';
  let customCurriculum = null;

  // --- LOAD INITIAL SETTINGS ---
  function loadStudentSettings() {
    try {
      studentType = localStorage.getItem('unihub_student_type') || 'iat';
      const rawCustom = localStorage.getItem('unihub_custom_curriculum');
      if (rawCustom) {
        customCurriculum = JSON.parse(rawCustom);
      }
    } catch (e) {
      studentType = 'iat';
      customCurriculum = null;
    }
  }

  // --- SAVE STUDENT SETTINGS ---
  function saveStudentTypeSetting(type) {
    studentType = type;
    localStorage.setItem('unihub_student_type', type);
  }

  // --- STUDENT TYPE TOGGLE MANAGER ---
  window.setStudentType = function (type) {
    saveStudentTypeSetting(type);
    
    // Manage active buttons
    const btnIat = document.getElementById('toggle-iat');
    const btnCustom = document.getElementById('toggle-custom');
    const uploaderPanel = document.getElementById('customUploaderPanel');

    if (type === 'iat') {
      if (btnIat) btnIat.classList.add('active');
      if (btnCustom) btnCustom.classList.remove('active');
      if (uploaderPanel) uploaderPanel.style.display = "none";
    } else {
      if (btnIat) btnIat.classList.remove('active');
      if (btnCustom) btnCustom.classList.add('active');
      if (uploaderPanel) uploaderPanel.style.display = "block";
    }

    // Refresh curriculum select options
    initCurriculumDropdowns();
  };

  // --- INITIALIZE CURRICULUM SELECT LEVELS ---
  function initCurriculumDropdowns() {
    const levelSel = document.getElementById('levelSelect');
    const semSel = document.getElementById('semesterSelect');
    const tableBody = document.getElementById('subjectTable');
    const addCourseRow = document.getElementById('addCourseRow');

    levelSel.innerHTML = '<option value="">— Select Level —</option>';
    semSel.innerHTML = '<option value="">— Select Semester —</option>';
    tableBody.innerHTML = '';
    if (addCourseRow) addCourseRow.style.display = "none";
    resetCalculatorState();

    if (studentType === 'iat') {
      Object.keys(CURRICULUM).forEach(function (lvl) {
        const opt = document.createElement('option');
        opt.value = lvl;
        opt.textContent = lvl;
        levelSel.appendChild(opt);
      });
    } else {
      // Custom student mode
      if (customCurriculum && Object.keys(customCurriculum).length > 0) {
        Object.keys(customCurriculum).forEach(function (lvl) {
          const opt = document.createElement('option');
          opt.value = lvl;
          opt.textContent = lvl;
          levelSel.appendChild(opt);
        });
      } else {
        // Warning placeholder when no custom JSON is present
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 2.2rem 1.5rem; color: var(--text-secondary);">
              <i class="fas fa-file-code" style="font-size: 2rem; opacity: 0.3; display: block; margin-bottom: 12px; color: var(--accent-orange);"></i>
              <strong>No custom curriculum syllabus JSON uploaded.</strong><br>
              <span style="font-size: 0.8rem; display: block; margin-top: 5px; color: var(--text-muted);">
                Download the format template above, modify courses in any editor, and upload the file, or click "Add Custom Course" below to enter details manually.
              </span>
            </td>
          </tr>
        `;
        if (addCourseRow) addCourseRow.style.display = "block";
      }
    }
  }

  // --- DOWNLOAD SYLLABUS JSON FORMAT TEMPLATE ---
  window.downloadSyllabusTemplate = function () {
    const template = {
      "Year 1": {
        "Semester 1": [
          { "code": "CS-1101", "name": "Programming Principles", "credit": 3 },
          { "code": "MATH-1101", "name": "Calculus I", "credit": 4 },
          { "code": "ENG-1101", "name": "Technical Communication", "credit": "NG" }
        ],
        "Semester 2": [
          { "code": "CS-1102", "name": "Data Structures & Algorithms", "credit": 4 },
          { "code": "PHYS-1101", "name": "Physics for Engineers", "credit": 3 }
        ]
      },
      "Year 2": {
        "Semester 1": [
          { "code": "CS-2101", "name": "Database Management Systems", "credit": 3 },
          { "code": "MATH-2101", "name": "Linear Algebra", "credit": 3 }
        ]
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",     dataStr);
    dlAnchorElem.setAttribute("download", "unihub_curriculum_template.json");
    dlAnchorElem.click();
    
    window.showToast("Format template JSON download started.");
  };

  // --- PARSE AND VALIDATE UPLOADED SYLLABUS JSON ---
  window.handleCurriculumUpload = function (event, droppedFile) {
    const file = droppedFile || event.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('uploadStatusText');
    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.className = "upload-status-text";
      statusEl.textContent = "Parsing file...";
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const json = JSON.parse(e.target.result);
        if (validateCurriculumJSON(json)) {
          customCurriculum = json;
          localStorage.setItem('unihub_custom_curriculum', JSON.stringify(json));
          
          if (statusEl) {
            statusEl.className = "upload-status-text upload-status-success";
            statusEl.textContent = "Syllabus uploaded successfully! Loaded " + Object.keys(json).length + " Level(s).";
          }
          window.showToast("Custom syllabus uploaded and applied!");
          window.addActivityLog("Uploaded custom curriculum JSON", "gpa");
          
          // Refresh level options
          initCurriculumDropdowns();
        } else {
          throw new Error("Invalid structure.");
        }
      } catch (err) {
        if (statusEl) {
          statusEl.className = "upload-status-text upload-status-error";
          statusEl.innerHTML = "<i class='fas fa-exclamation-circle'></i> Error parsing JSON. Format must match the downloaded template.";
        }
        window.showToast("Failed to parse curriculum JSON.");
      }
    };
    reader.readAsText(file);
    
    // Clear input value
    if (event && event.target) {
      event.target.value = '';
    }
  };

  function validateCurriculumJSON(json) {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return false;
    const levels = Object.keys(json);
    if (levels.length === 0) return false;
    
    for (let i = 0; i < levels.length; i++) {
      const lvl = levels[i];
      const sems = json[lvl];
      if (!sems || typeof sems !== 'object' || Array.isArray(sems)) return false;
      
      const semKeys = Object.keys(sems);
      if (semKeys.length === 0) return false;
      
      for (let j = 0; j < semKeys.length; j++) {
        const sem = semKeys[j];
        const courses = sems[sem];
        if (!Array.isArray(courses)) return false;
        
        for (let k = 0; k < courses.length; k++) {
          const course = courses[k];
          if (!course || typeof course !== 'object') return false;
          if (course.code === undefined || course.credit === undefined) return false;
        }
      }
    }
    return true;
  }

  // --- UI MESSAGE PANEL ---
  function showMessage(msg, type) {
    const box = document.getElementById('messageBox');
    if (!box) return;

    box.innerHTML = msg;
    box.className = 'msg-box';
    box.classList.add(type === 'success' ? 'msg-success' : type === 'error' ? 'msg-error' : 'msg-info');
    
    // Auto clear alert
    setTimeout(function () {
      box.className = 'msg-box';
      box.innerHTML = '';
    }, 4000);
  }

  function getGpaStatus(gpa) {
    if (gpa >= 3.7) return 'Excellent Performance';
    if (gpa >= 3.0) return 'Good Performance';
    if (gpa >= 2.0) return 'Average Performance';
    return 'Needs Improvement';
  }

  function setStatusColor(elId, gpa) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.classList.remove('status-excellent', 'status-good', 'status-average', 'status-weak');
    if      (gpa >= 3.7) el.classList.add('status-excellent');
    else if (gpa >= 3.0) el.classList.add('status-good');
    else if (gpa >= 2.0) el.classList.add('status-average');
    else                 el.classList.add('status-weak');
  }

  function setSaveState(ready) {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.disabled = !ready;
  }

  function resetCalculatorState() {
    calculatedCredits = 0;
    calculatedPoints = 0;
    calculatedGpa = 0.00;
    currentCalculated = false;
    
    document.getElementById('result').textContent = 'Semester GPA: 0.00';
    document.getElementById('semesterStatus').textContent = 'Status: Not calculated';
    document.getElementById('semesterStatus').className = 'status-text';
    setSaveState(false);
  }

  // --- POPULATE SELECTORS ---
  window.loadSemesters = function () {
    const level = document.getElementById('levelSelect').value;
    const semSel = document.getElementById('semesterSelect');
    const tableBody = document.getElementById('subjectTable');
    const addCourseRow = document.getElementById('addCourseRow');

    semSel.innerHTML = '<option value="">— Select Semester —</option>';
    tableBody.innerHTML = '';
    if (addCourseRow) addCourseRow.style.display = "none";

    resetCalculatorState();
    
    const dataset = (studentType === 'iat') ? CURRICULUM : customCurriculum;
    if (!level || !dataset || !dataset[level]) return;

    Object.keys(dataset[level]).forEach(function (s) {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      semSel.appendChild(opt);
    });
  };

  window.loadSubjects = function () {
    const level = document.getElementById('levelSelect').value;
    const sem = document.getElementById('semesterSelect').value;
    const tableBody = document.getElementById('subjectTable');
    const addCourseRow = document.getElementById('addCourseRow');

    tableBody.innerHTML = '';
    customCourseCount = 0;
    resetCalculatorState();

    const dataset = (studentType === 'iat') ? CURRICULUM : customCurriculum;
    if (!level || !sem || !dataset || !dataset[level] || !dataset[level][sem]) {
      if (addCourseRow && studentType === 'custom') {
        addCourseRow.style.display = "block"; // allow manual row addition
      } else if (addCourseRow) {
        addCourseRow.style.display = "none";
      }
      return;
    }

    currentLevel = level;
    currentSemester = sem;

    // Load subjects from selected curriculum
    dataset[level][sem].forEach(function (subject) {
      appendPresetCourseRow(subject);
    });

    if (addCourseRow) addCourseRow.style.display = "block";
  };

  function appendPresetCourseRow(subject) {
    const tbody = document.getElementById('subjectTable');
    const tr = document.createElement('tr');
    tr.className = 'preset-course-row';
    tr.dataset.code = subject.code;
    tr.dataset.name = subject.name;
    tr.dataset.credit = subject.credit;

    if (subject.credit === 'NG') {
      tr.innerHTML = `
        <td>${subject.code}</td>
        <td>${subject.name}</td>
        <td style="text-align: center;">NG</td>
        <td style="text-align: center;"><span class="ng-text">Not counted</span></td>
        <td></td>
      `;
    } else {
      tr.innerHTML = `
        <td>${subject.code}</td>
        <td>${subject.name}</td>
        <td style="text-align: center;" class="credit-value">${subject.credit}</td>
        <td style="text-align: center;">
          <select class="grade-sel" onchange="handleGradeChange(this)">
            <option value="">Grade</option>
            ${Object.keys(GRADE_VALUES).map(g => `<option value="${g}">${g}</option>`).join('')}
          </select>
        </td>
        <td></td>
      `;
    }
    tbody.appendChild(tr);
  }

  // --- DYNAMIC CUSTOM COURSES ROW ADDITION ---
  window.addCustomCourseRow = function (code = '', name = '', credits = 3, grade = '') {
    const tbody = document.getElementById('subjectTable');
    customCourseCount++;
    const rowId = `custom_row_${Date.now()}_${customCourseCount}`;

    const tr = document.createElement('tr');
    tr.className = 'custom-course-row';
    tr.id = rowId;

    tr.innerHTML = `
      <td><input type="text" class="td-inp custom-code" placeholder="Code" value="${escapeHtml(code)}"></td>
      <td><input type="text" class="td-inp custom-name" placeholder="Course Title" value="${escapeHtml(name)}"></td>
      <td style="text-align: center;">
        <input type="number" class="td-credit-inp custom-credit" min="0.5" max="8" step="0.5" value="${credits}">
      </td>
      <td style="text-align: center;">
        <select class="grade-sel custom-grade" onchange="handleGradeChange(this)">
          <option value="">Grade</option>
          ${Object.keys(GRADE_VALUES).map(g => `<option value="${g}" ${g===grade?'selected':''}>${g}</option>`).join('')}
        </select>
      </td>
      <td style="text-align: center;">
        <button class="delete-row-btn" onclick="deleteCustomCourseRow('${rowId}')" title="Delete custom course">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
    
    // Trigger selector updates
    const select = tr.querySelector('.custom-grade');
    if (select && grade) handleGradeChange(select);

    resetCalculatorState();
  };

  window.deleteCustomCourseRow = function (rowId) {
    const row = document.getElementById(rowId);
    if (row) {
      row.remove();
      resetCalculatorState();
      window.showToast("Custom course row deleted.");
    }
  };

  window.handleGradeChange = function (selectEl) {
    resetCalculatorState();
    
    // Style update based on grades ranges
    const val = selectEl.value;
    selectEl.classList.remove('grade-excellent', 'grade-good', 'grade-average', 'grade-weak');
    if (['A+', 'A', 'A-'].includes(val)) {
      selectEl.classList.add('grade-excellent');
    } else if (['B+', 'B', 'B-'].includes(val)) {
      selectEl.classList.add('grade-good');
    } else if (['C+', 'C', 'C-'].includes(val)) {
      selectEl.classList.add('grade-average');
    } else if (['D', 'F'].includes(val)) {
      selectEl.classList.add('grade-weak');
    }
  };

  // --- CALCULATION LOGIC ---
  window.calculateGPA = function () {
    const level = document.getElementById('levelSelect').value;
    const sem = document.getElementById('semesterSelect').value;
    
    if (!level || !sem) {
      showMessage('Please select level and semester.', 'error');
      return;
    }

    let totalCredits = 0;
    let totalPoints = 0;
    let allSelected = true;

    // 1. Calculate preset rows
    const presetRows = document.querySelectorAll('.preset-course-row');
    presetRows.forEach(function (row) {
      const crText = row.dataset.credit;
      if (crText !== 'NG') {
        const credits = parseFloat(crText);
        const gradeSelect = row.querySelector('.grade-sel');
        const grade = gradeSelect.value;
        
        if (!grade) {
          allSelected = false;
        } else {
          totalCredits += credits;
          totalPoints += credits * GRADE_VALUES[grade];
        }
      }
    });

    // 2. Calculate custom dynamic rows
    const customRows = document.querySelectorAll('.custom-course-row');
    customRows.forEach(function (row) {
      const code = row.querySelector('.custom-code').value.trim();
      const name = row.querySelector('.custom-name').value.trim();
      const credits = parseFloat(row.querySelector('.custom-credit').value);
      const grade = row.querySelector('.custom-grade').value;

      if (!grade || isNaN(credits) || credits <= 0) {
        allSelected = false;
      } else {
        totalCredits += credits;
        totalPoints += credits * GRADE_VALUES[grade];
      }
    });

    if (!allSelected) {
      showMessage('Please select grades and credits for all course items.', 'error');
      return;
    }

    if (totalCredits === 0) {
      showMessage('No calculable credits found.', 'error');
      return;
    }

    calculatedGpa = totalPoints / totalCredits;
    calculatedCredits = totalCredits;
    calculatedPoints = totalPoints;
    currentCalculated = true;

    document.getElementById('result').textContent = 'Semester GPA: ' + calculatedGpa.toFixed(2);
    document.getElementById('semesterStatus').textContent = 'Status: ' + getGpaStatus(calculatedGpa);
    setStatusColor('semesterStatus', calculatedGpa);
    setSaveState(true);
    showMessage('Semester GPA calculated successfully!', 'success');
  };

  // --- SAVE SEMESTER DATA TO LOCAL STORAGE ---
  function getSavedRecords() {
    try {
      const raw = localStorage.getItem('semesterResults');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function saveSavedRecords(arr) {
    localStorage.setItem('semesterResults', JSON.stringify(arr));
  }

  window.saveSemesterGPA = function () {
    if (!currentCalculated) return;

    const records = getSavedRecords();
    
    // Compile row grades array (including custom details to support editing restoration)
    const coursesSaved = [];
    
    // Presets
    const presetRows = document.querySelectorAll('.preset-course-row');
    presetRows.forEach(function (row) {
      const crText = row.dataset.credit;
      if (crText !== 'NG') {
        coursesSaved.push({
          preset: true,
          code: row.dataset.code,
          name: row.dataset.name,
          credit: parseFloat(crText),
          grade: row.querySelector('.grade-sel').value
        });
      } else {
        coursesSaved.push({
          preset: true,
          code: row.dataset.code,
          name: row.dataset.name,
          credit: 'NG',
          grade: ''
        });
      }
    });

    // Customs
    const customRows = document.querySelectorAll('.custom-course-row');
    customRows.forEach(function (row) {
      coursesSaved.push({
        preset: false,
        code: row.querySelector('.custom-code').value.trim(),
        name: row.querySelector('.custom-name').value.trim(),
        credit: parseFloat(row.querySelector('.custom-credit').value),
        grade: row.querySelector('.custom-grade').value
      });
    });

    const newRecord = {
      level: currentLevel,
      semester: currentSemester,
      credits: calculatedCredits,
      points: calculatedPoints,
      courses: coursesSaved
    };

    // Replace if level/semester matches, otherwise add
    const index = records.findIndex(r => r.level === currentLevel && r.semester === currentSemester);
    if (index !== -1) {
      records[index] = newRecord;
      showMessage(`Semester GPA updated for ${currentLevel} · ${currentSemester}!`, 'success');
      window.addActivityLog(`📊 GPA Semester updated: ${currentLevel} · ${currentSemester}`, 'gpa');
    } else {
      records.push(newRecord);
      showMessage(`Semester GPA saved successfully!`, 'success');
      window.addActivityLog(`📊 GPA Semester saved: ${currentLevel} · ${currentSemester}`, 'gpa');
    }

    saveSavedRecords(records);
    displaySaved();
    setSaveState(false);
  };

  // --- RENDERING SAVED HISTORY LOGS ---
  window.displaySaved = function () {
    const records = getSavedRecords();
    const tbody = document.getElementById('savedSemesterTable');
    if (!tbody) return;

    tbody.innerHTML = '';
    let totalCredits = 0;
    let totalPoints = 0;

    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No saved semesters logs. Calculate and save above.</td></tr>`;
    } else {
      records.forEach(function (r, idx) {
        const semGpa = r.points / r.credits;
        totalCredits += r.credits;
        totalPoints += r.points;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(r.level)}</td>
          <td>${escapeHtml(r.semester)}</td>
          <td style="text-align: center;">${r.credits}</td>
          <td style="text-align: center; font-weight:800;" class="${getGpaColorClass(semGpa)}">${semGpa.toFixed(2)}</td>
          <td style="text-align: center;">
            <button class="edit-btn" onclick="editSaved(${idx})"><i class="fas fa-edit"></i> Edit</button>
            <button class="delete-btn" onclick="deleteSaved(${idx})"><i class="fas fa-trash-alt"></i> Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    updateOverallPanel(totalCredits, totalPoints, records.length);
  };

  function updateOverallPanel(totalCredits, totalPoints, count) {
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    document.getElementById('overallGPAValue').textContent = gpa.toFixed(2);
    document.getElementById('overallCreditsValue').textContent = totalCredits;
    document.getElementById('overallSavedValue').textContent = count;

    const overallStatus = document.getElementById('overallStatus');
    if (totalCredits === 0) {
      overallStatus.textContent = 'Status: Not calculated';
      overallStatus.className = 'overall-status';
    } else {
      overallStatus.textContent = 'Status: ' + getGpaStatus(gpa);
      setStatusColor('overallStatus', gpa);
    }

    const box = document.getElementById('overallBox');
    const toggleBtn = document.getElementById('toggleOverallBtn');
    if (toggleBtn) {
      toggleBtn.innerHTML = `<i class="fas fa-chart-bar"></i> ${box.classList.contains('hidden-overall') ? 'View' : 'Hide'} Overall GPA (${count} Saved)`;
    }
  }

  // --- ACTIONS EDIT & DELETE ON HISTORIES ---
  window.editSaved = function (idx) {
    const records = getSavedRecords();
    const rec = records[idx];
    if (!rec) return;

    // Automatically switch studentType if the level matches the other type
    let targetType = studentType;
    if (studentType === 'custom' && (!customCurriculum || !customCurriculum[rec.level]) && CURRICULUM[rec.level]) {
      targetType = 'iat';
    } else if (studentType === 'iat' && !CURRICULUM[rec.level] && customCurriculum && customCurriculum[rec.level]) {
      targetType = 'custom';
    }

    if (targetType !== studentType) {
      studentType = targetType;
      localStorage.setItem('unihub_student_type', targetType);
      
      const btnIat = document.getElementById('toggle-iat');
      const btnCustom = document.getElementById('toggle-custom');
      const uploaderPanel = document.getElementById('customUploaderPanel');

      if (targetType === 'iat') {
        if (btnIat) btnIat.classList.add('active');
        if (btnCustom) btnCustom.classList.remove('active');
        if (uploaderPanel) uploaderPanel.style.display = "none";
      } else {
        if (btnIat) btnIat.classList.remove('active');
        if (btnCustom) btnCustom.classList.add('active');
        if (uploaderPanel) uploaderPanel.style.display = "block";
      }
    }

    // Now reload dropdown options based on the correct type
    initCurriculumDropdowns();

    document.getElementById('levelSelect').value = rec.level;
    window.loadSemesters();
    document.getElementById('semesterSelect').value = rec.semester;

    // Reset table loading and populate saved grades
    const tableBody = document.getElementById('subjectTable');
    tableBody.innerHTML = '';
    customCourseCount = 0;

    // Reconstruct course rows exactly as saved
    rec.courses.forEach(function (course) {
      if (course.preset) {
        // Preset Row
        const tr = document.createElement('tr');
        tr.className = 'preset-course-row';
        tr.dataset.code = course.code;
        tr.dataset.name = course.name;
        tr.dataset.credit = course.credit;

        if (course.credit === 'NG') {
          tr.innerHTML = `
            <td>${course.code}</td>
            <td>${course.name}</td>
            <td style="text-align: center;">NG</td>
            <td style="text-align: center;"><span class="ng-text">Not counted</span></td>
            <td></td>
          `;
        } else {
          tr.innerHTML = `
            <td>${course.code}</td>
            <td>${course.name}</td>
            <td style="text-align: center;" class="credit-value">${course.credit}</td>
            <td style="text-align: center;">
              <select class="grade-sel" onchange="handleGradeChange(this)">
                <option value="">Grade</option>
                ${Object.keys(GRADE_VALUES).map(g => `<option value="${g}" ${g===course.grade?'selected':''}>${g}</option>`).join('')}
              </select>
            </td>
            <td></td>
          `;
          // Style initial grade select values
          const select = tr.querySelector('.grade-sel');
          if (select && course.grade) handleGradeChange(select);
        }
        tableBody.appendChild(tr);
      } else {
        // Custom Row
        window.addCustomCourseRow(course.code, course.name, course.credit, course.grade);
      }
    });

    document.getElementById('addCourseRow').style.display = "block";

    resetCalculatorState();
    document.getElementById('semesterStatus').textContent = 'Status: Record loaded. Recalculate to save edits.';
    
    window.showToast("Saved records loaded. Modify and calculate to save changes!");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.deleteSaved = function (idx) {
    const records = getSavedRecords();
    const removed = records[idx];
    records.splice(idx, 1);
    saveSavedRecords(records);
    displaySaved();
    window.showToast("Record deleted.");
    if (removed) {
      window.addActivityLog(`Wiped GPA record: ${removed.level} · ${removed.semester}`, 'gpa');
    }
  };

  window.clearAllSemesterGPA = function () {
    if (!confirm('Clear ALL saved GPA semester logs? This cannot be undone.')) return;
    localStorage.removeItem('semesterResults');
    displaySaved();
    window.showToast("All history logs purged.");
    window.addActivityLog('All saved GPA records cleared.', 'gpa');
  };

  window.toggleOverallBox = function () {
    const box = document.getElementById('overallBox');
    const isHidden = box.classList.toggle('hidden-overall');
    displaySaved();
    
    if (!isHidden) {
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getGpaColorClass(gpa) {
    if (gpa >= 3.7) return 'status-excellent';
    if (gpa >= 3.0) return 'status-good';
    if (gpa >= 2.0) return 'status-average';
    return 'status-weak';
  }

  // Hook dynamic updates from profile reset actions
  window.addEventListener('unihub_profile_change', window.displaySaved);

  // --- ON LOAD ---
  document.addEventListener('DOMContentLoaded', function () {
    loadStudentSettings();

    // Set initial segmented buttons and panels
    const btnIat = document.getElementById('toggle-iat');
    const btnCustom = document.getElementById('toggle-custom');
    const uploaderPanel = document.getElementById('customUploaderPanel');

    if (studentType === 'iat') {
      if (btnIat) btnIat.classList.add('active');
      if (btnCustom) btnCustom.classList.remove('active');
      if (uploaderPanel) uploaderPanel.style.display = "none";
    } else {
      if (btnIat) btnIat.classList.remove('active');
      if (btnCustom) btnCustom.classList.add('active');
      if (uploaderPanel) uploaderPanel.style.display = "block";
    }

    // Set up upload dropzone events
    const dropzone = document.getElementById('uploadDropzone');
    const fileInput = document.getElementById('curriculumFile');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', function () {
        fileInput.click();
      });

      dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragenter', function (e) {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', function () {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          window.handleCurriculumUpload(null, e.dataTransfer.files[0]);
        }
      });
    }

    initCurriculumDropdowns();
    displaySaved();
    setSaveState(false);
  });
}());
