(function () {
  // --- CONFIGURAZIONE ---
  let yourID = 8;
  let friendID = 2;
  let table = "students";

  // --- DATI SENSORI ---
  let personalBattery = 0, personalUptime = 0, personalMouse = { x: 0, y: 0 };
  let friendBattery = 0, friendUptime = 0, friendMouse = { x: 0, y: 0 }, friendLastSeen = 0;

  // --- STATI ANIMAZIONE ---
  let raggio1Rotation = 0, raggio2Rotation = 0, raggio3Rotation = 0;
  let raggio1Stopped = false, raggio2Stopped = false, raggio3Stopped = false;
  let friendRaggio1Stopped = false, friendRaggio2Stopped = false, friendRaggio3Stopped = false;
  
  let raggio1AnimationId, raggio2AnimationId, raggio3AnimationId;
  let pulsingAnimationId = null;
  let isUserSpeaking = false;

  let screenWidth = window.screen.width;
  let communicationUnlocked = false;

  // --- LOGICA AUDIO ---
  const SOUND_CONNECT_URL = '../assets/audio/Walkie Talkie Sound Effects_1.mp3';
  const SOUND_DISCONNECT_URL = '../assets/audio/Walkie Talkie Sound Effects_2.mp3';

  function playConnectSound() {
    const snd = new Audio(SOUND_CONNECT_URL);
    snd.play().catch(e => console.warn("Audio blocked"));
  }
  
  function playDisconnectSound() {
    const snd = new Audio(SOUND_DISCONNECT_URL);
    snd.play().catch(e => console.warn("Audio blocked"));
  }

  function getNextSnapAngle36(currentAngle) {
    const step = 36;
    return Math.floor(currentAngle / step) * step;
  }

  // --- LOGICA VISIVA ---
  function showOnlyRaggio4() {
    const r1 = document.querySelector('.svg-container img:nth-child(1)');
    const r2 = document.querySelector('.svg-container img:nth-child(2)');
    const r3 = document.querySelector('.svg-container img:nth-child(3)');
    const r4 = document.querySelector('.svg-container img:nth-child(4)');
    isUserSpeaking = false;
    cancelAnimationFrame(pulsingAnimationId);
    if (r1) r1.style.display = 'none';
    if (r2) r2.style.display = 'none';
    if (r3) r3.style.display = 'none';
    if (r4) {
        r4.style.display = 'block';
        r4.src = r4.dataset.originalSrc || r4.src;
        // Mantiene la dimensione originale del raggio 4
        r4.style.transform = 'translate(-50%, -50%) scale(1)';
    }
  }

  function transformToCircle(pulsing = false) {
    const r4 = document.querySelector('.svg-container img:nth-child(4)');
    if (!r4) return;
    if (!r4.dataset.originalSrc) r4.dataset.originalSrc = r4.src;

    // MODIFICA: r="10" rende il cerchio la metà della dimensione precedente (che era 20)
    const svgCircle = `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="5" fill="white" stroke="white" stroke-width="2"/></svg>`;
    
    r4.src = 'data:image/svg+xml;base64,' + btoa(svgCircle);
    r4.style.transform = 'translate(-50%, -50%) scale(1)';

    if (pulsing) {
      isUserSpeaking = true;
      let time = 0;
      const animate = () => {
        if (!isUserSpeaking) return;
        time += 0.05;
        // La pulsazione agisce sull'intero elemento r4 partendo dalla scala 1
        let scale = 1 + Math.sin(time) * 0.15;
        r4.style.transform = `translate(-50%, -50%) scale(${scale})`;
        pulsingAnimationId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(pulsingAnimationId);
      pulsingAnimationId = requestAnimationFrame(animate);
    }
  }

  function updateUIState() {
    const isFriendOnline = (Date.now() - friendLastSeen) < 5000;
    const fR1 = isFriendOnline ? friendRaggio1Stopped : false;
    const fR2 = isFriendOnline ? friendRaggio2Stopped : false;
    const fR3 = isFriendOnline ? friendRaggio3Stopped : false;

    const shouldConnect = raggio1Stopped && raggio2Stopped && raggio3Stopped && fR1 && fR2 && fR3;
    const messageInputContainer = document.getElementById('messageInput')?.parentElement;
    
    if (shouldConnect) {
      if (!communicationUnlocked) {
        communicationUnlocked = true;
        showOnlyRaggio4();
        playConnectSound();
        setTimeout(() => { if (communicationUnlocked && messageInputContainer) messageInputContainer.style.display = 'flex'; }, 800);
      }
    } else {
      if (communicationUnlocked) {
        communicationUnlocked = false;
        playDisconnectSound();
        if (messageInputContainer) messageInputContainer.style.display = 'none';
        document.querySelectorAll('.svg-container img').forEach((img, i) => { img.style.display = i < 3 ? 'block' : 'none'; });
        controlRaggio1Animation(); controlRaggio2Animation(); controlRaggio3Animation();
      }
    }
  }

  // --- CONTROLLO RAGGI ---

  function controlRaggio1Animation() {
    const upSeconds = personalUptime;
    const minSblocco = (24 * 3600) + (20 * 60); 
    const maxSblocco = (24 * 3600) + (40 * 60); 
    const el = document.querySelector('.svg-container img:first-child');
    if (!el) return;

    if (upSeconds >= minSblocco && upSeconds <= maxSblocco) {
      const target = getNextSnapAngle36(raggio1Rotation);
      const snap = () => {
        if (personalUptime < minSblocco || personalUptime > maxSblocco) return;
        raggio1Rotation -= 0.3;
        if (raggio1Rotation <= target) { 
          raggio1Rotation = target; el.style.transform = `translate(-50%, -50%) rotate(${target}deg)`; 
          raggio1Stopped = true; updateUIState(); return; 
        }
        el.style.transform = `translate(-50%, -50%) rotate(${raggio1Rotation}deg)`;
        raggio1AnimationId = requestAnimationFrame(snap);
      };
      cancelAnimationFrame(raggio1AnimationId); raggio1AnimationId = requestAnimationFrame(snap);
    } else {
      if (raggio1Stopped || communicationUnlocked) { raggio1Stopped = false; updateUIState(); }
      const animate = () => {
        if (communicationUnlocked) return;
        let speed = 0.8;
        raggio1Rotation -= speed;
        el.style.transform = `translate(-50%, -50%) rotate(${raggio1Rotation}deg)`;
        if (personalUptime < minSblocco || personalUptime > maxSblocco) raggio1AnimationId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(raggio1AnimationId); raggio1AnimationId = requestAnimationFrame(animate);
    }
  }

  function controlRaggio2Animation() {
    const sectionWidth = screenWidth / 3;
    const el = document.querySelector('.svg-container img:nth-child(2)');
    if (!el) return;
    if (personalMouse.x <= sectionWidth) {
      const target = Math.ceil(raggio2Rotation / 36) * 36; 
      const snap = () => {
        if (personalMouse.x > sectionWidth) return;
        raggio2Rotation += 0.3;
        if (raggio2Rotation >= target) { 
          raggio2Rotation = target; el.style.transform = `translate(-50%, -50%) rotate(${target}deg)`; 
          raggio2Stopped = true; updateUIState(); return; 
        }
        el.style.transform = `translate(-50%, -50%) rotate(${raggio2Rotation}deg)`;
        raggio2AnimationId = requestAnimationFrame(snap);
      };
      cancelAnimationFrame(raggio2AnimationId); raggio2AnimationId = requestAnimationFrame(snap);
    } else {
      if (raggio2Stopped || communicationUnlocked) { raggio2Stopped = false; updateUIState(); }
      const animate = () => {
        if (communicationUnlocked) return;
        let dist = (personalMouse.x - sectionWidth) / sectionWidth;
        raggio2Rotation += (0.3 + (dist * 0.5));
        el.style.transform = `translate(-50%, -50%) rotate(${raggio2Rotation}deg)`;
        if (personalMouse.x > sectionWidth) raggio2AnimationId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(raggio2AnimationId); raggio2AnimationId = requestAnimationFrame(animate);
    }
  }

  function controlRaggio3Animation() {
    const battery = parseFloat(personalBattery);
    const el = document.querySelector('.svg-container img:nth-child(3)');
    if (!el) return;

    if (battery > 87) {
      const target = getNextSnapAngle36(raggio3Rotation);
      const snap = () => {
        if (parseFloat(personalBattery) <= 87) return;
        raggio3Rotation -= 0.3;
        if (raggio3Rotation <= target) { 
          raggio3Rotation = target; el.style.transform = `translate(-50%, -50%) rotate(${target}deg)`; 
          raggio3Stopped = true; updateUIState(); return; 
        }
        el.style.transform = `translate(-50%, -50%) rotate(${raggio3Rotation}deg)`;
        raggio3AnimationId = requestAnimationFrame(snap);
      };
      cancelAnimationFrame(raggio3AnimationId); raggio3AnimationId = requestAnimationFrame(snap);
    } else {
      if (raggio3Stopped || communicationUnlocked) { raggio3Stopped = false; updateUIState(); }
      const animate = () => {
        if (communicationUnlocked) return;
        let calcSpeed = 0.5 + ((87 - battery) / 20);
        let speed = Math.min(calcSpeed, 2.0); 
        raggio3Rotation -= speed;
        el.style.transform = `translate(-50%, -50%) rotate(${raggio3Rotation}deg)`;
        if (parseFloat(personalBattery) <= 87) raggio3AnimationId = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(raggio3AnimationId); raggio3AnimationId = requestAnimationFrame(animate);
    }
  }

  // --- SUPABASE & REALTIME ---
  const SUPABASE_URL = "https://ukaxvfohnynqjvgzxtkk.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrYXh2Zm9obnlucWp2Z3p4dGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzU5NzgsImV4cCI6MjA3NjAxMTk3OH0.dZIYwmU-DYSgZFqmpEGXnwb8mm1pYGTU7As9ZrlFWL4";
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const globalChannel = supabase.channel("sync-" + table);

  async function saveData() {
    await supabase.from(table).upsert([{ 
      id: yourID, 
      data: { battery: personalBattery, uptime: personalUptime, mouse: personalMouse, heartbeat: Date.now() }, 
      updated_at: new Date() 
    }]);
  }

  function subscribeRealtime() {
    globalChannel
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: table }, (payload) => {
        if (payload.new.id === friendID) {
          const d = payload.new.data;
          friendBattery = d.battery; friendUptime = d.uptime; friendMouse = d.mouse; friendLastSeen = d.heartbeat || Date.now();
          
          friendRaggio1Stopped = (friendUptime >= 87600 && friendUptime <= 88800);
          friendRaggio2Stopped = (friendMouse.x <= screenWidth / 3);
          friendRaggio3Stopped = friendBattery > 87;
          updateUIState();
        }
      })
      .on('broadcast', { event: 'new_message' }, (payload) => {
        if (payload.payload.from === friendID && window.aiSpeech) {
          transformToCircle(false);
          window.aiSpeech.speak(payload.payload.message);
          setTimeout(() => { if (communicationUnlocked) showOnlyRaggio4(); }, 4000);
        }
      })
      .subscribe();
  }

  window.startSpeakingAnimation = () => transformToCircle(true);
  window.stopSpeakingAnimation = () => showOnlyRaggio4();
  window.autoSendMessage = (text) => {
    globalChannel.send({ type: 'broadcast', event: 'new_message', payload: { from: yourID, to: friendID, message: text } });
    showOnlyRaggio4();
  };

  window.addEventListener("batteryUpdate", (e) => { personalBattery = e.detail.percent; controlRaggio3Animation(); });
  window.addEventListener("uptimeUpdate", (e) => { personalUptime = e.detail.uptime; controlRaggio1Animation(); });
  window.addEventListener("mouseUpdate", (e) => { personalMouse = e.detail; controlRaggio2Animation(); });

  document.addEventListener('DOMContentLoaded', () => {
    subscribeRealtime(); setInterval(saveData, 500);
    const input = document.getElementById('messageInput');
    if (input) {
      input.addEventListener('focus', () => { if (communicationUnlocked) transformToCircle(false); });
      input.addEventListener('blur', () => { if (communicationUnlocked) showOnlyRaggio4(); });
    }
  });
})();