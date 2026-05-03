/* ============================================
   App.js — Appointment Scheduler
   ============================================ */

'use strict';

// ─── Constants ───────────────────────────────────────────────────────────────
const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const DEFAULT_PASSWORD = '1234';

// ─── EmailJS ──────────────────────────────────────────────────────────────────
// TODO: EmailJS 설정 후 아래 값을 교체하세요
const EMAILJS_PUBLIC_KEY  = 'SWbIJNY5pA6zjUyug';
const EMAILJS_SERVICE_ID  = 'service_p4bwnzf';
const EMAILJS_TEMPLATE_ID = 'template_58pjo7q';

if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  console.log('✅ EmailJS initialized');
}

const TIME_SLOTS = [
  '오전 9:00','오전 9:30','오전 10:00','오전 10:30',
  '오전 11:00','오전 11:30','오후 12:00','오후 12:30',
  '오후 1:00','오후 1:30','오후 2:00','오후 2:30',
  '오후 3:00','오후 3:30','오후 4:00','오후 4:30',
  '오후 5:00','오후 5:30','오후 6:00','오후 6:30',
  '오후 7:00','오후 7:30','오후 8:00','오후 8:30',
  '오후 9:00','오후 9:30','오후 10:00','오후 10:30',
];

const TYPE_ICONS = {
  '술약속': {
    g1: '#FF6B9D', g2: '#FF9A3C',
    svg: `<path d="M5 3h11l1 5H5V3z"/><path d="M5 8v13h11V8"/><path d="M16 8h3a2 2 0 010 4h-3"/>`,
    fill: 'none', stroke: 'white',
  },
  '데이트': {
    g1: '#FF6B9D', g2: '#FF8EE0',
    svg: `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`,
    fill: 'white', stroke: 'none',
  },
  '밥 약속': {
    g1: '#FF9A3C', g2: '#FFD93D',
    svg: `<path d="M12 2a8 8 0 018 8H4a8 8 0 018-8z"/><rect x="3" y="10" width="18" height="2" rx="1"/><path d="M5 12v3a7 7 0 0014 0v-3"/>`,
    fill: 'none', stroke: 'white',
  },
  '카페': {
    g1: '#A78BFA', g2: '#60A5FA',
    svg: `<path d="M17 8h1a4 4 0 010 8h-1"/><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>`,
    fill: 'none', stroke: 'white',
  },
  '기타': {
    g1: '#34D399', g2: '#60A5FA',
    svg: `<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>`,
    fill: 'none', stroke: 'white',
  },
};

function getTypeIconHtml(type, size = 36) {
  const cfg = TYPE_ICONS[type] || { g1: '#34D399', g2: '#60A5FA',
    svg: `<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>`,
    fill: 'none', stroke: 'white' };
  const r = Math.round(size * 0.36);
  const iconSize = Math.round(size * 0.55);
  return `<div class="admin-type-icon" style="width:${size}px;height:${size}px;border-radius:${r}px;background:linear-gradient(135deg,${cfg.g1},${cfg.g2});box-shadow:0 3px 10px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;flex-shrink:0;"><svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${cfg.fill}" stroke="${cfg.stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="position:relative;z-index:1">${cfg.svg}</svg></div>`;
}

// ─── State ────────────────────────────────────────────────────────────────────
let currentYear, currentMonth;
let selectedDate = null;
let selectedType = null;
let selectedTimes = new Set();

// ─── Supabase Backend ─────────────────────────────────────────────────────────
const supabaseUrl = 'https://uzgnotuiqqnxjuskfwbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6Z25vdHVpcXFueGp1c2tmd2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODU4MzksImV4cCI6MjA5Mjc2MTgzOX0.L-0NbKJv3bbc1GC6tt8taF2Egbhp-3RHhewQFEw2S8Y';

let supabaseClient = null;
try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  } else {
    console.warn('⚠️ Supabase SDK not loaded - running in offline mode.');
  }
} catch (e) {
  console.error('Supabase init error:', e);
}

let localBusyDates = [];
let localBusyRanges = [];
let localBookings = [];

async function fetchAllData() {
  if (!supabaseClient) {
    console.log('Supabase not connected — using local data only.');
    return;
  }
  try {
    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), ms));

    const [bdRes, brRes, bkRes] = await Promise.race([
      Promise.all([
        supabaseClient.from('busy_dates').select('*'),
        supabaseClient.from('busy_ranges').select('*'),
        supabaseClient.from('bookings').select('*')
      ]),
      timeout(5000)
    ]);

    if (bdRes && !bdRes.error && bdRes.data) localBusyDates = bdRes.data;
    else if (bdRes && bdRes.error) console.error('busy_dates fetch error:', bdRes.error.message);

    if (brRes && !brRes.error && brRes.data) localBusyRanges = brRes.data.map(r => ({ id: r.id, start: r.start_date, end: r.end_date, label: r.label }));
    else if (brRes && brRes.error) console.error('busy_ranges fetch error:', brRes.error.message);

    if (bkRes && !bkRes.error && bkRes.data) localBookings = bkRes.data.map(b => ({ ...b, times: b.times }));
    else if (bkRes && bkRes.error) console.error('bookings fetch error:', bkRes.error.message);

    console.log('📦 Fetched:', localBusyDates.length, 'busy dates,', localBusyRanges.length, 'ranges,', localBookings.length, 'bookings');
  } catch (err) {
    console.error('fetchAllData error (will render calendar anyway):', err.message);
  }
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────
function getPassword() {
  return localStorage.getItem('appt_password') || DEFAULT_PASSWORD;
}
function setPassword(pw) {
  localStorage.setItem('appt_password', pw);
}

