// Range pesi del variable font (Inter/Archivo/IBM Plex Sans…)
const MIN_W = 100;
const MAX_W = 900;

// Range opacità (partire da 0.15 per evitare problemi di rendering)
const MIN_OPACITY = 0.15;
const MAX_OPACITY = 1.0;

function weightFrom(value, maxUnits) {
  // value: 0..(maxUnits-1)
  // mappa 0 → MIN_W, maxUnits-1 → MAX_W
  return MIN_W + (value / (maxUnits - 1)) * (MAX_W - MIN_W);
}

function opacityFromSteps(value, maxUnits) {
  // Crea scatti netti per ogni unità
  // value: 0..(maxUnits-1) 
  const step = (MAX_OPACITY - MIN_OPACITY) / (maxUnits - 1);
  return MIN_OPACITY + (value * step);
}

function updateClock() {
  const now = new Date();
  const h = now.getHours();    // 0..23
  const m = now.getMinutes();  // 0..59
  const s = now.getSeconds();  // 0..59

  // Calcolo pesi a scatti
  const hourWeight   = weightFrom(h, 24);  // cambia solo quando cambia l'ora
  const minuteWeight = weightFrom(m, 60);  // cambia solo quando cambia il minuto
  const secondWeight = weightFrom(s, 60);  // cambia ogni secondo

  // Calcolo opacità a scatti netti
  // Per le ore: scatto ogni ora (24 livelli totali)
  const hourOpacity = opacityFromSteps(h, 24);

  // Per i minuti: scatto ogni minuto (60 livelli totali) 
  const minuteOpacity = opacityFromSteps(m, 60);

  // Per i secondi: scatto ogni secondo (60 livelli totali)
  const secondOpacity = opacityFromSteps(s, 60);

  // Funzione per calcolare la compensazione in base al peso
  function getWeightCompensation(weight, letter = '') {
    // Compensa lo spostamento del carattere in base al peso
    // Il font Inter tende a espandersi verso destra con peso maggiore
    const normalizedWeight = (weight - MIN_W) / (MAX_W - MIN_W); // 0 a 1
    
    // Compensazioni specifiche per lettera
    let baseCompensation = 0;
    switch(letter) {
      case 'H': // HOURS
        baseCompensation = normalizedWeight * -1.5; // H si espande meno
        break;
      case 'M': // MINUTES  
        baseCompensation = normalizedWeight * -3.0; // M si espande di più
        break;
      case 'S': // SECONDS
        baseCompensation = normalizedWeight * -2.0; // S espansione media
        break;
      default:
        baseCompensation = normalizedWeight * -2.0;
    }
    
    return baseCompensation;
  }

  // Applica i pesi e le compensazioni
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  hoursEl.style.fontVariationSettings = `"wght" ${hourWeight}`;
  minutesEl.style.fontVariationSettings = `"wght" ${minuteWeight}`;
  secondsEl.style.fontVariationSettings = `"wght" ${secondWeight}`;

  // Applica le compensazioni di allineamento specifiche per lettera
  hoursEl.style.transform = `translateX(${getWeightCompensation(hourWeight, 'H')}px)`;
  minutesEl.style.transform = `translateX(${getWeightCompensation(minuteWeight, 'M')}px)`;
  secondsEl.style.transform = `translateX(${getWeightCompensation(secondWeight, 'S')}px)`;

  // Applica le opacità
  hoursEl.style.opacity = hourOpacity;
  minutesEl.style.opacity = minuteOpacity;
  secondsEl.style.opacity = secondOpacity;

  // Aggiorna il tempo per il tooltip
  window.currentTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  
  // Aggiorna il tooltip se è visibile
  const tooltip = document.getElementById('tooltip');
  if (tooltip && tooltip.classList.contains('show')) {
    tooltip.textContent = window.currentTime;
  }
}

updateClock();
setInterval(updateClock, 1000);

// Gestione blur basato sulla batteria
async function updateBlur() {
  try {
    const battery = await window.API.getBattery();
    const batteryPercent = battery.hasBattery ? battery.percent : 100;
    
    // Mappa il livello di batteria al blur: 100% = 0px blur, 0% = 10px blur
    const maxBlur = 10; // blur massimo in px
    const blurAmount = maxBlur * (1 - (batteryPercent / 100));
    
    // Applica il blur a tutti gli elementi di testo
    const textElements = document.querySelectorAll('.line-text');
    textElements.forEach(element => {
      element.style.filter = `blur(${blurAmount}px)`;
    });
    
    console.log(`Batteria: ${batteryPercent}%, Blur: ${blurAmount}px`); // Debug
  } catch (error) {
    console.error('Errore nel leggere la batteria:', error);
  }
}


// Aggiorna il blur ogni 5 secondi
setInterval(updateBlur, 5000);
updateBlur(); // Chiamata iniziale

// Gestione tooltip personalizzato
const tooltip = document.getElementById('tooltip');
const textElements = document.querySelectorAll('.line-text');

function updateTooltipPosition(e) {
  const x = e.clientX + 10;
  const y = e.clientY - 30;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

// Gestione trascinamento personalizzato
let isDragging = false;
let dragStartTime = 0;
const DRAG_THRESHOLD = 150; // millisecondi per distinguere click da drag

textElements.forEach(element => {
  let startX, startY, initialMouseX, initialMouseY;

  element.addEventListener('mousedown', (e) => {
    isDragging = false;
    dragStartTime = Date.now();
    
    // Ottieni la posizione iniziale della finestra
    window.API.getMousePosition().then(mousePos => {
      initialMouseX = mousePos.x;
      initialMouseY = mousePos.y;
      
      // Ottieni la posizione della finestra (approssimata)
      startX = initialMouseX - e.clientX;
      startY = initialMouseY - e.clientY;
    });

    const handleMouseMove = (e) => {
      const currentTime = Date.now();
      if (currentTime - dragStartTime > DRAG_THRESHOLD) {
        isDragging = true;
        
        // Nasconde il tooltip durante il trascinamento
        tooltip.classList.remove('show');
        
    
        window.API.getMousePosition().then(mousePos => {
          const newX = mousePos.x - (initialMouseX - startX);
          const newY = mousePos.y - (initialMouseY - startY);
          
          // Usa IPC per spostare la finestra
          window.API.moveWindow(newX, newY);
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Piccolo delay per permettere al tooltip di riapparire se non era un drag
      setTimeout(() => {
        isDragging = false;
      }, 50);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  // Modifica gli event listener esistenti per gestire il drag
  element.addEventListener('mouseenter', (e) => {
    if (!isDragging) {
      tooltip.textContent = window.currentTime || '00:00:00';
      tooltip.classList.add('show');
      updateTooltipPosition(e);
    }
  });

  element.addEventListener('mouseleave', () => {
    if (!isDragging) {
      tooltip.classList.remove('show');
    }
  });

  element.addEventListener('mousemove', (e) => {
    if (!isDragging) {
      updateTooltipPosition(e);
    }
  });
});

