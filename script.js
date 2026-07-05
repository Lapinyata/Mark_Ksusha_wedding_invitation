(function () {
  'use strict';

  const WEDDING_DATE = new Date('2026-09-06T15:00:00+03:00');
  const WEDDING_DAY = 6;

  let countdownRunner = null;
  let countdownTriggered = false;

  /* ── Calendar ── */
  function buildCalendar() {
    const container = document.getElementById('calendar-days');
    if (!container) return;

    const year = 2026;
    const month = 8; // September (0-indexed)
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-start
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';

    for (let i = 0; i < offset; i++) {
      html += '<span class="calendar__day calendar__day--empty"></span>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cls = d === WEDDING_DAY
        ? 'calendar__day calendar__day--wedding'
        : 'calendar__day';
      html += `<span class="${cls}">${d}</span>`;
    }

    container.innerHTML = html;
  }

  /* ── Countdown ── */
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function updateCountdown() {
    const now = new Date();
    const diff = WEDDING_DATE - now;

    const els = {
      days:  document.getElementById('cd-days'),
      hours: document.getElementById('cd-hours'),
      mins:  document.getElementById('cd-mins'),
      secs:  document.getElementById('cd-secs'),
    };

    if (!els.days) return;

    if (diff <= 0) {
      els.days.textContent  = '00';
      els.hours.textContent = '00';
      els.mins.textContent  = '00';
      els.secs.textContent  = '00';
      if (!countdownTriggered && countdownRunner) {
        countdownTriggered = true;
        countdownRunner.startMarriedSequence();
      }
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    const secs  = Math.floor((diff % 60000) / 1000);

    els.days.textContent  = pad(days);
    els.hours.textContent = pad(hours);
    els.mins.textContent  = pad(mins);
    els.secs.textContent  = pad(secs);
  }

  /* ── Init ── */
  buildCalendar();
  if (typeof initCountdownRunner === 'function') {
    countdownRunner = initCountdownRunner(document.getElementById('countdown-runner'));
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
})();
