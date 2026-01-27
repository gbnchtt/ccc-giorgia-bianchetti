function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

//variable font
const font = document.getElementById("font");
let fontWeight = 32,
  fontSlant = 0,
  fontWidth = 100;

async function updateStats() {
  try {
    const battery = await window.API.getBattery();
    const cpuLoad = await window.API.getCpuLoad();
    const mem = await window.API.getMemory();
    const cpuInfo = await window.API.getCpuInfo();
    const processes = await window.API.getProcesses();
    const timeInfo = await window.API.getTimeInfo();

    // Battery
    const batteryElement = document.getElementById("batteria");
    if (batteryElement) {
      batteryElement.innerText = battery.hasBattery
        ? battery.percent.toFixed(0)
        : "N/A";
    }
    


    // CPU Load
    const cpuPercent = cpuLoad.currentLoad.toFixed(1);
    const cpuElement = document.getElementById("cpu");
    if (cpuElement) cpuElement.innerText = cpuPercent;

    // RAM Usage
    const ramPercent = ((mem.active / mem.total) * 100).toFixed(1);
    const ramElement = document.getElementById("ram");
    if (ramElement) ramElement.innerText = ramPercent;

    // CPU Thermometer
    const thermoElement = document.getElementById("cpu-thermometer-label");
    if (thermoElement) thermoElement.innerText = cpuPercent + "%";

    // Uptime
    const uptimeElement = document.getElementById("uptime");
    if (uptimeElement) uptimeElement.innerText = formatTime(timeInfo.uptime);
    fontSlant = mapRange(cpuPercent, 0, 100, 0, 24);

    //questa funzione serve per inviare a clock il suo valore
    window.dispatchEvent(new CustomEvent("batteryUpdate", { detail: battery }));
    window.dispatchEvent(new CustomEvent("cpuLoadUpdate", { detail: cpuLoad }));
    window.dispatchEvent(new CustomEvent("ramUpdate", { detail: mem }));
    window.dispatchEvent(new CustomEvent("uptimeUpdate", { detail: timeInfo }));

    // Time now not timeInfo
    let timeNow = new Date();
    const timeElement = document.getElementById("time");
    if (timeElement) {
      timeElement.innerText = formatTime(
        timeNow.getHours() * 3600 +
          timeNow.getMinutes() * 60 +
          timeNow.getSeconds()
      );
    }
  } catch (err) {
    console.error("Errore nel caricamento statistiche:", err);
  }
}

async function showMouseCoords() {
  const pos = await window.API.getMousePosition();
  const mouseCoordsElement = document.getElementById("mouse-coords");
  if (mouseCoordsElement) {
    mouseCoordsElement.innerText = `X: ${pos.x}, Y: ${pos.y}`;
  }
  fontWeight = mapRange(pos.x, 0, 1500, 32, 120);
  window.dispatchEvent(new CustomEvent("mouseUpdate", { detail: pos }));
}

//create
function mapRange(value, a, b, c, d) {
  value = (value - a) / (b - a);
  return c + value * (d - c);
}

setInterval(showMouseCoords, 10);
setInterval(updateStats, 500);
updateStats();

