/**
 * Cadence — Minimalist Timekeeper (Clock, Timer, Stopwatch)
 * Crafted in Anthropic's editorial minimalist aesthetic
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  class ChimeAudio {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('cadence_sound_enabled') !== 'false';
      this.initListener = this.init.bind(this);
      window.addEventListener('click', this.initListener, { once: true });
      window.addEventListener('keydown', this.initListener, { once: true });
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('cadence_sound_enabled', this.enabled);
      if (this.enabled) {
        this.playTone(880, 0.15, 0.04); // Brief subtle feedback click
      }
      return this.enabled;
    }

    playTone(freq, duration, gainLevel = 0.1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gainLevel, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    }

    playChime() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      // Luxurious two-stage warm chime chord (C5 + G5 -> E6 + C6)
      const now = this.ctx.currentTime;

      // Note 1: F5 + C6
      this.triggerHarmonicNote(698.46, now, 1.8, 0.14);
      this.triggerHarmonicNote(1046.5, now, 1.4, 0.08);

      // Note 2: A5 + F6 (delayed by 260ms)
      this.triggerHarmonicNote(880.00, now + 0.26, 2.2, 0.15);
      this.triggerHarmonicNote(1396.9, now + 0.26, 1.6, 0.09);
    }

    triggerHarmonicNote(freq, startTime, duration, volume) {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  const audio = new ChimeAudio();

  // --- APP STATE ---
  let activeTab = 'clock';
  let is24Hour = localStorage.getItem('cadence_is_24h') !== 'false';
  let isZenMode = false;

  // --- DOM ELEMENTS ---
  const tabs = document.querySelectorAll('.nav-btn');
  const panels = {
    clock: document.getElementById('panel-clock'),
    timer: document.getElementById('panel-timer'),
    stopwatch: document.getElementById('panel-stopwatch')
  };

  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const iconSoundOn = document.querySelector('.icon-sound-on');
  const iconSoundOff = document.querySelector('.icon-sound-off');
  const btnZenMode = document.getElementById('btn-zen-mode');

  // Clock DOM
  const clockTimeEl = document.getElementById('clock-time');
  const clockPeriodEl = document.getElementById('clock-period');
  const clockDateEl = document.getElementById('clock-date');
  const clockTimezoneEl = document.getElementById('clock-timezone');
  const btnFormatToggle = document.getElementById('btn-format-toggle');
  const formatLabelEl = document.getElementById('format-label');

  // World Clocks DOM
  const tzTimeSfo = document.getElementById('tz-time-sfo');
  const tzOffsetSfo = document.getElementById('tz-offset-sfo');
  const tzTimeNyc = document.getElementById('tz-time-nyc');
  const tzOffsetNyc = document.getElementById('tz-offset-nyc');
  const tzTimeLon = document.getElementById('tz-time-lon');
  const tzOffsetLon = document.getElementById('tz-offset-lon');
  const tzTimeTyo = document.getElementById('tz-time-tyo');
  const tzOffsetTyo = document.getElementById('tz-offset-tyo');

  // Timer DOM
  const timerRing = document.getElementById('timer-ring');
  const timerDigits = document.getElementById('timer-digits');
  const timerStatusHint = document.getElementById('timer-status-hint');
  const timerInputs = document.getElementById('timer-inputs');
  const inputHours = document.getElementById('input-hours');
  const inputMinutes = document.getElementById('input-minutes');
  const inputSeconds = document.getElementById('input-seconds');
  const timerPresets = document.querySelectorAll('.preset-pill');
  const btnTimerToggle = document.getElementById('btn-timer-toggle');
  const btnTimerReset = document.getElementById('btn-timer-reset');
  const btnTimerAdd = document.getElementById('btn-timer-add');
  const timerDialContainer = document.getElementById('timer-dial-container');

  // Stopwatch DOM
  const swMainEl = document.getElementById('sw-main');
  const swMsEl = document.getElementById('sw-ms');
  const btnSwToggle = document.getElementById('btn-sw-toggle');
  const btnSwReset = document.getElementById('btn-sw-reset');
  const btnSwLap = document.getElementById('btn-sw-lap');
  const lapsListEl = document.getElementById('laps-list');

  // --- TAB NAVIGATION ---
  function switchTab(tabKey) {
    if (!panels[tabKey]) return;
    activeTab = tabKey;

    tabs.forEach(btn => {
      const isSelected = btn.dataset.tab === tabKey;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    Object.keys(panels).forEach(key => {
      panels[key].classList.toggle('active', key === tabKey);
    });

    updateDocumentTitle();
  }

  tabs.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // --- AUDIO TOGGLE UI ---
  function updateAudioIcon() {
    if (audio.enabled) {
      iconSoundOn.classList.remove('hidden');
      iconSoundOff.classList.add('hidden');
      btnSoundToggle.title = 'Mute chime';
    } else {
      iconSoundOn.classList.add('hidden');
      iconSoundOff.classList.remove('hidden');
      btnSoundToggle.title = 'Unmute chime';
    }
  }
  updateAudioIcon();

  btnSoundToggle.addEventListener('click', () => {
    audio.toggle();
    updateAudioIcon();
  });

  // --- ZEN / FULLSCREEN MODE ---
  btnZenMode.addEventListener('click', toggleZenMode);

  function toggleZenMode() {
    isZenMode = !isZenMode;
    document.body.classList.toggle('zen-mode', isZenMode);

    if (isZenMode) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isZenMode) {
      isZenMode = false;
      document.body.classList.remove('zen-mode');
    }
  });

  // --- 1. CLOCK LOGIC ---
  function updateClock() {
    const now = new Date();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    let period = '';

    if (!is24Hour) {
      period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
    }

    const hoursFormatted = is24Hour ? String(hours).padStart(2, '0') : String(hours);
    clockTimeEl.textContent = `${hoursFormatted}:${minutes}:${seconds}`;
    clockPeriodEl.textContent = period;

    // Date formatting: e.g. "Sunday, September 13, 2026"
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    clockDateEl.textContent = new Intl.DateTimeFormat('en-US', dateOptions).format(now);

    // Update World Clocks
    updateWorldClocks(now);

    if (activeTab === 'clock') {
      updateDocumentTitle();
    }
  }

  function getLocalTimezoneInfo() {
    try {
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offsetMinutes = -new Date().getTimezoneOffset();
      const offsetHours = offsetMinutes / 60;
      const sign = offsetHours >= 0 ? '+' : '';
      return `${tzName.replace(/_/g, ' ')} (UTC${sign}${offsetHours})`;
    } catch {
      return 'Local Time';
    }
  }

  clockTimezoneEl.textContent = getLocalTimezoneInfo();

  btnFormatToggle.addEventListener('click', () => {
    is24Hour = !is24Hour;
    localStorage.setItem('cadence_is_24h', is24Hour);
    formatLabelEl.textContent = is24Hour ? '24H' : '12H';
    updateClock();
  });
  formatLabelEl.textContent = is24Hour ? '24H' : '12H';

  function formatTimeForZone(date, timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: !is24Hour,
        hour: is24Hour ? '2-digit' : 'numeric',
        minute: '2-digit'
      });
      return formatter.format(date);
    } catch {
      return '--:--';
    }
  }

  function calculateOffsetString(timeZone) {
    try {
      const now = new Date();
      // Target time in zone
      const targetString = now.toLocaleString('en-US', { timeZone });
      const targetDate = new Date(targetString);
      // Local time
      const localString = now.toLocaleString('en-US');
      const localDate = new Date(localString);

      const diffHours = Math.round((targetDate - localDate) / (1000 * 60 * 60));
      if (diffHours === 0) return 'Same time';
      return diffHours > 0 ? `+${diffHours}h` : `${diffHours}h`;
    } catch {
      return '';
    }
  }

  function updateWorldClocks(now) {
    tzTimeSfo.textContent = formatTimeForZone(now, 'America/Los_Angeles');
    tzOffsetSfo.textContent = calculateOffsetString('America/Los_Angeles');

    tzTimeNyc.textContent = formatTimeForZone(now, 'America/New_York');
    tzOffsetNyc.textContent = calculateOffsetString('America/New_York');

    tzTimeLon.textContent = formatTimeForZone(now, 'Europe/London');
    tzOffsetLon.textContent = calculateOffsetString('Europe/London');

    tzTimeTyo.textContent = formatTimeForZone(now, 'Asia/Tokyo');
    tzOffsetTyo.textContent = calculateOffsetString('Asia/Tokyo');
  }

  setInterval(updateClock, 1000);
  updateClock();

  // --- 2. TIMER LOGIC ---
  const RING_RADIUS = 150;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // 942.477

  timerRing.style.strokeDasharray = `${RING_CIRCUMFERENCE}`;
  timerRing.style.strokeDashoffset = '0';

  let timerDurationSec = 300; // 5 minutes default
  let timerRemainingMs = timerDurationSec * 1000;
  let timerState = 'ready'; // 'ready' | 'running' | 'paused' | 'completed'
  let timerEndTime = 0;
  let timerIntervalId = null;
  let isEditingTimer = false;

  function setRingProgress(ratio) {
    // ratio is 1.0 (full remaining) to 0.0 (done)
    const offset = RING_CIRCUMFERENCE * (1 - Math.max(0, Math.min(1, ratio)));
    timerRing.style.strokeDashoffset = `${offset}`;
  }

  function formatTimerDigits(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const padM = String(mins).padStart(2, '0');
    const padS = String(secs).padStart(2, '0');

    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${padM}:${padS}`;
    }
    return `${padM}:${padS}`;
  }

  function renderTimer() {
    const totalRemainingSec = Math.ceil(timerRemainingMs / 1000);
    timerDigits.textContent = formatTimerDigits(totalRemainingSec);

    const ratio = timerDurationSec > 0 ? (timerRemainingMs / (timerDurationSec * 1000)) : 0;
    setRingProgress(ratio);

    if (timerState === 'running') {
      timerStatusHint.textContent = 'Counting down';
      btnTimerToggle.textContent = 'Pause';
      btnTimerReset.disabled = false;
      timerRing.classList.remove('ring-completed');
    } else if (timerState === 'paused') {
      timerStatusHint.textContent = 'Paused';
      btnTimerToggle.textContent = 'Resume';
      btnTimerReset.disabled = false;
      timerRing.classList.remove('ring-completed');
    } else if (timerState === 'completed') {
      timerStatusHint.textContent = 'Time’s up!';
      btnTimerToggle.textContent = 'Start';
      btnTimerReset.disabled = false;
      timerRing.classList.add('ring-completed');
    } else {
      timerStatusHint.textContent = 'Ready';
      btnTimerToggle.textContent = 'Start';
      btnTimerReset.disabled = timerRemainingMs === timerDurationSec * 1000;
      timerRing.classList.remove('ring-completed');
    }

    if (activeTab === 'timer') {
      updateDocumentTitle();
    }
  }

  function startTimer() {
    if (timerRemainingMs <= 0) {
      timerRemainingMs = timerDurationSec * 1000;
    }
    if (timerRemainingMs <= 0) return;

    timerEndTime = performance.now() + timerRemainingMs;
    timerState = 'running';
    exitTimerEditMode(false);

    clearInterval(timerIntervalId);
    timerIntervalId = setInterval(tickTimer, 100);
    renderTimer();
  }

  function pauseTimer() {
    if (timerState !== 'running') return;
    clearInterval(timerIntervalId);
    timerRemainingMs = Math.max(0, timerEndTime - performance.now());
    timerState = 'paused';
    renderTimer();
  }

  function resetTimer() {
    clearInterval(timerIntervalId);
    timerState = 'ready';
    timerRemainingMs = timerDurationSec * 1000;
    renderTimer();
  }

  function tickTimer() {
    const now = performance.now();
    timerRemainingMs = Math.max(0, timerEndTime - now);

    if (timerRemainingMs <= 0) {
      clearInterval(timerIntervalId);
      timerRemainingMs = 0;
      timerState = 'completed';
      renderTimer();
      audio.playChime();
    } else {
      renderTimer();
    }
  }

  function addTimeToTimer(secondsToAdd) {
    if (timerState === 'completed') {
      timerRemainingMs = secondsToAdd * 1000;
      timerDurationSec = secondsToAdd;
      startTimer();
      return;
    }

    timerRemainingMs += secondsToAdd * 1000;
    timerDurationSec += secondsToAdd;
    if (timerState === 'running') {
      timerEndTime += secondsToAdd * 1000;
    }
    renderTimer();
  }

  btnTimerToggle.addEventListener('click', () => {
    if (timerState === 'running') {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  btnTimerReset.addEventListener('click', resetTimer);
  btnTimerAdd.addEventListener('click', () => addTimeToTimer(60));

  // Presets
  timerPresets.forEach(presetBtn => {
    presetBtn.addEventListener('click', () => {
      const minutes = parseInt(presetBtn.dataset.minutes, 10);
      if (isNaN(minutes)) return;

      timerPresets.forEach(b => b.classList.remove('active'));
      presetBtn.classList.add('active');

      clearInterval(timerIntervalId);
      timerDurationSec = minutes * 60;
      timerRemainingMs = timerDurationSec * 1000;
      timerState = 'ready';
      exitTimerEditMode(false);
      renderTimer();
    });
  });

  // Direct Input / Edit Mode
  function enterTimerEditMode() {
    if (timerState === 'running') return;
    isEditingTimer = true;

    const totalSec = Math.ceil(timerRemainingMs / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    inputHours.value = hrs;
    inputMinutes.value = mins;
    inputSeconds.value = secs;

    timerDigits.classList.add('hidden');
    timerInputs.classList.remove('hidden');
    inputMinutes.focus();
    inputMinutes.select();
  }

  function exitTimerEditMode(applyChanges = true) {
    if (!isEditingTimer) return;
    isEditingTimer = false;

    if (applyChanges) {
      const h = Math.max(0, parseInt(inputHours.value, 10) || 0);
      const m = Math.max(0, Math.min(59, parseInt(inputMinutes.value, 10) || 0));
      const s = Math.max(0, Math.min(59, parseInt(inputSeconds.value, 10) || 0));

      const newTotal = h * 3600 + m * 60 + s;
      if (newTotal > 0) {
        timerDurationSec = newTotal;
        timerRemainingMs = newTotal * 1000;
        timerState = 'ready';
        timerPresets.forEach(b => b.classList.remove('active'));
      }
    }

    timerInputs.classList.add('hidden');
    timerDigits.classList.remove('hidden');
    renderTimer();
  }

  timerDigits.addEventListener('click', enterTimerEditMode);

  [inputHours, inputMinutes, inputSeconds].forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        exitTimerEditMode(true);
      } else if (e.key === 'Escape') {
        exitTimerEditMode(false);
      }
    });
    input.addEventListener('blur', () => {
      // Delay slightly so focus between inputs doesn't prematurely trigger exit
      setTimeout(() => {
        if (!timerInputs.contains(document.activeElement)) {
          exitTimerEditMode(true);
        }
      }, 100);
    });
  });

  renderTimer();

  // --- 3. STOPWATCH LOGIC ---
  let swStartTime = 0;
  let swElapsedMs = 0;
  let swRunning = false;
  let swAnimFrameId = null;
  let laps = []; // { lapIndex, lapDuration, overallTime }
  let lastLapTimestamp = 0;

  function formatSwComponents(totalMs) {
    const totalCentis = Math.floor(totalMs / 10);
    const cs = totalCentis % 100;
    const totalSecs = Math.floor(totalCentis / 100);
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60);

    const padM = String(mins).padStart(2, '0');
    const padS = String(secs).padStart(2, '0');
    const padCs = String(cs).padStart(2, '0');

    return {
      main: `${padM}:${padS}`,
      cs: `.${padCs}`,
      formatted: `${padM}:${padS}.${padCs}`
    };
  }

  function renderStopwatch() {
    const { main, cs } = formatSwComponents(swElapsedMs);
    swMainEl.textContent = main;
    swMsEl.textContent = cs;

    if (swRunning) {
      btnSwToggle.textContent = 'Pause';
      btnSwReset.disabled = false;
      btnSwLap.disabled = false;
    } else {
      btnSwToggle.textContent = 'Start';
      btnSwReset.disabled = swElapsedMs === 0;
      btnSwLap.disabled = true;
    }

    if (activeTab === 'stopwatch') {
      updateDocumentTitle();
    }
  }

  function swLoop() {
    if (!swRunning) return;
    const now = performance.now();
    swElapsedMs = now - swStartTime;
    renderStopwatch();
    swAnimFrameId = requestAnimationFrame(swLoop);
  }

  function startStopwatch() {
    if (swRunning) return;
    swStartTime = performance.now() - swElapsedMs;
    swRunning = true;
    swLoop();
  }

  function pauseStopwatch() {
    if (!swRunning) return;
    swRunning = false;
    cancelAnimationFrame(swAnimFrameId);
    renderStopwatch();
  }

  function resetStopwatch() {
    pauseStopwatch();
    swElapsedMs = 0;
    laps = [];
    lastLapTimestamp = 0;
    renderStopwatch();
    renderLaps();
  }

  function recordLap() {
    if (!swRunning) return;

    const currentTotal = swElapsedMs;
    const lapDuration = currentTotal - lastLapTimestamp;
    lastLapTimestamp = currentTotal;

    laps.unshift({
      lapIndex: laps.length + 1,
      lapDuration,
      overallTime: currentTotal
    });

    renderLaps();
  }

  function renderLaps() {
    if (laps.length === 0) {
      lapsListEl.innerHTML = '<div class="laps-empty">No laps recorded</div>';
      return;
    }

    let fastestIndex = -1;
    let slowestIndex = -1;

    if (laps.length >= 2) {
      let minDur = Infinity;
      let maxDur = -Infinity;

      laps.forEach((lap, idx) => {
        if (lap.lapDuration < minDur) {
          minDur = lap.lapDuration;
          fastestIndex = idx;
        }
        if (lap.lapDuration > maxDur) {
          maxDur = lap.lapDuration;
          slowestIndex = idx;
        }
      });
    }

    lapsListEl.innerHTML = laps.map((lap, idx) => {
      let rowClass = 'lap-row';
      if (idx === fastestIndex) rowClass += ' fastest';
      else if (idx === slowestIndex) rowClass += ' slowest';

      const splitFormatted = formatSwComponents(lap.lapDuration).formatted;
      const overallFormatted = formatSwComponents(lap.overallTime).formatted;

      return `
        <div class="${rowClass}">
          <span class="lap-num">#${String(lap.lapIndex).padStart(2, '0')}</span>
          <span class="lap-split">${splitFormatted}</span>
          <span class="lap-total">${overallFormatted}</span>
        </div>
      `;
    }).join('');
  }

  btnSwToggle.addEventListener('click', () => {
    if (swRunning) {
      pauseStopwatch();
    } else {
      startStopwatch();
    }
  });

  btnSwReset.addEventListener('click', resetStopwatch);
  btnSwLap.addEventListener('click', recordLap);

  renderStopwatch();

  // --- DOCUMENT TITLE MANAGEMENT ---
  function updateDocumentTitle() {
    if (activeTab === 'timer' && (timerState === 'running' || timerState === 'paused' || timerState === 'completed')) {
      const remainingSec = Math.ceil(timerRemainingMs / 1000);
      const symbol = timerState === 'running' ? '⏳' : timerState === 'paused' ? '⏸️' : '🔔';
      document.title = `(${formatTimerDigits(remainingSec)}) ${symbol} Timer — Cadence`;
    } else if (activeTab === 'stopwatch' && swElapsedMs > 0) {
      const { formatted } = formatSwComponents(swElapsedMs);
      const symbol = swRunning ? '⏱️' : '⏸️';
      document.title = `(${formatted}) ${symbol} Stopwatch — Cadence`;
    } else {
      document.title = 'Cadence — Minimalist Timekeeper';
    }
  }

  // --- KEYBOARD SHORTCUTS ---
  window.addEventListener('keydown', (e) => {
    // Ignore hotkeys when typing in direct timer input
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
      return;
    }

    // Number keys 1, 2, 3 to switch modes
    if (e.key === '1') {
      switchTab('clock');
    } else if (e.key === '2') {
      switchTab('timer');
    } else if (e.key === '3') {
      switchTab('stopwatch');
    } else if (e.code === 'Space') {
      e.preventDefault();
      if (activeTab === 'timer') {
        if (timerState === 'running') pauseTimer();
        else startTimer();
      } else if (activeTab === 'stopwatch') {
        if (swRunning) pauseStopwatch();
        else startStopwatch();
      }
    } else if (e.key === 'r' || e.key === 'R') {
      if (activeTab === 'timer') {
        resetTimer();
      } else if (activeTab === 'stopwatch') {
        resetStopwatch();
      }
    } else if (e.key === 'l' || e.key === 'L') {
      if (activeTab === 'stopwatch' && swRunning) {
        recordLap();
      }
    } else if (e.key === 'f' || e.key === 'F') {
      toggleZenMode();
    }
  });

})();
