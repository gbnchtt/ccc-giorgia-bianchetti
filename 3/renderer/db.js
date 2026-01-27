(function () {
  let yourID = 8; // ID di Giorgia 
  let friendID = 5; // ID di Arianna 
  let table = "students";

  // Variabili personali
  let personalBattery = 0;
  let personalCpuLoad = 0;
  let personalRam = 0;
  let personalUptime = 0;
  let personalMouse = { x: 0, y: 0 };
  let personalEmotion = null; // Emozione personale 

  // Variabili amico
  let friendBattery = 0;
  let friendCpuLoad = 0;
  let friendRam = 0;
  let friendUptime = 0;
  let friendMouse = { x: 0, y: 0 };
  let friendEmotion = null; // Emozione dell'amico 

  // Event listeners per dati personali
  window.addEventListener("batteryUpdate", (e) => {
    personalBattery = e.detail.percent ? e.detail.percent.toFixed(0) : 0;
  });

  window.addEventListener("cpuLoadUpdate", (e) => {
    personalCpuLoad = e.detail.currentLoad.toFixed(1);
  });

  window.addEventListener("ramUpdate", (e) => {
    personalRam = ((e.detail.active / e.detail.total) * 100).toFixed(1);
  });

  window.addEventListener("uptimeUpdate", (e) => {
    personalUptime = e.detail.uptime;
  });

  window.addEventListener("mouseUpdate", (e) => {
    personalMouse = e.detail;
  });

  // 🎭 Event listener per aggiornamenti emozione personale
  window.addEventListener("emotionUpdate", (e) => {
    personalEmotion = e.detail.emotion;
    console.log(`🎭 Nuova emozione personale: ${personalEmotion}`);
  });

  // Connessione Supabase
  const SUPABASE_URL = "https://ukaxvfohnynqjvgzxtkk.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrYXh2Zm9obnlucWp2Z3p4dGtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MzU5NzgsImV4cCI6MjA3NjAxMTk3OH0.dZIYwmU-DYSgZFqmpEGXnwb8mm1pYGTU7As9ZrlFWL4";

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let channel;

  // Funzione per inviare i propri dati
  async function saveData() {
    const input = {
      id: yourID,
      data: {
        cpuLoad: personalCpuLoad,
        battery: personalBattery,
        ram: personalRam,
        uptime: personalUptime,
        mouse: personalMouse,
        emotion: personalEmotion, // Invia l'emozione 
        heartbeat: Date.now(),
      },
      updated_at: new Date(),
    };

    //LOG: Cosa invii al database
    console.log(`INVIO AL DATABASE: TUA batteria=${personalBattery}%, cpu=${personalCpuLoad}%`);

    const { error } = await supabase.from(table).upsert([input]);
    if (error) {
      console.error("Insert error:", error.message);
    } else {
      // console.log("Insert success - Emotion:", personalEmotion);
    }
  }

  // Funzione per gestire il canale Realtime
  function subscribeRealtime() {
    if (channel) {
      console.warn("Removing old channel before re-subscribing...");
      supabase.removeChannel(channel);
    }

    channel = supabase
      .channel("public:" + table)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: table },
        (payload) => {
          const data = payload.new;
          
          // SINCRONIZZAZIONE: Controlla se l'aggiornamento è dall'amico
          if (data.id === friendID) {
            friendBattery = data.data.battery;
            friendCpuLoad = data.data.cpuLoad;
            friendRam = data.data.ram;
            friendUptime = data.data.uptime;
            friendMouse = data.data.mouse;
            
            //  LOG: Cosa arriva dal database di Arianna
            console.log(`DATABASE Arianna: batteria=${friendBattery}%, cpu=${friendCpuLoad}%`);
            console.log(`DATI COMPLETI Arianna:`, data.data);
            
            // 🔋 Invia aggiornamento batteria dell'amica a render.js
            window.dispatchEvent(new CustomEvent("friendBatteryUpdate", { 
              detail: { battery: friendBattery } 
            }));
            
            // Ricevi l'emozione dell'amico dal database
            const newFriendEmotion = data.data.emotion;
            
           
            if (newFriendEmotion && newFriendEmotion !== friendEmotion) {
              friendEmotion = newFriendEmotion;
              
              console.log(`Emozione ricevuta dall'amico (${friendID}): ${friendEmotion}`);
             
              window.dispatchEvent(new CustomEvent("friendEmotionUpdate", { 
                detail: { emotion: friendEmotion } 
              }));
            }
            
            draw();
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime channel status:", status);
        if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.warn("Realtime disconnected. Reconnecting in 3s...");
          setTimeout(subscribeRealtime, 3000);
        }
      });
  }

  // 🎯 RESET: All'avvio, pulisci l'emozione nel database (opzionale ma consigliato)
  async function resetEmotionOnStart() {
    const input = {
      id: yourID,
      data: {
        emotion: null, // Resetta l'emozione all'avvio
        heartbeat: Date.now(),
      },
      updated_at: new Date(),
    };
    
    await supabase.from(table).upsert([input]);
    console.log("🔄 Emozione resettata all'avvio");
  }

  // Inizializza tutto
  resetEmotionOnStart(); // Reset all'avvio
  subscribeRealtime();

  // Ping periodico per tenere vivo il canale
  setInterval(() => {
    if (channel && channel.state === "joined") {
      channel.send({
        type: "broadcast",
        event: "ping",
        payload: { t: Date.now() },
      });
      console.log("Ping sent to keep connection alive");
    }
  }, 20000);

  // Disegno dati sullo schermo
  function draw() {
    if (personalRam && friendRam && friendMouse && personalMouse) {
      // Controlli per evitare errori se gli elementi non esistono
      const youEl = document.getElementById("you");
      if (youEl) youEl.style.height = personalCpuLoad + "%";
      
      const friendEl = document.getElementById("friend");
      if (friendEl) friendEl.style.height = friendCpuLoad + "%";
      
      const youCoordsEl = document.getElementById("you-coords");
      if (youCoordsEl) youCoordsEl.innerText = personalMouse.x + ", " + personalMouse.y + "; ";
      
      const friendCoordsEl = document.getElementById("friend-coords");
      if (friendCoordsEl) friendCoordsEl.innerText = friendMouse.x + ", " + friendMouse.y;
    }
  }

  // Salva dati periodicamente (inclusa l'emozione)
  setInterval(saveData, 250);
})();
