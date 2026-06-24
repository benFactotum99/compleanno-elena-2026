// ── Deployment URL ────────────────────────────────────────────────────────────
// Sostituisci con l'URL ottenuto dopo il deploy dello script su Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx6QyMuyC1VWJ-uRlQnZfB2Zijb-jHK8X7LkVqB9-IQjVf51PNH3AMzAjK9AcAz_zLF/exec";
// ─────────────────────────────────────────────────────────────────────────────

// ── Translations ─────────────────────────────────────────────────────────────
const translations = {
  it: {
    'front-title':         'Hai ricevuto<br />un invito speciale',
    'click-hint':          'Clicca qui',
    'back-eyebrow':        'Sei invitato/a al',
    'back-name':           'Compleanno di Elena',
    'label-date':          'Data & Ora',
    'value-date':          'Martedì 7 Luglio 2026 · ore 20:15',
    'label-place':         'Luogo',
    'btn-rsvp':            'Rispondi',
    'rsvp-title':          'Ci sarai?',
    'label-nome':          'Nome',
    'placeholder-nome':    'Il tuo nome',
    'label-cognome':       'Cognome',
    'placeholder-cognome': 'Il tuo cognome',
    'error-nome':          'Inserisci il tuo nome',
    'error-cognome':       'Inserisci il tuo cognome',
    'btn-yes':             '🤙🏼  Sì, ci sarò!',
    'btn-no':              '❌  No, non posso.',
    'sending':             ' Invio in corso…',
    'sicuro-question':     'Sei sicura sicura?',
    'btn-sicuro-si':       'Sì',
    'btn-sicuro-no':       'Nah',
    'footer':              'Con affetto ❤️',
    'confirm-yes':         'Yeeeee! Ti aspetto!',
    'confirm-no':          'Va bene...',
  },
  zh: {
    'front-title':         '您收到了<br />一封特别邀请',
    'click-hint':          '点击这里',
    'back-eyebrow':        '您被邀请参加',
    'back-name':           'Elena 的生日派对',
    'label-date':          '日期和时间',
    'value-date':          '2026年7月7日 · 20:15',
    'label-place':         '地点',
    'btn-rsvp':            '回复',
    'rsvp-title':          '你会来吗？',
    'label-nome':          '名字',
    'placeholder-nome':    '你的名字',
    'label-cognome':       '姓氏',
    'placeholder-cognome': '你的姓氏',
    'error-nome':          '请输入你的名字',
    'error-cognome':       '请输入你的姓氏',
    'btn-yes':             '🤙🏼  会，我会去！',
    'btn-no':              '❌  不，我不能去。',
    'sending':             ' 发送中…',
    'sicuro-question':     '你真的确定吗？',
    'btn-sicuro-si':       '是',
    'btn-sicuro-no':       '不',
    'footer':              '带着爱 ❤️',
    'confirm-yes':         '太棒了！等你来！',
    'confirm-no':          '好吧...',
  }
};