// ========================================
// GESTIONE EMOZIONI E SINCRONIZZAZIONE
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Seleziona gli elementi principali
    const toggleButton = document.getElementById('previewToggle');
    const widgetBody = document.getElementById('widgetBody');
    const feelingText = document.getElementById('feelingText');
    const cerchio = document.getElementById('cerchio');
    
    // Seleziona i bottoni emozione
    const emotionButtons = document.querySelectorAll('#emotionButtons .emotion-button');
    
    // STATO: false = modalità positiva (vedo Arianna), true = modalità negativa (vedo me stessa)
    let isPersonalMode = false; 
    
    // Variabile per l'emozione dell'amico (ricevuta dal database)
    let friendCurrentEmotion = null;
    
    // Variabile per la MIA emozione personale
    let myCurrentEmotion = null;

    // Variabili per le batterie REALI
    let myBatteryPercent = 100; // ID 8 (TU) - collegato alla TUA batteria reale
    let friendBatteryPercent = 100; // ID 5 (Arianna) - collegato alla batteria reale di Arianna

    // Funzione per calcolare la dimensione del cerchio in base alla batteria
    function calculateCircleSize(batteryPercent) {
        // Mappa la batteria da 0-100% a 20-90px (dimensione minima 20px, massima 90px)
        const minSize = 20;
        const maxSize = 90;
        const size = Math.max(minSize, Math.min(maxSize, (batteryPercent / 100) * maxSize));
        return Math.round(size);
    }

    // Funzione per aggiornare la dimensione del cerchio
    function updateCircleSize() {
        if (!cerchio) {
            console.error("ERRORE: Elemento cerchio non trovato!");
            return;
        }
        
        let batteryToUse;
        
        // LOGICA CORRETTA: Il cerchio si ridimensiona sempre in base alla batteria del proprietario
        if (isPersonalMode) {
            // Modalità negativa: "Today I'm feeling..." (sfondo bianco + cerchio nero) → TUA batteria (ID 8)
            batteryToUse = myBatteryPercent;
        } else {
            // Modalità positiva: "Today Arianna is feeling..." (sfondo nero + cerchio bianco) → batteria ARIANNA (ID 5)
            batteryToUse = friendBatteryPercent;
        }
        
        const size = calculateCircleSize(batteryToUse);
        
        // Applica le dimensioni con !important per sovrascrivere il CSS
        cerchio.style.setProperty('width', size + 'px', 'important');
        cerchio.style.setProperty('height', size + 'px', 'important');
        
        console.log(`${isPersonalMode ? 'TUA' : 'ARIANNA'} batteria: ${batteryToUse}% → ${size}px`);
    }

    // Fermare tutte le emozioni attive sul cerchio
    function stopAllAnimations() {
        if (cerchio) {
            cerchio.classList.remove('is-happy', 'is-sad', 'is-anxious', 
                                     'is-calm', 'is-angry', 'is-hungry');
            // Rimuovi gli stili inline per hungry
            cerchio.style.removeProperty('background-color');
            cerchio.style.removeProperty('border');
        }
    }

    // Applicare un'emozione al cerchio
    function applyEmotion(emotion) {
        if (!cerchio || !emotion) return;
        
        stopAllAnimations();
        
        // Se l'emozione è "hungry", applica l'outline
        if (emotion === 'hungry') {
    // Controlla se siamo in modalità negativa
    const isNegativeMode = widgetBody && widgetBody.classList.contains('negative');
    const borderColor = isNegativeMode ? 'black' : 'white';
    
    cerchio.style.setProperty('background-color', 'transparent', 'important');
    cerchio.style.setProperty('border', `2px solid ${borderColor}`, 'important');
        }
        
        // Applica la classe CSS corrispondente all'emozione
        const emotionClass = 'is-' + emotion;
        cerchio.classList.add(emotionClass);
        
        console.log(`Animazione applicata: ${emotion}`);
    }

    // Aggiornare il testo principale con l'emozione
    function updateFeelingText(emotion) {
        const feelingSpan = feelingText.querySelector('span');
        if (feelingSpan && emotion) {
            feelingSpan.textContent = emotion;
        }
    }

    // LOGICA DEL CAMBIO TEMA (Toggle tra modalità positiva e negativa)
    if (toggleButton && widgetBody && feelingText) {
        toggleButton.addEventListener('click', function() {
            isPersonalMode = !isPersonalMode;
            widgetBody.classList.toggle('negative');
            
            // REGOLA 1: Modalità POSITIVA (sfondo bianco) → Mostra emozione di Arianna
            if (!isPersonalMode) {
                feelingText.textContent = "Today Arianna is feeling ";
                // Aggiungi lo span per l'emozione
                const span = document.createElement('span');
                feelingText.appendChild(span);

                // Se Arianna ha un'emozione, mostrala
                if (friendCurrentEmotion) {
                    applyEmotion(friendCurrentEmotion);
                    updateFeelingText(friendCurrentEmotion);
                } else {
                    // Nessuna emozione ricevuta → pallina ferma e testo "..."
                    stopAllAnimations();
                    span.textContent = "...";
                }
            } 
            // REGOLA 2: Modalità NEGATIVA (sfondo nero) → Mostra SOLO la mia emozione
            else {
                feelingText.textContent = "Today I'm feeling ";
                // Aggiungi lo span per l'emozione
                const span = document.createElement('span');
                feelingText.appendChild(span);
                
                // Mostra la MIA emozione se l'ho già selezionata
                if (myCurrentEmotion) {
                    applyEmotion(myCurrentEmotion);
                    updateFeelingText(myCurrentEmotion);
                } else {
                    // Non ho ancora selezionato nulla → pallina ferma e testo "..."
                    stopAllAnimations();
                    span.textContent = "...";
                }
            }
            
            // 🔋 CRITICO: Aggiorna la dimensione del cerchio dopo il cambio modalità
            updateCircleSize();
            
            console.log(`Toggle modalità: ${isPersonalMode ? 'PERSONALE (io)' : 'POSITIVA (Giorgia)'}`);
            console.log(`Batterie attuali - Mia: ${myBatteryPercent}%, Giorgia: ${friendBatteryPercent}%`);
        });
    }

    // LOGICA EMOZIONI - Click sui bottoni (SOLO in modalità personale/negativa)
    emotionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // I bottoni sono visibili solo in modalità personale (negative/sfondo nero)
            if (widgetBody.classList.contains('negative')) { 
                const emotion = button.textContent.trim();
                
                // Salva la MIA emozione
                myCurrentEmotion = emotion;
                
                // Applica l'animazione localmente (solo nel MIO widget negativo)
                applyEmotion(emotion);
                
                // Aggiorna il testo con la mia emozione selezionata
                updateFeelingText(emotion);
                
                // SINCRONIZZAZIONE: Invia l'emozione al database per Giorgia
                window.dispatchEvent(new CustomEvent("emotionUpdate", { 
                    detail: { emotion: emotion } 
                }));
                
                console.log(`La mia emozione inviata: ${emotion}`);
            }
        });
    });

    // RICEZIONE EMOZIONE DA GIORGIA
    window.addEventListener("friendEmotionUpdate", (e) => {
        friendCurrentEmotion = e.detail.emotion;
        
        console.log(`Emozione ricevuta da Giorgia: ${friendCurrentEmotion}`);
        
        // Applica l'emozione di Giorgia SOLO se sono in modalità POSITIVA
        if (!isPersonalMode && friendCurrentEmotion) {
            applyEmotion(friendCurrentEmotion);
            updateFeelingText(friendCurrentEmotion);
        }
    });
    
    // LISTENER PER AGGIORNAMENTI BATTERIA
    
    // Aggiornamento della MIA batteria reale
    let batteryUpdateCount = 0;
    window.addEventListener("batteryUpdate", (e) => {
        batteryUpdateCount++;
        // FIX: Non convertire 0% in 100%! Usa ?? invece di ||
        const batteryValue = e.detail.percent ?? 100;
        myBatteryPercent = batteryValue;
        // Log solo se il valore è cambiato significativamente
        if (batteryUpdateCount % 10 === 1) {
            console.log(`Batteria aggiornata: ${batteryValue}%`);
        }
        updateCircleSize(); // Aggiorna SEMPRE, indipendentemente dalla modalità
    });

    // Aggiornamento della batteria reale di Arianna (ricevuta tramite db.js)
    let friendBatteryUpdateCount = 0;
    window.addEventListener("friendBatteryUpdate", (e) => {
        friendBatteryUpdateCount++;
        // FIX: Non convertire 0% in 100%! Usa ?? invece di ||  
        const ariannaBattery = e.detail.battery ?? 100;
        friendBatteryPercent = ariannaBattery;
        // Log solo occasionalmente per non intasare
        if (friendBatteryUpdateCount % 20 === 1) {
            console.log(`Batteria Arianna aggiornata: ${ariannaBattery}%`);
        }
        updateCircleSize(); // Aggiorna SEMPRE, indipendentemente dalla modalità
    });
    
    //  TEST IMMEDIATO per verificare il funzionamento
    console.log("=== TEST BATTERIE ===");
    console.log(`Prima del test: TUA=${myBatteryPercent}%, ARIANNA=${friendBatteryPercent}%`);
    
    // FORZO valori MOLTO diversi per 10 secondi
    const originalMy = myBatteryPercent;
    const originalFriend = friendBatteryPercent;
    
    //  MONITOR BATTERIE REALI
    setInterval(() => {
        console.log(` === BATTERIE REALI ===`);
        console.log(` TUA batteria: ${myBatteryPercent}% → ${calculateCircleSize(myBatteryPercent)}px`);
        console.log(` ARIANNA batteria: ${friendBatteryPercent}% → ${calculateCircleSize(friendBatteryPercent)}px`);
        console.log(` Modalità attiva: ${isPersonalMode ? 'TUA (sfondo bianco)' : 'ARIANNA (sfondo nero)'}`);
    }, 5000);
    
    updateCircleSize();
    
    if (!cerchio || emotionButtons.length === 0) {
        console.error("Elementi per l'animazione ('#cerchio' o bottoni emozione) non trovati.");
    }
});
