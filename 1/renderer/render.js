async function updateStats() {
  try {
    const battery = await window.API.getBattery();
    const cpuLoad = await window.API.getCpuLoad();
    const mem = await window.API.getMemory();
    const cpuInfo = await window.API.getCpuInfo();
    const processes = await window.API.getProcesses();
    const timeInfo = await window.API.getTimeInfo();

    //Battery
    async function updateBattery() {
  try {
    const battery = await window.API.getBattery();

    const percent = battery.hasBattery ? battery.percent.toFixed(0) : 0;

    // testo batteria
    document.getElementById("battery").innerText = battery.hasBattery
      ? percent
      : "N/A";

    // cerchio batteria
    const circleBattery = document.querySelector(".circle_battery");
    const opacity = battery.hasBattery ? percent / 100 : 0;

    circleBattery.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;

  } catch (err) {
    console.error("Errore nel caricamento batteria:", err);
  }
}

// aggiorna ogni secondo
setInterval(updateBattery, 1000);
updateBattery();


// Mouse Position
async function updateMouse() {
  try {
    const pos = await window.API.getMousePosition();

    // testo coordinate
    document.getElementById("mouse-coords").innerText = `X: ${pos.x}, Y: ${pos.y}`;

    // cerchio mouse
    const circleMouse = document.querySelector(".circle_mouse");

    // ruota in base alla posizione X
    // (dividere per 2 serve per evitare rotazioni troppo veloci)
    circleMouse.style.transform = `translate(-50%, -50%) rotate(${pos.x / 2}deg)`;

  } catch (err) {
    console.error("Errore mouse:", err);
  }
}

// aggiorna spesso per avere rotazione fluida
setInterval(updateMouse, 100);
updateMouse();

   
// RAM Usage
const ramPercent = ((mem.active / mem.total) * 100).toFixed(1);
document.getElementById("ram").innerText = ramPercent;

// cerchio RAM: più RAM usata = outline più visibile
const circleRam = document.querySelector(".circle_ram");
circleRam.style.opacity = 0.3 + (ramPercent / 100) * 0.7; // da 0.3 a 1
circleRam.style.outlineWidth = `${1 + (ramPercent / 100) * 2}px`; // da 1 a 3 px

//uptime

const circleUptime = document.querySelector(".circle_uptime");

let uptimeBlinkInterval;
let uptimeVisible = true;

function setUptimeBlinkSpeed(percent) {
  // ferma eventuale lampeggio precedente
  if (uptimeBlinkInterval) clearInterval(uptimeBlinkInterval);

  // mappa la percentuale in un intervallo di velocità (es. da 1000ms a 200ms)
  const minSpeed = 200;   // lampeggio veloce
  const maxSpeed = 1000;  // lampeggio lento
  const speed = maxSpeed - (percent / 100) * (maxSpeed - minSpeed);

  uptimeBlinkInterval = setInterval(() => {
    uptimeVisible = !uptimeVisible;
    circleUptime.style.opacity = uptimeVisible ? "1" : "0";
  }, speed);
}
// dentro updateStats()
const uptimeSeconds = timeInfo.uptime;
document.getElementById("uptime").innerText = formatTime(uptimeSeconds);

// Normalizza uptime per la velocità (puoi cambiare questa logica)
let percent = Math.min(100, Math.floor(uptimeSeconds / 60)); // max 100 dopo 1h
setUptimeBlinkSpeed(percent);


// CPU Load
const cpuPercent = cpuLoad.currentLoad.toFixed(1);
document.getElementById("cpu").innerText = cpuPercent;

// cerchio CPU - effetto battito
const circleCPU = document.querySelector(".circle_cpu");

// mappiamo la percentuale in un fattore di scala
// es. CPU 0% → scale 1.0 | CPU 100% → scale 1.2
const scale = 1 + (cpuPercent / 100) * 0.2;
circleCPU.style.transform = `translate(-50%, -50%) scale(${scale})`;

// CPU Thermometer
const circleThermo = document.querySelector(".circle_cpu_thermometer");

// simuliamo o prendiamo valore reale
// supponendo che `cpuInfo.mainTemp` restituisca i gradi
const temp = cpuInfo.mainTemp || 50;
document.getElementById("cpu-thermometer-label").innerText = cpuPercent + "%";

// Clamp valori: minimo 20°, massimo 100°
const minTemp = 20;
const maxTemp = 100;
const clamped = Math.min(maxTemp, Math.max(minTemp, temp));
const t = (clamped - minTemp) / (maxTemp - minTemp); // 0..1

// da bianco a rosso
const r = Math.round(255 * t + 255 * (1 - t));  // parte da 255 (bianco)
const g = Math.round(255 * (1 - t));            // scende con la temperatura
const b = Math.round(255 * (1 - t));            // idem

circleThermo.style.outlineColor = `rgb(${r}, ${g}, ${b})`;

// Glow quando supera soglia
if (temp > 80) {
  circleThermo.style.boxShadow = `0 0 15px 2px rgba(255, 0, 0, 0.6)`;
} else if (temp > 60) {
  circleThermo.style.boxShadow = `0 0 10px 1px rgba(255, 100, 0, 0.5)`;
} else {
  circleThermo.style.boxShadow = `none`;
}



    //shape battery
    document.getElementById("shape-battery").style.width =
      battery.percent.toFixed(0) + "px";
    document.getElementById("shape-battery").style.height =
      battery.percent.toFixed(0) + "px";
    //shape cpu
    document.getElementById("shape-cpu").style.transform = `scale(${
      cpuPercent / 30
    })`;

    //shape uptime
    //get hour from uptime
    const hour = Math.floor(timeInfo.uptime / 3600);
    console.log(hour);
    document.getElementById("shape-uptime").style.left = `${
      hour
    }%`;

    //shape ram
    document.getElementById(
      "shape-ram"
    ).style.transform = `rotate(${ramPercent}deg)`;

    //change all .shape background color in relation of the thermometer
    document.getElementById(
      "shape-ram"
    ).style.backgroundColor = `rgba(255, 255, 255, ${cpuPercent / 100})`;
  } catch (err) {
    console.error("Errore nel caricamento statistiche:", err);
  }
}

async function showMouseCoords() {
  const pos = await window.API.getMousePosition();
  console.log(`Mouse: x=${pos.x}, y=${pos.y}`);
  document.getElementById(
    "mouse-coords"
  ).innerText = `X: ${pos.x}, Y: ${pos.y}`;
  //shape mouse
  document.getElementById("shape-mouse").style.transform = `rotate(${
    pos.x / 2
  }deg)`;
}

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

setInterval(showMouseCoords, 500);
setInterval(updateStats, 1000);

showMouseCoords();
updateStats();