let currentLang     = 'it';
let currentResponse = null;

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const flipCard       = document.getElementById("flipCard");
  const btnRsvp        = document.getElementById("btnRsvp");
  const rsvpSection    = document.getElementById("rsvpSection");
  const rsvpForm       = document.getElementById("rsvpForm");
  const nomeInput      = document.getElementById("nome");
  const cognomeInput   = document.getElementById("cognome");
  const nomeError      = document.getElementById("nomeError");
  const cognomeError   = document.getElementById("cognomeError");
  const btnYes         = document.getElementById("btnYes");
  const btnNo          = document.getElementById("btnNo");
  const sendingInd     = document.getElementById("sendingIndicator");
  const confirmMsg     = document.getElementById("confirmationMessage");
  const confirmGif     = document.getElementById("confirmationGif");
  const confirmText    = document.getElementById("confirmationText");
  const venueDetails   = document.getElementById("venueDetails");
  const sicuroOverlay  = document.getElementById("sicuroOverlay");
  const btnSicuroSi    = document.getElementById("btnSicuroSi");
  const btnSicuroNo    = document.getElementById("btnSicuroNo");
  const translateBtn   = document.getElementById("translateBtn");

  // ── Language toggle ──────────────────────────────────────────────────────────
  function applyTranslations(lang) {
    const t = translations[lang];

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (t[key] === undefined) return;
      if (key === "front-title") {
        el.innerHTML = t[key];
      } else {
        el.textContent = t[key];
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if (t[key] !== undefined) el.placeholder = t[key];
    });

    if (currentResponse === "yes") confirmText.textContent = t["confirm-yes"];
    else if (currentResponse === "no") confirmText.textContent = t["confirm-no"];

    translateBtn.textContent = lang === "it" ? "🇨🇳 中文" : "🇮🇹 Italiano";
    translateBtn.setAttribute("aria-label", lang === "it" ? "Traduci in cinese" : "翻译成意大利语");
    document.documentElement.lang = lang === "it" ? "it" : "zh-Hans";
  }

  translateBtn.addEventListener("click", () => {
    currentLang = currentLang === "it" ? "zh" : "it";
    applyTranslations(currentLang);
  });

  let isFlipped = false;

  // ── Flip Card ───────────────────────────────────────────────────────────────
  function flipCardToggle() {
    isFlipped = !isFlipped;
    flipCard.classList.toggle("flipped", isFlipped);

    flipCard.querySelector(".flip-card-front").setAttribute("aria-hidden", isFlipped);
    flipCard.querySelector(".flip-card-back").setAttribute("aria-hidden", !isFlipped);

    // Il form viene rivelato solo dal pulsante nel retro, non qui
  }

  flipCard.addEventListener("click", flipCardToggle);

  flipCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flipCardToggle();
    }
  });

  // Bottone sul retro: mostra il form e impedisce che il click ribalti di nuovo la card
  btnRsvp.addEventListener("click", (e) => {
    e.stopPropagation();
    btnRsvp.style.display = "none";
    document.querySelector(".page-wrapper").classList.add("rsvp-open");
    rsvpSection.style.display = "block";
    // Due frame di ritardo: il browser deve calcolare il layout prima che la transizione parta
    requestAnimationFrame(() => requestAnimationFrame(() => {
      rsvpSection.classList.add("visible");
      setTimeout(() => rsvpSection.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    }));
  });

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateField(input, errorEl) {
    const isValid = input.value.trim().length > 0;
    input.classList.toggle("invalid", !isValid);
    errorEl.classList.toggle("visible", !isValid);
    return isValid;
  }

  function validateForm() {
    const nomeOk    = validateField(nomeInput, nomeError);
    const cognomeOk = validateField(cognomeInput, cognomeError);
    return nomeOk && cognomeOk;
  }

  // Live validation: clear error once the user starts typing
  nomeInput.addEventListener("input", () => validateField(nomeInput, nomeError));
  cognomeInput.addEventListener("input", () => validateField(cognomeInput, cognomeError));

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(risposta) {
    if (!validateForm()) return;

    const payload = {
      nome:      nomeInput.value.trim(),
      cognome:   cognomeInput.value.trim(),
      risposta,
      timestamp: new Date().toISOString(),
    };

    // Disable controls during sending
    setFormDisabled(true);
    sendingInd.classList.add("visible");

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        mode: "no-cors", // evita il preflight
        headers: {
          "Content-Type": "text/plain", // non "application/json"
        },
        method:  "POST",
        body:    JSON.stringify(payload),
      });

      showConfirmation(risposta === "Sì");

      /*
      const data = await response.json();

      if (data.result === "success") {
        showConfirmation(risposta === "Sì");
      } else {
        throw new Error("Unexpected response");
      }
      */
    } catch {
      // Re-enable on network error so the user can retry
      sendingInd.classList.remove("visible");
      setFormDisabled(false);
      showError("Si è verificato un errore. Riprova tra qualche secondo.");
    }
  }

  btnYes.addEventListener("click", () => handleSubmit("Sì"));

  btnNo.addEventListener("click", () => {
    if (!validateForm()) return;
    sicuroOverlay.classList.add("visible");
    sicuroOverlay.setAttribute("aria-hidden", "false");
  });

  btnSicuroNo.addEventListener("click", () => {
    sicuroOverlay.classList.remove("visible");
    sicuroOverlay.setAttribute("aria-hidden", "true");
  });

  btnSicuroSi.addEventListener("click", () => {
    sicuroOverlay.classList.remove("visible");
    sicuroOverlay.setAttribute("aria-hidden", "true");
    handleSubmit("No");
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function setFormDisabled(disabled) {
    nomeInput.disabled    = disabled;
    cognomeInput.disabled = disabled;
    btnYes.disabled       = disabled;
    btnNo.disabled        = disabled;
  }

  function showConfirmation(accepted) {
    currentResponse = accepted ? "yes" : "no";
    const t = translations[currentLang];

    sendingInd.classList.remove("visible");
    rsvpForm.style.display = "none";
    document.querySelector(".flip-card-container").style.display = "none";

    confirmMsg.classList.remove("yes-response", "no-response");

    if (accepted) {
      confirmMsg.classList.add("yes-response");
      confirmGif.src = "img/gato-fofo.gif";
      confirmGif.alt = "gato fofo";
      confirmText.textContent = t["confirm-yes"];
      venueDetails.classList.add("visible");
      launchConfetti();
    } else {
      confirmMsg.classList.add("no-response");
      confirmGif.src = "img/dog-scroll.gif";
      confirmGif.alt = "criceto triste";
      confirmText.textContent = t["confirm-no"];
      venueDetails.classList.remove("visible");
    }

    confirmMsg.classList.add("visible");
    document.querySelector(".page-wrapper").classList.add("confirmation-open");
    window.scrollTo(0, 0);
  }

  function launchConfetti() {
    const colors = ["#7DC8E8", "#5AAED4", "#F5C842", "#FDE98A", "#ffffff"];
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors });
    setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors }), 200);
    setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors }), 400);
  }

  function showError(message) {
    // Reuse confirmationMessage area for the error state
    confirmMsg.classList.remove("yes-response", "no-response", "visible");
    confirmMsg.style.background = "#FFF5F5";
    confirmGif.src = "";
    confirmGif.alt = "";
    confirmText.textContent = "⚠️ " + message;
    confirmText.style.color = "#C53030";
    confirmMsg.classList.add("visible");

    // Auto-hide after 5 s and reset style
    setTimeout(() => {
      confirmMsg.classList.remove("visible");
      confirmMsg.style.background = "";
      confirmText.style.color = "";
    }, 5000);
  }
});
