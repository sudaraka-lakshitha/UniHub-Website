/* ============================================================
   focus.js — Focus Mode Logic (Pomodoro, Audio, Tasks, Notes)
   ============================================================ */

(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const CIRCUMFERENCE = 2 * Math.PI * 70; // ~439.82
  const QUOTES = [
    '"The secret of getting ahead is getting started." — Mark Twain',
    '"Focus on being productive instead of busy." — Tim Ferriss',
    '"It always seems impossible until it\'s done." — Nelson Mandela',
    '"Don\'t watch the clock; do what it does. Keep going." — Sam Levenson',
    '"Small steps every day add up to big results." — Unknown',
    '"You don\'t have to be great to start, but you have to start to be great." — Zig Ziglar'
  ];
  
  const TAG_LABELS = { math: 'Maths', sci: 'Science', eng: 'English', gen: 'General', custom: 'Custom' };
  const TAG_CLASSES = { math: 'tg-math', sci: 'tg-sci', eng: 'tg-eng', gen: 'tg-gen', custom: 'tg-custom' };

  // --- SCIENTIFIC GUIDE DETAILS ---
  const GUIDES = {
    breaks: {
      title: "Periodic Breathers, Restored Focus",
      desc: "The Pomodoro loop advocates for discrete 25-minute sprints separated by structured 5-minute gaps. Breaking down long sessions eliminates academic fatigue.",
      points: [
        "Stand up, stretch or walk within each break timer interval.",
        "Implement the 20-20-20 rule to maximize optical health.",
        "Avoid refreshing social media; allow your cognitive RAM to digest knowledge."
      ],
      icon: '<i class="fas fa-coffee"></i>'
    },
    hydrate: {
      title: "Continuous Hydration, Peak Performance",
      desc: "Mild hydration drops as small as 1% significantly degrade memory storage, concentration, and logic capacity. Keep fresh water at your focus desk.",
      points: [
        "Sip 100ml water at every structural chime trigger.",
        "Choose clear water over canned drinks to avoid sudden insulin drops.",
        "Visual cues: Keep a crystal pitcher on your deck dashboard."
      ],
      icon: '<i class="fas fa-tint"></i>'
    },
    phone: {
      title: "Lock Phone Distractions Out",
      desc: "Studies outline that recovering full executive focus after a single phone buzz takes an average of 23 minutes. Construct a bulletproof focus cockpit.",
      points: [
        "Turn down notification pings and store your smartphone inside drawers.",
        "Close heavy background communication software during timer loops.",
        "Keep a clean instrumental sound rhythm running to mask environment hum."
      ],
      icon: '<i class="fas fa-mobile-alt"></i>'
    },
    streak: {
      title: "Consistency Compounds Fast",
      desc: "Consistent daily short periods of active focused study are ten times more powerful than irregular 8-hour weekend cram sessions.",
      points: [
        "Keep your daily score streak ticking upward every afternoon.",
        "Map your milestone objectives before initiating play buttons.",
        "Exchange earned focus points (XP) for real physical rewards."
      ],
      icon: '<i class="fas fa-fire"></i>'
    }
  };

  // --- AUDIO STATE ---
  let audioCtx = null;
  let musicGain = null;
  let musicSource = null;
  let isMusicPlaying = false;
  let musicStarted = false;
  let musicOffset = 0;
  let musicStartTime = 0;
  let currentTrackIdx = 0;
  let musicSkipped = false;
  
  // playlist: array of { id, name, arrayBuffer, buffer(decoded) }
  let playlist = []; 

  // --- FOCUS SOUND MACHINE SYNTH STATE ---
  let ambientSound = "none"; // none, white_noise, binaural, ocean_waves
  let synthCtx = null;
  let synthNodes = [];

  // --- TIMER STATE ---
  let focusMins = 25;
  let shortMins = 5;
  let longMins = 15;
  let timeMode = "focus"; // focus, short, long
  let totalDuration = 25 * 60;
  let timeLeft = 25 * 60;
  let timerRunning = false;
  let timerInterval = null;

  // focus metrics history log
  let sessionsCycle = 0;
  let totalSessions = 0;
  let minutesFocused = 0;
  let tasksCompletedCount = 0;
  let streakDays = 0;
  let focusXp = 0;

  // checklist tasks array
  let tasks = [];
  
  // prompt/confirm overlays helper state
  let currentConfirmAction = null;

  // ============================================================
  // INDEXEDDB MANAGEMENT FOR PLAYLIST MUSIC
  // ============================================================
  let db = null;
  function initDB(callback) {
    const request = indexedDB.open("UniHubMusicDB", 1);
    request.onupgradeneeded = function (e) {
      const dbInstance = e.target.result;
      if (!dbInstance.objectStoreNames.contains("music")) {
        dbInstance.createObjectStore("music", { keyPath: "id" });
      }
    };
    request.onsuccess = function (e) {
      db = e.target.result;
      if (callback) callback();
    };
    request.onerror = function () {
      console.error("IndexedDB failed to initialize.");
    };
  }

  function saveTrackToDB(track, callback) {
    if (!db) return;
    const tx = db.transaction("music", "readwrite");
    const store = tx.objectStore("music");
    store.put(track);
    tx.oncomplete = function () {
      if (callback) callback();
    };
  }

  function deleteTrackFromDB(id, callback) {
    if (!db) return;
    const tx = db.transaction("music", "readwrite");
    const store = tx.objectStore("music");
    store.delete(id);
    tx.oncomplete = function () {
      if (callback) callback();
    };
  }

  function loadTracksFromDB(callback) {
    if (!db) return;
    const tx = db.transaction("music", "readonly");
    const store = tx.objectStore("music");
    const req = store.getAll();
    req.onsuccess = function () {
      callback(req.result || []);
    };
  }

  // ============================================================
  // LOCAL STORAGE AND STATE LOADERS
  // ============================================================
  function loadLocalState() {
    // 1. Focus Timer Configuration
    try {
      const rawFocus = localStorage.getItem('unihub_focus_data');
      if (rawFocus) {
        const data = JSON.parse(rawFocus);
        focusMins = data.focusMins || 25;
        shortMins = data.shortMins || 5;
        longMins = data.longMins || 15;
        
        totalSessions = data.totalSessions || 0;
        minutesFocused = data.focMin || 0;
        tasks = data.tasks || [];
        
        // Synced inputs
        document.getElementById('customFocus').value = focusMins;
        document.getElementById('customShort').value = shortMins;
        document.getElementById('customLong').value = longMins;
      }
    } catch (e) {}

    // 2. Load XP and Streak values
    try {
      const rawStreak = localStorage.getItem('unihub_focus_streak');
      streakDays = rawStreak ? parseInt(rawStreak, 10) : Math.floor(totalSessions / 3);
      
      const rawXp = localStorage.getItem('unihub_focus_points');
      focusXp = rawXp ? parseInt(rawXp, 10) : 0;
    } catch (e) {}

    // 3. Load Notes pad
    const noteEl = document.getElementById('sessionNote');
    if (noteEl) {
      noteEl.value = localStorage.getItem('unihub_sessionNote') || '';
    }

    // Set initial timer values
    totalDuration = focusMins * 60;
    timeLeft = totalDuration;

    // 4. Restore claim button state — disable if already claimed today
    const lastClaim = localStorage.getItem('unihub_last_xp_claim');
    const todayStr = new Date().toDateString();
    const btn = document.getElementById('claim-streak-btn');
    if (btn && lastClaim === todayStr) {
      setClaimButtonClaimed(btn);
    }
    
    updateMiniStatsUI();
    renderTasks();
  }

  function saveLocalState() {
    const state = {
      focusMins: focusMins,
      shortMins: shortMins,
      longMins: longMins,
      totalSessions: totalSessions,
      focMin: minutesFocused,
      tasks: tasks
    };
    localStorage.setItem('unihub_focus_data', JSON.stringify(state));
    localStorage.setItem('unihub_focus_streak', streakDays.toString());
    localStorage.setItem('unihub_focus_points', focusXp.toString());

    // Show saved disk indicator briefly
    const ind = document.getElementById('saveIndicator');
    if (ind) {
      ind.classList.add('show');
      setTimeout(() => ind.classList.remove('show'), 1500);
    }
  }

  function updateMiniStatsUI() {
    // Top Timer Stats Card
    document.getElementById('sSess').textContent = sessionsCycle;
    document.getElementById('sTotalSess').textContent = totalSessions;
    document.getElementById('sMin').textContent = minutesFocused;
    
    const completed = tasks.filter(t => t.done || t.completed).length;
    document.getElementById('sDone').textContent = completed;

    // Bottom Notes Stats Card
    document.getElementById('todaySessions').textContent = totalSessions;
    document.getElementById('todayMins').textContent = minutesFocused;
    document.getElementById('streakDays').textContent = streakDays;

    // XP badge in the stats mini bar
    const xpEl = document.getElementById('focusXpVal');
    if (xpEl) xpEl.textContent = focusXp;
  }

  // ============================================================
  // FOCUS MUSIC PLAYER (IndexedDB Track Decoders)
  // ============================================================
  function initAudioCtx() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      musicGain = audioCtx.createGain();
      musicGain.gain.value = parseFloat(document.getElementById('musicVolume').value);
      musicGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function handleMusicUpload(e, source) {
    const file = e.target.files[0];
    if (!file) return;

    if (playlist.length >= 5) {
      window.showToast("Playlist capacity full! Delete a track first.");
      return;
    }

    window.showToast("Reading audio file...");
    const reader = new FileReader();
    
    reader.onload = function (evt) {
      const arrayBuffer = evt.target.result;
      const track = {
        id: "track_" + Date.now(),
        name: file.name.replace(/\.[^/.]+$/, ""), // Strip extension
        arrayBuffer: arrayBuffer
      };

      saveTrackToDB(track, function () {
        window.showToast("Track imported successfully! Decoding...");
        
        // Dynamically decode buffer
        initAudioCtx();
        audioCtx.decodeAudioData(arrayBuffer.slice(0), function (decodedBuffer) {
          track.buffer = decodedBuffer;
          playlist.push(track);
          
          if (source === 'prompt') {
            document.getElementById('musicPrompt').classList.add('hidden');
          }
          
          updatePlaylistUI();
          window.showToast(`🎵 ${track.name} added to playlist!`);
          window.addActivityLog(`Track '${track.name}' added to playlist.`, 'resource');
        }, function () {
          window.showToast("Failed to decode audio file. Ensure it is a valid format.");
          // remove from DB
          deleteTrackFromDB(track.id);
        });
      });
    };
    reader.readAsArrayBuffer(file);
    // Clear value
    e.target.value = '';
  }

  function updatePlaylistUI() {
    const tracksContainer = document.getElementById('playlistTracks');
    const label = document.getElementById('playlistCountLabel');
    const playerTrackName = document.getElementById('musicName');
    
    if (label) label.textContent = `${playlist.length} / 5 tracks`;
    if (!tracksContainer) return;

    if (playlist.length === 0) {
      tracksContainer.innerHTML = `<div style="font-size:0.74rem;color:var(--text-muted);font-style:italic;">No custom tracks added.</div>`;
      if (playerTrackName) playerTrackName.textContent = "No music";
      document.getElementById('musicSourceLabel').textContent = "Add tracks in settings";
      return;
    }

    tracksContainer.innerHTML = '';
    playlist.forEach(function (track, idx) {
      const isActive = idx === currentTrackIdx;
      const el = document.createElement('div');
      el.className = 'pl-track' + (isActive ? ' pl-active' : '');
      el.innerHTML = `
        <span class="pl-num">${idx + 1}</span>
        <span class="pl-name" title="${escapeHtml(track.name)}">${escapeHtml(track.name)}</span>
        ${isActive && isMusicPlaying ? '<span class="pl-playing-icon">🎵</span>' : ''}
        <button class="pl-del" onclick="event.stopPropagation(); deleteTrack(${idx})" title="Delete track">
          <i class="fas fa-trash"></i>
        </button>
      `;
      el.addEventListener('click', function () {
        playTrack(idx);
      });
      tracksContainer.appendChild(el);
    });

    if (playlist[currentTrackIdx]) {
      if (playerTrackName) playerTrackName.textContent = playlist[currentTrackIdx].name;
      document.getElementById('musicSourceLabel').textContent = "Uploaded playlist";
    }
  }

  window.deleteTrack = function (idx) {
    const track = playlist[idx];
    if (!track) return;

    const wasActive = idx === currentTrackIdx;
    
    if (wasActive && isMusicPlaying) {
      stopMusicPlayback();
    }

    deleteTrackFromDB(track.id, function () {
      playlist.splice(idx, 1);
      if (currentTrackIdx >= playlist.length && playlist.length > 0) {
        currentTrackIdx = playlist.length - 1;
      }
      updatePlaylistUI();
      window.showToast("Track deleted.");
      window.addActivityLog(`Track '${track.name}' deleted.`, 'resource');
    });
  };

  function playTrack(idx) {
    if (playlist.length === 0) return;
    stopMusicPlayback();

    currentTrackIdx = idx;
    updatePlaylistUI();
    initAudioCtx();

    const track = playlist[currentTrackIdx];
    if (!track || !track.buffer) return;

    musicSource = audioCtx.createBufferSource();
    musicSource.buffer = track.buffer;
    musicSource.connect(musicGain);
    musicSource.loop = true;

    musicStartTime = audioCtx.currentTime;
    musicSource.start(0, musicOffset);
    
    isMusicPlaying = true;
    musicStarted = true;
    musicSkipped = false;

    updateMusicPlayerControlsUI();
  }

  function stopMusicPlayback() {
    if (musicSource) {
      try {
        musicSource.stop();
      } catch (e) {}
      musicSource.disconnect();
      musicSource = null;
    }
    isMusicPlaying = false;
    musicOffset = 0;
    updateMusicPlayerControlsUI();
  }

  window.toggleMusic = function () {
    if (playlist.length === 0) {
      window.showToast("No tracks to play. Upload tracks in settings!");
      // Open settings bar to direct them
      const bar = document.getElementById('settingsBar');
      if (bar && !bar.classList.contains('open')) toggleSettings();
      return;
    }

    initAudioCtx();
    
    if (isMusicPlaying) {
      // Pause
      if (musicSource) {
        musicOffset += (audioCtx.currentTime - musicStartTime);
        try {
          musicSource.stop();
        } catch (e) {}
        musicSource.disconnect();
        musicSource = null;
      }
      isMusicPlaying = false;
      updateMusicPlayerControlsUI();
      window.showToast("Music paused.");
    } else {
      // Play / Resume
      const track = playlist[currentTrackIdx];
      if (!track) return;
      
      musicSource = audioCtx.createBufferSource();
      musicSource.buffer = track.buffer;
      musicSource.connect(musicGain);
      musicSource.loop = true;
      
      musicStartTime = audioCtx.currentTime;
      musicSource.start(0, musicOffset % track.buffer.duration);
      
      isMusicPlaying = true;
      updateMusicPlayerControlsUI();
      window.showToast("Music playing!");
    }
  };

  window.nextTrack = function () {
    if (playlist.length === 0) return;
    musicOffset = 0;
    let nextIdx = currentTrackIdx + 1;
    if (nextIdx >= playlist.length) nextIdx = 0;
    playTrack(nextIdx);
  };

  window.prevTrack = function () {
    if (playlist.length === 0) return;
    musicOffset = 0;
    let prevIdx = currentTrackIdx - 1;
    if (prevIdx < 0) prevIdx = playlist.length - 1;
    playTrack(prevIdx);
  };

  window.setMusicVolume = function (val) {
    initAudioCtx();
    if (musicGain) {
      musicGain.gain.value = parseFloat(val);
    }
  };

  function updateMusicPlayerControlsUI() {
    const playBtn = document.getElementById('musicPlayBtn');
    const playIcon = document.getElementById('musicIcon');
    const statusDisp = document.getElementById('musicStatus');

    if (!playBtn) return;

    if (isMusicPlaying) {
      playBtn.classList.add('playing');
      playIcon.className = "fas fa-pause";
      statusDisp.textContent = "• playing";
    } else {
      playBtn.classList.remove('playing');
      playIcon.className = "fas fa-play";
      statusDisp.textContent = musicOffset > 0 ? "• paused" : "• idle";
    }
  }

  window.skipMusicPrompt = function () {
    document.getElementById('musicPrompt').classList.add('hidden');
    localStorage.setItem('unihub_skip_music_prompt', 'true');
  };

  // ============================================================
  // FOCUS SOUND MACHINE (Web Audio API Synthesizers)
  // ============================================================
  function stopAmbientSynth() {
    try {
      synthNodes.forEach(function (node) {
        if (node.stop) {
          try { node.stop(); } catch(e) {}
        }
        try { node.disconnect(); } catch(e) {}
      });
      synthNodes = [];
      if (synthCtx && synthCtx.state !== "closed") {
        synthCtx.close();
        synthCtx = null;
      }
    } catch(e) {
      console.warn("Synth cleanup failed:", e);
    }
  }

  function startAmbientSynth() {
    // Check global mute state
    const isMuted = JSON.parse(localStorage.getItem('unihub_muted') || 'false');
    if (isMuted || ambientSound === "none") return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      synthCtx = new AudioCtxClass();

      if (ambientSound === "white_noise") {
        // Low Rain (lowpass white noise)
        const bufferSize = 2 * synthCtx.sampleRate;
        const buffer = synthCtx.createBuffer(1, bufferSize, synthCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const src = synthCtx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        const filter = synthCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 420;

        const gain = synthCtx.createGain();
        gain.gain.value = 0.08;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(synthCtx.destination);

        src.start();
        synthNodes.push(src);

      } else if (ambientSound === "binaural") {
        // Alpha Beats (160Hz and 168Hz oscillator difference)
        const oscL = synthCtx.createOscillator();
        const oscR = synthCtx.createOscillator();
        
        let pannerL = null;
        let pannerR = null;
        try {
          pannerL = synthCtx.createStereoPanner ? synthCtx.createStereoPanner() : null;
          pannerR = synthCtx.createStereoPanner ? synthCtx.createStereoPanner() : null;
        } catch (e) {}

        oscL.frequency.value = 160;
        oscR.frequency.value = 168;

        const gain = synthCtx.createGain();
        gain.gain.value = 0.05;

        if (pannerL && pannerR) {
          pannerL.pan.value = -1;
          pannerR.pan.value = 1;
          oscL.connect(pannerL);
          pannerL.connect(gain);
          oscR.connect(pannerR);
          pannerR.connect(gain);
        } else {
          oscL.connect(gain);
          oscR.connect(gain);
        }

        gain.connect(synthCtx.destination);
        oscL.start();
        oscR.start();
        synthNodes.push(oscL, oscR);

      } else if (ambientSound === "ocean_waves") {
        // Tide Wave (modulated white noise)
        const bufferSize = 4 * synthCtx.sampleRate;
        const buffer = synthCtx.createBuffer(1, bufferSize, synthCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const src = synthCtx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;

        const filter = synthCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 1.1;

        const modulator = synthCtx.createOscillator();
        modulator.frequency.value = 0.08; // Wave frequency

        const modGain = synthCtx.createGain();
        modGain.gain.value = 240;

        const gain = synthCtx.createGain();
        gain.gain.value = 0.15;

        modulator.connect(modGain);
        modGain.connect(filter.frequency);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(synthCtx.destination);

        filter.frequency.setValueAtTime(320, synthCtx.currentTime);
        src.start();
        modulator.start();
        synthNodes.push(src, modulator);
      }
    } catch(e) {
      console.warn("Ambient sound synthesis failed:", e);
    }
  }

  window.selectAmbientSound = function (sound, buttonEl) {
    ambientSound = sound;
    document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
    if (buttonEl) buttonEl.classList.add('active');

    stopAmbientSynth();
    if (sound !== "none") {
      startAmbientSynth();
      window.showToast(`Ambient synthesizer set to: ${sound.replace('_', ' ')} 🍃`);
      window.addActivityLog(`Ambient sound set to ${sound.replace('_', ' ')}.`, 'general');
    }
  };

  // Play C-E-G-C chord alert on timer completions
  function playAlertAudio() {
    const isMuted = JSON.parse(localStorage.getItem('unihub_muted') || 'false');
    if (isMuted) return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();

      const playTone = (frequency, delay, duration) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
        
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration - 0.05);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      // C-E-G-C pristine alert chord
      playTone(523.25, 0, 0.4);
      playTone(659.25, 0.12, 0.4);
      playTone(783.99, 0.24, 0.6);
      playTone(1046.50, 0.36, 0.8);
    } catch(err) {
      console.warn("Alert audio blocked by browser permission.", err);
    }
  }

  // Synchronize dynamic volume changes
  window.addEventListener('unihub_volume_change', function (e) {
    if (e.detail.muted) {
      stopAmbientSynth();
    } else {
      startAmbientSynth();
    }
  });

  // ============================================================
  // POMODORO TIMER LOOP
  // ============================================================
  window.toggleSettings = function () {
    const bar = document.getElementById('settingsBar');
    const toggle = document.getElementById('settingsToggle');
    if (!bar) return;

    const isOpen = bar.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
  };

  window.getFocusMins = function () { return focusMins; };
  window.getShortMins = function () { return shortMins; };
  window.getLongMins  = function () { return longMins; };

  window.applyCustomTimers = function () {
    const fInp = parseInt(document.getElementById('customFocus').value, 10);
    const sInp = parseInt(document.getElementById('customShort').value, 10);
    const lInp = parseInt(document.getElementById('customLong').value, 10);

    if (isNaN(fInp) || fInp < 1 || isNaN(sInp) || sInp < 1 || isNaN(lInp) || lInp < 1) {
      window.showToast("Please enter numbers greater than 0.");
      return;
    }

    focusMins = fInp;
    shortMins = sInp;
    longMins = lInp;

    saveLocalState();
    window.showToast("Timer durations applied successfully!");

    // Update active loop values
    if (!timerRunning) {
      setMode(timeMode, timeMode === 'focus' ? focusMins : timeMode === 'short' ? shortMins : longMins, document.querySelector(`.pill.on`));
    }
  };

  window.resetTimers = function () {
    document.getElementById('customFocus').value = 25;
    document.getElementById('customShort').value = 5;
    document.getElementById('customLong').value = 15;
    applyCustomTimers();
  };

  window.setMode = function (mode, mins, buttonEl) {
    stopTimer();
    timeMode = mode;

    document.querySelectorAll('.pill').forEach(b => b.classList.remove('on'));
    if (buttonEl) buttonEl.classList.add('on');

    totalDuration = mins * 60;
    timeLeft = totalDuration;

    document.getElementById('tMode').textContent = mode === 'focus' ? 'Focus' : mode === 'short' ? 'Short break' : 'Long break';
    updateTimerRingUI();
  };

  function updateTimerRingUI() {
    const disp = document.getElementById('tDisp');
    const ring = document.getElementById('ring');

    const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const s = (timeLeft % 60).toString().padStart(2, "0");
    disp.textContent = `${m}:${s}`;

    // SVG dashoffset animation
    const offset = CIRCUMFERENCE * (1 - (timeLeft / totalDuration));
    if (ring) {
      ring.style.strokeDasharray = CIRCUMFERENCE;
      ring.style.strokeDashoffset = offset.toFixed(2);
      
      // Update color based on mode
      if (timeMode === 'focus') {
        ring.style.stroke = 'var(--accent-blue)';
      } else {
        ring.style.stroke = 'var(--accent-emerald)';
      }
    }
  }

  function startTimer() {
    if (timerRunning) return;
    
    // Web Audio auto-resume policies
    if (synthCtx && synthCtx.state === "suspended") synthCtx.resume();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

    timerRunning = true;
    updateStartBtnUI();

    timerInterval = setInterval(function () {
      if (timeLeft <= 1) {
        handleSessionFinished();
      } else {
        timeLeft--;
        updateTimerRingUI();
      }
    }, 1000);
  }

  function stopTimer() {
    timerRunning = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    updateStartBtnUI();
  }

  window.toggleTimer = function () {
    if (timerRunning) {
      stopTimer();
      window.showToast("Timer paused.");
    } else {
      startTimer();
      window.showToast("Timer started!");
    }
  };

  window.resetTimer = function () {
    stopTimer();
    const mins = timeMode === 'focus' ? focusMins : timeMode === 'short' ? shortMins : longMins;
    timeLeft = mins * 60;
    updateTimerRingUI();
    window.showToast("Timer reset.");
  };

  function updateStartBtnUI() {
    const btn = document.getElementById('startBtn');
    const icon = document.getElementById('startIcon');
    const txt = document.getElementById('startTxt');
    
    if (timerRunning) {
      btn.classList.add('running');
      icon.className = "fas fa-pause";
      txt.textContent = "Pause";
    } else {
      btn.classList.remove('running');
      icon.className = "fas fa-play";
      txt.textContent = "Start";
    }
  }

  function handleSessionFinished() {
    stopTimer();
    playAlertAudio();

    const popupOverlay = document.getElementById('timerPopup');
    const popupTitle = document.getElementById('popupTitle');
    const popupDesc = document.getElementById('popupDesc');

    if (timeMode === 'focus') {
      sessionsCycle++;
      totalSessions++;
      minutesFocused += focusMins;
      focusXp += 100;

      // Update cycle indicators
      const dotIdx = (sessionsCycle - 1) % 4;
      const dots = document.querySelectorAll('#dotRow .dot');
      if (dots[dotIdx]) {
        dots[dotIdx].classList.add('done');
        dots[dotIdx].classList.remove('cur');
      }

      window.addActivityLog(`🍅 Pomodoro completed successfully (+100 Focus XP)`, 'timer');

      if (popupTitle) popupTitle.textContent = "🍅 Focus Cycle Completed!";
      if (popupDesc) popupDesc.textContent = `Excellent job! You've successfully finished a ${focusMins} minute study block. Focus XP updated (+100 XP). Take a breather!`;

      // Set up next step suggestions
      const isFourth = sessionsCycle % 4 === 0;
      const nextPill = document.querySelectorAll('.pills button')[isFourth ? 2 : 1];
      const nextMins = isFourth ? longMins : shortMins;
      const nextMode = isFourth ? 'long' : 'short';

      // Attach dynamic continuation logic
      window.continueNextMode = function () {
        setMode(nextMode, nextMins, nextPill);
        startTimer();
      };
      
    } else {
      // Break done
      window.addActivityLog(`☕ Rest break block completed.`, 'timer');

      if (popupTitle) popupTitle.textContent = "💪 Break Completed!";
      if (popupDesc) popupDesc.textContent = "Break timer finished. Ready to jump back in?";

      const focusPill = document.querySelectorAll('.pills button')[0];
      window.continueNextMode = function () {
        setMode('focus', focusMins, focusPill);
        startTimer();
      };
    }

    if (popupOverlay) popupOverlay.classList.add('active');
    updateMiniStatsUI();
    saveLocalState();
  }

  window.closeTimerPopup = function () {
    const overlay = document.getElementById('timerPopup');
    if (overlay) overlay.classList.remove('active');
    
    // Auto initiate next suggested mode if continues clicked
    if (window.continueNextMode) {
      window.continueNextMode();
      window.continueNextMode = null;
    }
  };

  // ============================================================
  // TASK CHECKLIST MANAGER
  // ============================================================
  window.toggleCustomTagInput = function (val) {
    const customInp = document.getElementById('customTagInput');
    if (customInp) {
      customInp.style.display = val === 'custom' ? 'block' : 'none';
      if (val === 'custom') customInp.focus();
    }
  };

  window.addTask = function () {
    const tinp = document.getElementById('tInp');
    const select = document.getElementById('tagSelect');
    const customInp = document.getElementById('customTagInput');
    const dateInp = document.getElementById('taskDueDate');

    const text = tinp.value.trim();
    if (!text) return;

    let tag = select.value;
    let customText = "";
    if (tag === 'custom') {
      customText = customInp.value.trim() || 'Custom';
    }
    const dueDate = dateInp.value; // can be empty string if not set

    const newTask = {
      id: "task_" + Date.now(),
      text: text,
      tag: tag,
      customText: customText,
      due: dueDate,
      done: false
    };

    tasks.push(newTask);
    tinp.value = '';
    dateInp.value = '';
    customInp.value = '';
    customInp.style.display = 'none';
    select.value = 'math';

    saveLocalState();
    renderTasks();
    updateMiniStatsUI();

    window.showToast("Study objective added!");
    window.addActivityLog(`Task '${text}' added to list.`, 'task');
  };

  window.deleteTask = function (id) {
    const task = tasks.find(t => t.id === id);
    tasks = tasks.filter(t => t.id !== id);
    saveLocalState();
    renderTasks();
    updateMiniStatsUI();

    window.showToast("Objective removed.");
    if (task) {
      window.addActivityLog(`Task '${task.text}' removed.`, 'task');
    }
  };

  window.toggleTaskCompleted = function (id) {
    tasks = tasks.map(function (t) {
      if (t.id === id) {
        const completed = !t.done;
        // Gamification points XP adjustments (+50 XP for check)
        focusXp = Math.max(0, focusXp + (completed ? 50 : -50));
        
        if (completed) {
          window.showToast("Task completed! XP points updated (+50 XP) 🔥");
          window.addActivityLog(`✅ Completed task '${t.text}' (+50 XP)`, 'task');
        } else {
          window.showToast("Task marked as uncompleted.");
        }
        return { ...t, done: completed, completed: completed };
      }
      return t;
    });

    saveLocalState();
    renderTasks();
    updateMiniStatsUI();
  };

  // Inline edit functions
  window.editTask = function (id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;
    tasks[index].isEditing = true;
    renderTasks();
  };

  window.saveTaskEdit = function (id, inputEl, selectEl, dateEl) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;

    const newText = inputEl.value.trim();
    if (!newText) return;

    tasks[index].text = newText;
    tasks[index].tag = selectEl.value;
    tasks[index].due = dateEl ? dateEl.value : tasks[index].due;
    tasks[index].isEditing = false;

    saveLocalState();
    renderTasks();
    window.showToast("Changes saved.");
  };

  window.cancelTaskEdit = function (id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;
    tasks[index].isEditing = false;
    renderTasks();
  };

  function renderTasks() {
    const list = document.getElementById('tList');
    const pbWrap = document.getElementById('pbWrap');
    const pbLabel = document.getElementById('pbLabel');
    const pbFill = document.getElementById('pbFill');

    if (!list) return;

    if (tasks.length === 0) {
      list.innerHTML = `<div class="empty-t"><i class="fas fa-tasks" style="font-size:1.8rem;opacity:0.25;display:block;margin-bottom:8px;"></i>No objectives created for this session.</div>`;
      if (pbWrap) pbWrap.style.display = "none";
      return;
    }

    // Render list
    list.innerHTML = '';
    tasks.forEach(function (t) {
      const item = document.createElement('div');
      item.className = 'ti' + (t.done ? ' done-t' : '');

      if (t.isEditing) {
        item.innerHTML = `
          <div class="ti-edit-wrap">
            <input type="text" class="ti-edit-inp" value="${escapeHtml(t.text)}">
            <input type="date" class="ti-edit-date" value="${t.due || ''}">
            <select class="ti-edit-sel">
              <option value="math" ${t.tag==='math'?'selected':''}>Maths</option>
              <option value="sci" ${t.tag==='sci'?'selected':''}>Science</option>
              <option value="eng" ${t.tag==='eng'?'selected':''}>English</option>
              <option value="gen" ${t.tag==='gen'?'selected':''}>General</option>
              <option value="custom" ${t.tag==='custom'?'selected':''}>Custom</option>
            </select>
            <button class="ti-save-btn">Save</button>
            <button class="ti-cancel-btn">Cancel</button>
          </div>
        `;
        const save = item.querySelector('.ti-save-btn');
        const cancel = item.querySelector('.ti-cancel-btn');
        const inp = item.querySelector('.ti-edit-inp');
        const sel = item.querySelector('.ti-edit-sel');
        const date = item.querySelector('.ti-edit-date');

        save.addEventListener('click', () => saveTaskEdit(t.id, inp, sel, date));
        cancel.addEventListener('click', () => cancelTaskEdit(t.id));
      } else {
        const tagClass = TAG_CLASSES[t.tag] || 'tg-gen';
        const tagText = t.tag === 'custom' ? (t.customText || 'Custom') : (TAG_LABELS[t.tag] || 'General');

        item.innerHTML = `
          <button class="chk${t.done?' on':''}" onclick="toggleTaskCompleted('${t.id}')">
            ${t.done ? '<i class="fas fa-check"></i>' : ''}
          </button>
          <span class="ttx">${escapeHtml(t.text)}</span>
          <span class="ttag ${tagClass}">${escapeHtml(tagText)}</span>
          ${t.due ? `<span class="tdate">Due: ${t.due}</span>` : ''}
          <button class="tedit" onclick="editTask('${t.id}')" title="Edit text"><i class="fas fa-pen"></i></button>
          <button class="tdel" onclick="deleteTask('${t.id}')" title="Remove"><i class="fas fa-trash"></i></button>
        `;
      }
      list.appendChild(item);
    });

    // Update Progress Bars
    const total = tasks.length;
    const completed = tasks.filter(t => t.done).length;
    if (pbWrap) {
      pbWrap.style.display = "block";
      pbLabel.textContent = `${completed} / ${total} resolved`;
      const pct = Math.round((completed / total) * 100);
      pbFill.style.width = `${pct}%`;
    }
  }

  // ============================================================
  // SESSION NOTES WRITER
  // ============================================================
  window.saveNote = function () {
    const val = document.getElementById('sessionNote').value;
    localStorage.setItem('unihub_sessionNote', val);
    window.showToast("Session notes saved!");
    window.addActivityLog('Session notes saved to storage.', 'general');
  };

  // Auto save notes on text typing keyups
  let notesTimeout = null;
  const notesTextarea = document.getElementById('sessionNote');
  if (notesTextarea) {
    notesTextarea.addEventListener('keyup', function () {
      clearTimeout(notesTimeout);
      notesTimeout = setTimeout(function () {
        localStorage.setItem('unihub_sessionNote', notesTextarea.value);
      }, 1000);
    });
  }

  // ============================================================
  // STREAK XP CARD CLAIM WIDGET
  // ============================================================
  const streakCard = document.getElementById('streak-card');

  // Visually lock the claim button to a "Claimed" state
  function setClaimButtonClaimed(btn) {
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Claimed Today';
    btn.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))';
    btn.style.color = 'var(--accent-emerald)';
    btn.style.border = '1px solid rgba(16,185,129,0.3)';
    btn.style.cursor = 'default';
  }

  function handleClaimStreak(e) {
    // Only fire when the claim button itself is clicked
    const btn = document.getElementById('claim-streak-btn');
    if (!btn || btn.disabled) return;
    if (e && e.target && !e.target.closest('#claim-streak-btn')) return;

    // Once-a-day guard
    const todayStr = new Date().toDateString();
    const lastClaim = localStorage.getItem('unihub_last_xp_claim');
    if (lastClaim === todayStr) {
      window.showToast('You have already claimed your daily bonus today! Come back tomorrow. 📅');
      setClaimButtonClaimed(btn);
      return;
    }

    // Award XP and update streak
    streakDays++;
    focusXp += 150;

    // Persist claim date
    localStorage.setItem('unihub_last_xp_claim', todayStr);

    saveLocalState();
    updateMiniStatsUI();

    window.showToast('🔥 Daily Streak Bonus claimed! +150 Focus XP');
    window.addActivityLog(`🌟 Daily Streak claimed! Streak is now ${streakDays} days (+150 XP)`, 'streak');

    // Lock the button for the rest of the day
    setClaimButtonClaimed(btn);
  }

  if (streakCard) {
    streakCard.addEventListener('click', handleClaimStreak);
  }

  // ============================================================
  // GUIDES MODAL POPUP
  // ============================================================
  window.showTipModal = function (key) {
    const tip = GUIDES[key];
    if (!tip) return;

    document.getElementById('guide-modal-icon').innerHTML = tip.icon;
    document.getElementById('guide-modal-title').textContent = tip.title;
    document.getElementById('guide-modal-desc').textContent = tip.desc;

    const pointsList = document.getElementById('guide-modal-points');
    pointsList.innerHTML = tip.points.map(pt => `
      <div class="modal-point-item">
        <div class="modal-point-dot"></div>
        <p class="modal-point-text">${escapeHtml(pt)}</p>
      </div>
    `).join('');

    document.getElementById('guide-modal-overlay').classList.add('show');
  };

  window.closeTipModal = function () {
    document.getElementById('guide-modal-overlay').classList.remove('show');
  };

  // Close guides modal when clicking backdrop overlay
  const guideOverlay = document.getElementById('guide-modal-overlay');
  if (guideOverlay) {
    guideOverlay.addEventListener('click', function (e) {
      if (e.target === guideOverlay) closeTipModal();
    });
  }

  // ============================================================
  // OVERLAYS CONFIRM PURGES
  // ============================================================
  window.showResetConfirm = function (action) {
    currentConfirmAction = action;
    const overlay = document.getElementById('confirmOverlay');
    const title = document.getElementById('confirmTitle');
    const desc = document.getElementById('confirmDesc');
    const yesBtn = document.getElementById('confirmYesBtn');

    if (action === 'tasks') {
      title.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:var(--accent-rose);"></i> Reset all tasks?';
      desc.textContent = "This will delete all objectives and reset your daily checklist tracker.";
      yesBtn.className = "btn-confirm-yes";
      yesBtn.textContent = "Yes, reset tasks";
    } else if (action === 'notes') {
      title.innerHTML = '<i class="fas fa-trash-alt" style="color:var(--accent-orange);"></i> Clear session notes?';
      desc.textContent = "This will wipe the current text area. Deleted text cannot be retrieved.";
      yesBtn.className = "btn-confirm-yes note-clear";
      yesBtn.textContent = "Yes, clear note";
    }

    if (overlay) overlay.classList.add('active');
  };

  window.closeConfirm = function () {
    const overlay = document.getElementById('confirmOverlay');
    if (overlay) overlay.classList.remove('active');
    currentConfirmAction = null;
  };

  window.executeConfirm = function () {
    if (currentConfirmAction === 'tasks') {
      tasks = [];
      saveLocalState();
      renderTasks();
      updateMiniStatsUI();
      window.showToast("Checklist purged.");
      window.addActivityLog('All checklist tasks cleared.', 'task');
    } else if (currentConfirmAction === 'notes') {
      const notesArea = document.getElementById('sessionNote');
      if (notesArea) notesArea.value = '';
      localStorage.setItem('unihub_sessionNote', '');
      window.showToast("Note cleared.");
      window.addActivityLog('Notes pad cleared.', 'general');
    }
    closeConfirm();
  };

  // ============================================================
  // AMBIENT MOTIVATIONAL QUOTES ROTATOR
  // ============================================================
  function rotateQuote() {
    const box = document.getElementById('quoteBox');
    if (!box) return;

    box.classList.add('fade');
    setTimeout(function () {
      const idx = Math.floor(Math.random() * QUOTES.length);
      box.textContent = QUOTES[idx];
      box.classList.remove('fade');
    }, 400);
  }
  setInterval(rotateQuote, 10000);

  // ============================================================
  // LOAD DATABASE & INITIATE
  // ============================================================
  document.addEventListener('DOMContentLoaded', function () {
    initDB(function () {
      loadTracksFromDB(function (tracks) {
        playlist = tracks;
        
        // Dynamic prompt display if playlist empty and prompt not skipped
        const promptSkipped = localStorage.getItem('unihub_skip_music_prompt') === 'true';
        const promptBox = document.getElementById('musicPrompt');
        if (promptBox) {
          if (playlist.length === 0 && !promptSkipped) {
            promptBox.classList.remove('hidden');
          } else {
            promptBox.classList.add('hidden');
          }
        }

        updatePlaylistUI();
      });
    });

    loadLocalState();
  });
}());
