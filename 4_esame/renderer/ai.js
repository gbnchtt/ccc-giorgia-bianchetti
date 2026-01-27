// === CONFIG ELEVEN LABS ===
const ELEVEN_API_KEY = "860242fbcb81aa8771713b82e605e559651e139f77a0e4fedf2dc84c3177f452";
const ELEVEN_VOICE_ID = "V8enPTWsjJLB0QHXJDFj";
// Aggiunta la gestione della velocità tramite il parametro "speed" nell'URL
const ELEVEN_URL = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}?output_format=mp3_44100_128`;

// === FUNZIONI TEXT-TO-SPEECH ===

/**
 * Converte un testo in audio utilizzando ElevenLabs API
 * @param {string} text - Il testo da convertire in audio
 * @returns {Promise<void>}
 */
async function speakMessage(text) {
  if (!text || text.trim() === '') {
    console.warn('Testo vuoto, non verrà riprodotto audio');
    return;
  }

  try {
    console.log('Generando audio per:', text);
    
    const response = await fetch(ELEVEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2', 
        voice_settings: {
          stability: 0.54,          // Impostata al 54%
          similarity_boost: 0.95,   // Impostata al 95%
          style: 0.0,               // Impostata a 0%
          use_speaker_boost: true,  // Attivato per migliorare la fedeltà del clone
          speed: 0.96               // Velocità impostata a 0.96
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} - ${response.statusText}`);
    }

    // Converti la risposta in blob audio
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Crea un elemento audio e riproducilo
    const audio = new Audio(audioUrl);
    
    // Gestisci la riproduzione
    audio.onloadeddata = () => {
      console.log('Audio caricato, avvio riproduzione...');
    };
    
    audio.onended = () => {
      console.log('Riproduzione audio completata');
      URL.revokeObjectURL(audioUrl);
    };
    
    audio.onerror = (error) => {
      console.error('Errore durante la riproduzione audio:', error);
      URL.revokeObjectURL(audioUrl);
    };
    
    // Avvia la riproduzione
    await audio.play();
    
  } catch (error) {
    console.error('Errore durante la generazione/riproduzione audio:', error);
    
    // Fallback: se ElevenLabs non funziona, usa la sintesi vocale del browser
    try {
      await speakWithBrowserTTS(text);
    } catch (fallbackError) {
      console.error('Anche il fallback TTS del browser ha fallito:', fallbackError);
    }
  }
}

/**
 * Fallback: utilizza la sintesi vocale nativa del browser
 */
function speakWithBrowserTTS(text) {
  return new Promise((resolve, reject) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'it-IT';
      utterance.rate = 0.96; // Sincronizzato con la velocità richiesta
      window.speechSynthesis.speak(utterance);
      utterance.onend = () => resolve();
      utterance.onerror = (err) => reject(err);
    } else {
      reject(new Error('TTS non supportato'));
    }
  });
}

// === ESPORTA FUNZIONI ===
window.aiSpeech = {
  speak: speakMessage,
  speakBrowser: speakWithBrowserTTS
};

// === MONITORAGGIO PAROLA "INVIA" PER DETTATURA SISTEMA ===
function setupAutoSendOnKeyword() {
  const messageInput = document.getElementById('messageInput');
  if (!messageInput) {
    setTimeout(setupAutoSendOnKeyword, 1000);
    return;
  }

  let hasStartedSpeaking = false;

  messageInput.addEventListener('input', function() {
    let text = this.value.trim();
    
    if (text.length > 0 && !hasStartedSpeaking) {
      hasStartedSpeaking = true;
      if (window.startSpeakingAnimation) {
        window.startSpeakingAnimation();
      }
    }
    
    const sendKeywords = /\b(invia|invio|manda|basta|fine|ok|okay|send|go|done|submit|finish|end|stop)\b\s*$/i;
    const match = text.match(sendKeywords);
    
    if (match && text.length > 3) {
      const messageToSend = text.replace(sendKeywords, '').trim();
      
      if (messageToSend.length > 0) {
        hasStartedSpeaking = false;
        this.value = '';
        this.blur();
        
        setTimeout(() => {
          if (window.autoSendMessage && typeof window.autoSendMessage === 'function') {
            window.autoSendMessage(messageToSend);
          }
        }, 100);
      }
    }
  });

  messageInput.addEventListener('blur', function() {
    if (this.value.trim() === '') {
      this.value = '';
      hasStartedSpeaking = false;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAutoSendOnKeyword);
} else {
  setupAutoSendOnKeyword();
}