function getBusyDates() { return localBusyDates; }
function getBusyRanges() { return localBusyRanges; }
function getBookings() { return localBookings; }

// 범위를 개별 날짜 문자열 Set으로 확장
function expandRanges() {
  const set = new Set();
  getBusyRanges().forEach(r => {
    const cur = new Date(r.start + 'T00:00:00');
    const end = new Date(r.end   + 'T00:00:00');
    while (cur <= end) {
      set.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  });
  return set;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────
function toDateStr(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m-1, d);
}
function formatDisplayDate(str) {
  const d = parseDate(str);
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${DAYS_KO[d.getDay()]})`;
}

function getLocalTodayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}

function convertTo24Hour(timeStr) {
  if (!timeStr) return '';
  const [ampm, time] = timeStr.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (ampm === '오후' && h !== 12) h += 12;
  if (ampm === '오전' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTimesToRanges(timesArr) {
  if (!timesArr || timesArr.length === 0) return '';
  const validTimes = timesArr.filter(t => t);
  if (validTimes.length === 0) return '';
  
  const sorted = [...validTimes].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
  const blocks = [];
  let currentBlock = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const prevIdx = TIME_SLOTS.indexOf(sorted[i - 1]);
    const currIdx = TIME_SLOTS.indexOf(sorted[i]);
    
    if (currIdx === prevIdx + 1) {
      currentBlock.push(sorted[i]);
    } else {
      blocks.push(currentBlock);
      currentBlock = [sorted[i]];
    }
  }
  blocks.push(currentBlock);
  
  return blocks.map(block => {
    if (block.length === 1) return convertTo24Hour(block[0]);
    return `${convertTo24Hour(block[0])} ~ ${convertTo24Hour(block[block.length - 1])}`;
  }).join(', ');
}

// ─── Calendar Rendering ───────────────────────────────────────────────────────
function renderCalendar() {
  const grid = document.getElementById('calGrid');
  const label = document.getElementById('monthLabel');

  grid.innerHTML = '';
  label.textContent = `${currentYear}년 ${MONTHS_KO[currentMonth]}`;

  const today = new Date();
  today.setHours(0,0,0,0);

  const busyDates = getBusyDates().map(b => b.date);
  const rangeDates = expandRanges();          // 범위 날짜 Set
  const bookings = getBookings();
  // 거절된 예약은 점 표시 안 함
  // 모든 시간 슬롯이 찼을 때만 fullyBooked
  const nonRejectedByDate = {};
  bookings.filter(b => b.status !== 'rejected').forEach(b => {
    if (!nonRejectedByDate[b.date]) nonRejectedByDate[b.date] = [];
    const times = Array.isArray(b.times) ? b.times : (b.time ? [b.time] : []);
    nonRejectedByDate[b.date].push(...times);
  });
  // 단순 점 표시: 예약이 있는 날
  const datesWithBooking = new Set(Object.keys(nonRejectedByDate));
  // 완치 마감: 모든 슬롯이 찼거나 1시간 미만(슬롯 1개 이하)으로 남은 날
  const fullyBookedDates = new Set(
    Object.entries(nonRejectedByDate)
      .filter(([, times]) => {
        const uniqueTimes = new Set(times);
        const availableCount = TIME_SLOTS.length - uniqueTimes.size;
        return availableCount <= 1; // 0개 또는 1개(30분)만 남은 경우 마감으로 간주
      })
      .map(([date]) => date)
  );

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('button');
    empty.className = 'cal-day empty';
    empty.disabled = true;
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement('button');
    const dateStr = toDateStr(currentYear, currentMonth, d);
    const dateObj = new Date(currentYear, currentMonth, d);
    const dayOfWeek = dateObj.getDay();

    btn.className = 'cal-day';
    btn.innerHTML = `<span>${d}</span>`;
    btn.dataset.date = dateStr;

    const isPast = dateObj < today;
    const isBusy = busyDates.includes(dateStr) || rangeDates.has(dateStr);
    const isRange = rangeDates.has(dateStr);
    const hasBooking = datesWithBooking.has(dateStr);   // 점 표시
    const isFullyBooked = fullyBookedDates.has(dateStr); // 완전 마감

    // 범위 시각화: 시작/중간/끝 구분
    const ranges = getBusyRanges();
    let rangePos = null; // 'start' | 'mid' | 'end' | 'single'
    ranges.forEach(r => {
      const s = new Date(r.start + 'T00:00:00');
      const e = new Date(r.end   + 'T00:00:00');
      if (dateObj >= s && dateObj <= e) {
        if (r.start === r.end)       rangePos = 'single';
        else if (dateStr === r.start) rangePos = 'start';
        else if (dateStr === r.end)   rangePos = 'end';
        else                          rangePos = 'mid';
      }
    });
    if (rangePos) btn.dataset.rangePos = rangePos;
    const isToday = dateObj.getTime() === today.getTime();

    if (dayOfWeek === 0) btn.classList.add('sunday');
    if (dayOfWeek === 6) btn.classList.add('saturday');
    if (isToday) btn.classList.add('today');

    if (isPast) {
      btn.classList.add('past');
      btn.disabled = true;
    } else if (isBusy) {
      btn.classList.add('busy');
      btn.disabled = true;
      btn.title = '이 날은 바빠요 😅';
    } else if (isFullyBooked) {
      btn.classList.add('booked-full');
      btn.disabled = true;
      btn.title = '모든 시간이 찼어요';
    } else {
      btn.classList.add('available');
      if (hasBooking) btn.classList.add('has-booking'); // 점 표시
      btn.addEventListener('click', () => openBookingModal(dateStr));
    }

    grid.appendChild(btn);
  }
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
function openBookingModal(dateStr) {
  selectedDate = dateStr;
  selectedType = null;
  selectedTimes = new Set();

  const d = parseDate(dateStr);
  document.getElementById('badgeDay').textContent = DAYS_KO[d.getDay()];
  document.getElementById('badgeNum').textContent = d.getDate();

  // Reset type selection
  document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
  document.getElementById('customTypeWrap').classList.add('hidden');
  document.getElementById('customTypeInput').value = '';

  // Render time slots
  const timeGrid = document.getElementById('timeGrid');
  timeGrid.innerHTML = '';

  const bookings = getBookings().filter(b => b.date === dateStr);
  // 거절된 예약의 시간은 다시 선택 가능
  const takenTimes = bookings
    .filter(b => b.status !== 'rejected')
    .flatMap(b => Array.isArray(b.times) ? b.times : [b.time]);

  TIME_SLOTS.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'time-slot';
    btn.textContent = t;
    if (takenTimes.includes(t)) {
      btn.classList.add('taken');
      btn.disabled = true;
    } else {
      btn.addEventListener('click', () => {
        if (selectedTimes.has(t)) {
          selectedTimes.delete(t);
          btn.classList.remove('active');
        } else {
          selectedTimes.add(t);
          btn.classList.add('active');
        }
      });
    }
    timeGrid.appendChild(btn);
  });

  // Reset inputs
  document.getElementById('nameInput').value = '';
  document.getElementById('emailInput').value = '';
  document.getElementById('noteInput').value = '';

  document.getElementById('bookingOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
  document.getElementById('bookingOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  selectedDate = null; selectedType = null; selectedTimes = new Set();
}

// ─── Submit Booking ───────────────────────────────────────────────────────────
function submitBooking() {
  const name = document.getElementById('nameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const note = document.getElementById('noteInput').value.trim();

  let finalType = selectedType;
  if (selectedType === '기타') {
    const custom = document.getElementById('customTypeInput').value.trim();
    if (!custom) { showToast('기타 약속 종류를 입력해주세요! ✏️', true); return; }
    finalType = custom;
  }

  if (!finalType) { showToast('약속 종류를 선택해주세요! 🙏', true); return; }
  if (selectedTimes.size === 0) { showToast('시간을 선택해주세요! ⏰', true); return; }
  if (!name) { showToast('이름을 입력해주세요! 😊', true); return; }

  const timesArr = [...selectedTimes].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));

  const booking = {
    id: Date.now(),
    date: selectedDate,
    times: timesArr,
    type: finalType,
    name,
    email,
    note,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  localBookings.push(booking);
  if (supabaseClient) {
    const dbBooking = {
      id: booking.id,
      date: booking.date,
      times: booking.times,
      type: booking.type,
      name: booking.name,
      note: booking.note,
      status: booking.status,
      createdat: booking.createdAt
    };
    supabaseClient.from('bookings').insert(dbBooking).then(({error}) => { if(error) console.error(error); });
  }

  closeBookingModal();
  renderCalendar();
  openSuccessModal(booking);
}

// ─── Success Modal ─────────────────────────────────────────────────────────────
function openSuccessModal(booking) {
  const timesLabel = Array.isArray(booking.times) ? formatTimesToRanges(booking.times) : formatTimesToRanges([booking.time]);
  document.getElementById('successDesc').textContent =
    `${booking.name}님의 약속 신청이 접수되었어요!`;
  document.getElementById('successDetail').innerHTML = `
    <div class="success-row"><span class="s-label">📅 날짜</span><span>${formatDisplayDate(booking.date)}</span></div>
    <div class="success-row"><span class="s-label">⏰ 시간</span><span>${timesLabel}</span></div>
    <div class="success-row"><span class="s-label">🎉 종류</span><span>${booking.type}</span></div>
    ${booking.note ? `<div class="success-row"><span class="s-label">💬 한마디</span><span>${booking.note}</span></div>` : ''}
  `;
  document.getElementById('successOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
  document.getElementById('successOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  toast.style.background = isError ? '#FF3B30' : '#1C1C1E';

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
let adminUnlocked = false;
let isAdminSession = false; // 로그인 후 세션 내내 유지
let adminSelectedTimes = new Set(); // 관리자 바쁜 날 추가 시 시간 선택

function openAdminPanel() {
  adminUnlocked = false;
  document.getElementById('adminGate').classList.remove('hidden');
  document.getElementById('adminContent').classList.add('hidden');
  document.getElementById('adminPwInput').value = '';
  document.getElementById('adminError').classList.add('hidden');
  document.getElementById('adminOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
  document.getElementById('adminOverlay').classList.add('hidden');
  document.body.style.overflow = '';
}

function tryAdminLogin() {
  const pw = document.getElementById('adminPwInput').value;
  if (pw === getPassword()) {
    adminUnlocked = true;
    isAdminSession = true; // 세션 내 관리자 인증 유지
    document.getElementById('adminGate').classList.add('hidden');
    document.getElementById('adminContent').classList.remove('hidden');
    renderAdminContent();
  } else {
    document.getElementById('adminError').classList.remove('hidden');
    document.getElementById('adminPwInput').value = '';
  }
}

function renderAdminContent() {
  renderBusyList();
  renderAdminBookings();
}

function renderBusyList() {
  const list = document.getElementById('busyList');
  const todayStr = getLocalTodayStr();
  const busy = getBusyDates().filter(b => b.date >= todayStr);
  const ranges = getBusyRanges().filter(r => r.end >= todayStr);

  if (busy.length === 0 && ranges.length === 0) {
    list.innerHTML = '<p class="empty-msg">등록된 바쁜 날이 없어요</p>';
    return;
  }

  const singleItems = busy
    .sort((a,b) => a.date.localeCompare(b.date))
    .map(b => `
      <div class="busy-item">
        <div class="busy-item-info">
          <span class="busy-date">${formatDisplayDate(b.date)}</span>
          ${b.label ? `<span class="busy-label">${b.label}</span>` : ''}
        </div>
        <button class="delete-btn" onclick="removeBusyDate('${b.date}')">🗑️</button>
      </div>
    `).join('');

  const rangeItems = ranges
    .sort((a,b) => a.start.localeCompare(b.start))
    .map(r => `
      <div class="busy-item">
        <div class="busy-item-info">
          <span class="busy-date">📅 ${formatDisplayDate(r.start)} ~ ${formatDisplayDate(r.end)}</span>
          ${r.label ? `<span class="busy-label">${r.label}</span>` : ''}
        </div>
        <button class="delete-btn" onclick="removeBusyRange('${r.id}')">🗑️</button>
      </div>
    `).join('');

  list.innerHTML = singleItems + rangeItems;
}

function addBusyDate() {
  const dateVal = document.getElementById('busyDateInput').value;
  const label = document.getElementById('busyLabelInput').value.trim();

  if (!dateVal) { showToast('날짜를 선택해주세요!', true); return; }

  // 시간이 선택되어 있다면 -> 예약 묶음(개인 일정)으로 처리
  if (adminSelectedTimes.size > 0) {
    const timesArr = [...adminSelectedTimes].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));
    const booking = {
      id: Date.now(),
      date: dateVal,
      times: timesArr,
      type: '기타',
      name: '개인 일정',
      email: '',
      note: label || '개인 일정',
      status: 'accepted',
      createdAt: new Date().toISOString()
    };

    localBookings.push(booking);
    if (supabaseClient) {
      const dbBooking = {
        id: booking.id,
        date: booking.date,
        times: booking.times,
        type: booking.type,
        name: booking.name,
        note: booking.note,
        status: booking.status,
        createdat: booking.createdAt
      };
      supabaseClient.from('bookings').insert(dbBooking).then();
    }
    
    showToast('선택한 시간이 바쁜 시간으로 차단됐어요 🚫');
  } else {
    // 시간이 선택되어 있지 않다면 -> 하루 전체 바쁜 날로 처리
    if (localBusyDates.find(b => b.date === dateVal)) {
      showToast('이미 등록된 날이에요!', true); return;
    }

    const newRow = { date: dateVal, label };
    localBusyDates.push(newRow);
    if (supabaseClient) {
      supabaseClient.from('busy_dates').insert(newRow).then(({ error }) => {
        if (error) {
          console.error('❌ busy_dates insert error:', error.message, error.details, error.hint);
          alert('저장 실패: ' + error.message);
        } else {
          console.log('✅ busy_dates saved:', dateVal);
        }
      });
    }
    showToast('바쁜 날이 등록됐어요 📅');
  }
  
  document.getElementById('busyDateInput').value = '';
  document.getElementById('busyLabelInput').value = '';
  adminSelectedTimes.clear();
  const timeGrid = document.getElementById('adminTimeGrid');
  const timeActions = document.getElementById('adminTimeActions');
  if (timeGrid) {
    timeGrid.classList.add('hidden');
    timeGrid.innerHTML = '';
  }
  if (timeActions) timeActions.classList.add('hidden');
  
  renderAdminBookings();
  renderBusyList();
  renderCalendar();
}

function addBusyRange() {
  const start = document.getElementById('busyRangeStart').value;
  const end   = document.getElementById('busyRangeEnd').value;
  const label = document.getElementById('busyRangeLabel').value.trim();

  if (!start || !end) { showToast('시작일과 종료일을 모두 선택해주세요!', true); return; }
  if (start > end)    { showToast('종료일이 시작일보다 빨라요!', true); return; }

  const id = Date.now().toString();
  localBusyRanges.push({ id, start, end, label });
  if (supabaseClient) supabaseClient.from('busy_ranges').insert({ id, start_date: start, end_date: end, label }).then();
  
  document.getElementById('busyRangeStart').value = '';
  document.getElementById('busyRangeEnd').value = '';
  document.getElementById('busyRangeLabel').value = '';
  renderBusyList();
  renderCalendar();
  showToast('휴가 기간이 등록됐어요 🏖️');
}

function removeBusyRange(id) {
  localBusyRanges = localBusyRanges.filter(r => r.id !== id);
  if (supabaseClient) supabaseClient.from('busy_ranges').delete().eq('id', id).then();
  renderBusyList();
  renderCalendar();
  showToast('삭제됐어요!');
}

function removeBusyDate(date) {
  localBusyDates = localBusyDates.filter(b => b.date !== date);
  if (supabaseClient) supabaseClient.from('busy_dates').delete().eq('date', date).then();
  renderBusyList();
  renderCalendar();
  showToast('삭제됐어요!');
}

function renderBookingListHtml(bookings) {
  if (bookings.length === 0) {
    return '<p class="empty-msg">예약이 없어요 🥲</p>';
  }
  return bookings.map(b => {
    const timesLabel = Array.isArray(b.times) ? formatTimesToRanges(b.times) : formatTimesToRanges([b.time]);
    const status = b.status || 'pending';
    const statusMap = {
      pending:  { label: '대기 중', cls: 'status-pending' },
      accepted: { label: '✅ 수락됨', cls: 'status-accepted' },
      rejected: { label: '❌ 거절됨', cls: 'status-rejected' },
    };
    const s = statusMap[status];
    return `
    <div class="booking-item">
      <div class="booking-header">
        ${getTypeIconHtml(b.type, 36)}
        <div class="booking-header-info">
          <span class="booking-type-name">${b.type}</span>
          <span class="booking-date-time">${formatDisplayDate(b.date)} · ${timesLabel}</span>
        </div>
        <button class="delete-btn" style="margin-left:auto;" onclick="removeBooking(${b.id})">🗑️</button>
      </div>
      <div class="booking-meta">
        <span class="booking-name">👤 ${b.name}</span>
        <span class="booking-status ${s.cls}">${s.label}</span>
      </div>
      ${b.note ? `<span class="booking-note">💬 ${b.note}</span>` : ''}
      ${status === 'pending' ? `
      <div class="booking-actions">
        <button class="action-btn accept-btn" onclick="acceptBooking(${b.id})">✅ 수락</button>
        <button class="action-btn reject-btn" onclick="rejectBooking(${b.id})">❌ 거절</button>
        <button class="action-btn" onclick="openEditModal(${b.id})">✏️ 수정</button>
      </div>` : `
      <div class="booking-actions" style="margin-top: 8px;">
        <button class="action-btn" onclick="openEditModal(${b.id})">✏️ 수정</button>
      </div>`}
    </div>
  `}).join('');
}

function renderAdminBookings() {
  const pendingList = document.getElementById('adminBookingList');
  const confirmedList = document.getElementById('adminConfirmedList');
  
  const todayStr = getLocalTodayStr();
  const bookings = getBookings().sort((a,b) => a.date.localeCompare(b.date));

  const pendingBookings = bookings.filter(b => b.status === 'pending' && b.date >= todayStr);
  const confirmedBookings = bookings.filter(b => b.status === 'accepted' && b.date >= todayStr);

  pendingList.innerHTML = renderBookingListHtml(pendingBookings);
  if (confirmedList) {
    confirmedList.innerHTML = renderBookingListHtml(confirmedBookings);
  }
}

function removeBooking(id) {
  localBookings = localBookings.filter(b => b.id !== id);
  if (supabaseClient) supabaseClient.from('bookings').delete().eq('id', id).then(({error}) => { if (error) console.error('removeBooking error:', error.message); });
  renderAdminBookings();
  renderCalendar();
  showToast('일정이 삭제됐어요');
}

function acceptBooking(id) {
  const b = localBookings.find(x => x.id === id);
  if (b) {
    b.status = 'accepted';
    if (supabaseClient) supabaseClient.from('bookings').update({ status: 'accepted' }).eq('id', id).then();
    // 수락 이메일 발송
    sendBookingEmail(b, 'accepted');
  }
  renderAdminBookings();
  renderCalendar();
  showToast('✅ 예약을 수락했어요!');
}

function rejectBooking(id) {
  // 거절 시 완전히 삭제
  const b = localBookings.find(x => x.id === id);
  if (b) sendBookingEmail(b, 'rejected');
  localBookings = localBookings.filter(b => b.id !== id);
  if (supabaseClient) supabaseClient.from('bookings').delete().eq('id', id).then(({error}) => { if (error) console.error('rejectBooking error:', error.message); });
  renderAdminBookings();
  renderCalendar();
  showToast('❌ 예약을 거절(삭제)했어요');
}

// ─── Admin Edit & Time Block ──────────────────────────────────────────────────
function openEditModal(id) {
  const b = localBookings.find(x => x.id === id);
  if (!b) return;
  document.getElementById('editBookingId').value = b.id;
  document.getElementById('editDateInput').value = b.date;
  document.getElementById('editTimesInput').value = Array.isArray(b.times) ? b.times.join(', ') : (b.time || '');
  
  const typeSelect = document.getElementById('editTypeSelect');
  if (Array.from(typeSelect.options).find(opt => opt.value === b.type)) {
    typeSelect.value = b.type;
  } else {
    typeSelect.value = '기타';
  }

  document.getElementById('adminEditOverlay').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('adminEditOverlay').classList.add('hidden');
}

function submitEdit() {
  const id = Number(document.getElementById('editBookingId').value);
  const dateStr = document.getElementById('editDateInput').value;
  const timesStr = document.getElementById('editTimesInput').value;
  const typeStr = document.getElementById('editTypeSelect').value;

  if (!dateStr || !timesStr) { showToast('날짜와 시간을 입력해주세요!', true); return; }

  const timesArr = timesStr.split(',').map(t => t.trim()).filter(t => t);
  
  const b = localBookings.find(x => x.id === id);
  if (b) {
    b.date = dateStr;
    b.times = timesArr;
    b.type = typeStr;

    if (supabaseClient) {
      supabaseClient.from('bookings').update({ date: b.date, times: b.times, type: b.type }).eq('id', b.id).then();
    }
  }

  closeEditModal();
  renderAdminBookings();
  renderCalendar();
  showToast('예약이 수정되었어요 ✏️');
}

function renderAdminTimeGrid(dateStr) {
  const timeGrid = document.getElementById('adminTimeGrid');
  const timeActions = document.getElementById('adminTimeActions');
  timeGrid.innerHTML = '';
  if (!dateStr) {
    timeGrid.classList.add('hidden');
    if (timeActions) timeActions.classList.add('hidden');
    return;
  }

  timeGrid.classList.remove('hidden');
  if (timeActions) timeActions.classList.remove('hidden');
  adminSelectedTimes.clear();

  const bookings = getBookings().filter(b => b.date === dateStr);
  const takenTimes = bookings
    .filter(b => b.status !== 'rejected')
    .flatMap(b => Array.isArray(b.times) ? b.times : [b.time]);

  TIME_SLOTS.forEach((t, i) => {
    const btn = document.createElement('button');
    btn.className = 'time-slot';
    btn.textContent = t;
    btn.dataset.idx = i;
    // slightly smaller for admin panel
    btn.style.padding = '8px 4px';
    btn.style.fontSize = '12px';

    if (takenTimes.includes(t)) {
      btn.classList.add('taken');
      btn.disabled = true;
      btn.style.opacity = '0.5';
    } else {
      btn.addEventListener('click', () => {
        if (adminSelectedTimes.has(t)) {
          adminSelectedTimes.delete(t);
          btn.classList.remove('active');
        } else {
          adminSelectedTimes.add(t);
          btn.classList.add('active');
        }
      });
    }
    timeGrid.appendChild(btn);
  });
}

function selectTimeRange(startIdx, endIdx) {
  const buttons = document.querySelectorAll('#adminTimeGrid .time-slot');
  for (let i = startIdx; i <= endIdx; i++) {
    const btn = Array.from(buttons).find(b => parseInt(b.dataset.idx) === i);
    const t = TIME_SLOTS[i];
    if (btn && !btn.classList.contains('taken')) {
      adminSelectedTimes.add(t);
      btn.classList.add('active');
    }
  }
}

function applyTimeRange() {
  const start = document.getElementById('timeRangeStart').value;
  const end = document.getElementById('timeRangeEnd').value;
  if (!start || !end) return;
  
  const startIdx = TIME_SLOTS.indexOf(start);
  const endIdx = TIME_SLOTS.indexOf(end);
  if (startIdx > endIdx) {
    showToast('시작 시간이 종료 시간보다 늦을 수 없어요!', true);
    return;
  }
  selectTimeRange(startIdx, endIdx);
}

// ─── EmailJS 발송 ─────────────────────────────────────────────────────────────
function sendBookingEmail(booking, resultType) {
  if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') return;
  if (!booking.email) return;

  const isAccepted = resultType === 'accepted';
  const timesLabel = Array.isArray(booking.times) ? formatTimesToRanges(booking.times) : formatTimesToRanges([booking.time]);

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    name:    booking.name,
    email:   booking.email,
    date:    formatDisplayDate(booking.date),
    times:   timesLabel,
    type:    booking.type,
    result:  isAccepted ? '✅ 수락되었어요!' : '❌ 거절되었어요',
    message: isAccepted
      ? '곧 만나요! 기대되는데요 😊'
      : '다음에 다시 신청해주세요 🙏',
  }).then(() => {
    console.log('✅ 이메일 발송 성공:', booking.email);
    showToast('📧 이메일 알림을 보냈어요!');
  }).catch((err) => {
    console.error('❌ 이메일 발송 실패:', err);
  });
}

function changePassword() {
  const newPw = document.getElementById('newPwInput').value.trim();
  if (!newPw || newPw.length < 4) {
    showToast('비밀번호는 4자 이상이어야 해요!', true); return;
  }
  setPassword(newPw);
  document.getElementById('newPwInput').value = '';
  showToast('비밀번호가 변경됐어요 🔒');
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
async function initApp() {
  console.log("initApp Started!");
  // Init current month
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  console.log("Calling fetchAllData");
  // 최초 로딩 시 디비 긁어오기
  await fetchAllData();
  console.log("Finished fetchAllData");

  try {
    renderCalendar();
    console.log("Finished renderCalendar");
  } catch (e) {
    console.error('Render Calendar Error:', e);
  }

  document.getElementById('successCloseBtn').addEventListener('click', closeSuccessModal);
  document.getElementById('successOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('successOverlay')) closeSuccessModal();
  });

  // Month nav
  document.getElementById('prevMonthBtn').addEventListener('click', () => {
    const nowLocal = new Date();
    if (currentYear === nowLocal.getFullYear() && currentMonth === nowLocal.getMonth()) return;
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });

  document.getElementById('nextMonthBtn').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });

  // Booking modal
  document.getElementById('modalCloseBtn').addEventListener('click', closeBookingModal);
  document.getElementById('bookingOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('bookingOverlay')) closeBookingModal();
  });

  // Type cards
  document.querySelectorAll('.type-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedType = card.dataset.type;

      const customWrap = document.getElementById('customTypeWrap');
      if (selectedType === '기타') {
        customWrap.classList.remove('hidden');
        document.getElementById('customTypeInput').focus();
      } else {
        customWrap.classList.add('hidden');
      }
    });
  });

  // Submit
  document.getElementById('submitBookingBtn').addEventListener('click', submitBooking);

  // Admin
  document.getElementById('adminToggleBtn').addEventListener('click', openAdminPanel);
  document.getElementById('adminCloseBtn').addEventListener('click', closeAdminPanel);
  document.getElementById('adminOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('adminOverlay')) closeAdminPanel();
  });
  document.getElementById('adminLoginBtn').addEventListener('click', tryAdminLogin);
  document.getElementById('adminPwInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') tryAdminLogin();
  });
  document.getElementById('addBusyBtn').addEventListener('click', addBusyDate);
  const busyDateInput = document.getElementById('busyDateInput');
  busyDateInput.addEventListener('change', (e) => renderAdminTimeGrid(e.target.value));
  busyDateInput.addEventListener('input', (e) => renderAdminTimeGrid(e.target.value));
  document.getElementById('addBusyRangeBtn').addEventListener('click', addBusyRange);
  document.getElementById('changePwBtn').addEventListener('click', changePassword);
  
  // Quick Time Selectors
  const startSel = document.getElementById('timeRangeStart');
  const endSel = document.getElementById('timeRangeEnd');
  if (startSel && endSel) {
    TIME_SLOTS.forEach(t => {
      const opt1 = document.createElement('option'); opt1.value = t; opt1.textContent = t;
      startSel.appendChild(opt1);
      const opt2 = document.createElement('option'); opt2.value = t; opt2.textContent = t;
      endSel.appendChild(opt2);
    });
  }

  document.getElementById('timeRangeApplyBtn').addEventListener('click', applyTimeRange);
  document.getElementById('qsMorning').addEventListener('click', () => selectTimeRange(0, 5));     // 09:00 - 11:30
  document.getElementById('qsAfternoon').addEventListener('click', () => selectTimeRange(6, 17));  // 12:00 - 17:30
  document.getElementById('qsEvening').addEventListener('click', () => selectTimeRange(18, 27));   // 18:00 - 22:30
  document.getElementById('qsAll').addEventListener('click', () => selectTimeRange(0, 27));
  document.getElementById('qsClear').addEventListener('click', () => {
    adminSelectedTimes.clear();
    document.querySelectorAll('#adminTimeGrid .time-slot:not(.taken)').forEach(btn => btn.classList.remove('active'));
  });

  if(document.getElementById('adminEditCloseBtn')) {
    document.getElementById('adminEditCloseBtn').addEventListener('click', closeEditModal);
    document.getElementById('submitEditBtn').addEventListener('click', submitEdit);
    document.getElementById('adminEditOverlay').addEventListener('click', e => {
      if (e.target === document.getElementById('adminEditOverlay')) closeEditModal();
    });
  }

  // Admin Tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // ─── Realtime subscription ───────────────────────────────────────────────
  setupRealtimeSubscription();
}

// ─── Browser Notification Permission ──────────────────────────────────────
async function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

function sendBrowserNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: 'https://cdn.jsdelivr.net/npm/twemoji@latest/svg/1f4c5.svg',
    });
  }
}

// ─── Supabase Realtime ────────────────────────────────────────────────────
function setupRealtimeSubscription() {
  if (!supabaseClient) return;

  // Request browser notification permission
  requestNotificationPermission();

  supabaseClient
    .channel('public:bookings')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bookings' },
      (payload) => {
        const b = payload.new;
        // avoid duplicate if this browser submitted it
        if (localBookings.find(x => String(x.id) === String(b.id))) return;

        localBookings.push({ ...b, times: b.times });
        renderCalendar();
        if (adminUnlocked) renderAdminContent();

        const timesLabel = Array.isArray(b.times) ? formatTimesToRanges(b.times) : formatTimesToRanges([b.time]);
        const msg = `${b.name}님이 ${formatDisplayDate(b.date)} ${timesLabel} 예약을 신청했어요!`;

        // 관리자 로그인한 경우에만 알림 표시
        if (isAdminSession) {
          showNewBookingBanner(b.name, formatDisplayDate(b.date), timesLabel, b.type);
          sendBrowserNotification('📅 새 약속 신청이 왔어요!', msg);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'bookings' },
      (payload) => {
        const deletedId = payload.old.id;
        localBookings = localBookings.filter(b => String(b.id) !== String(deletedId));
        renderCalendar();
        if (adminUnlocked) renderAdminContent();
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'bookings' },
      (payload) => {
        const updated = payload.new;
        const idx = localBookings.findIndex(b => String(b.id) === String(updated.id));
        if (idx !== -1) localBookings[idx] = { ...localBookings[idx], ...updated };
        renderCalendar();
        if (adminUnlocked) renderAdminContent();
      }
    )
    .subscribe((status) => {
      console.log('Realtime status:', status);
    });
}

// ─── New Booking Banner ───────────────────────────────────────────────────
function showNewBookingBanner(name, dateStr, times, type) {
  // Remove existing banner if any
  const existing = document.getElementById('newBookingBanner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'newBookingBanner';
  banner.innerHTML = `
    <div class="banner-icon">🎉</div>
    <div class="banner-body">
      <div class="banner-title">새 약속 신청이 왔어요!</div>
      <div class="banner-desc">${name}님 · ${dateStr} · ${type}</div>
    </div>
    <button class="banner-close" onclick="this.parentElement.remove()">✕</button>
  `;
  banner.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    display: flex; align-items: center; gap: 12px;
    background: linear-gradient(135deg, #1C1C1E, #2C2C2E);
    color: white; border-radius: 16px; padding: 14px 18px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    animation: slideInRight 0.4s cubic-bezier(0.16,1,0.3,1);
    max-width: 320px; min-width: 260px;
    border: 1px solid rgba(255,255,255,0.1);
  `;
  banner.querySelector('.banner-icon').style.cssText = 'font-size: 28px; flex-shrink: 0;';
  banner.querySelector('.banner-title').style.cssText = 'font-weight: 700; font-size: 14px; margin-bottom: 2px;';
  banner.querySelector('.banner-desc').style.cssText = 'font-size: 12px; color: rgba(255,255,255,0.7);';
  banner.querySelector('.banner-close').style.cssText = `
    background: none; border: none; color: rgba(255,255,255,0.5);
    cursor: pointer; font-size: 14px; padding: 4px; flex-shrink: 0;
    margin-left: auto;
  `;

  // Add animation keyframe if not present
  if (!document.getElementById('bannerStyle')) {
    const style = document.createElement('style');
    style.id = 'bannerStyle';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(120%); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 8000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
