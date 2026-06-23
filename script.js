// ── Deployment URL ────────────────────────────────────────────────────────────
// Sostituisci con l'URL ottenuto dopo il deploy dello script su Google Apps Script
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx6QyMuyC1VWJ-uRlQnZfB2Zijb-jHK8X7LkVqB9-IQjVf51PNH3AMzAjK9AcAz_zLF/exec";
// ─────────────────────────────────────────────────────────────────────────────

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
  const confirmIcon    = document.getElementById("confirmationIcon");
  const confirmText    = document.getElementById("confirmationText");
  const sicuroOverlay  = document.getElementById("sicuroOverlay");
  const btnSicuroSi    = document.getElementById("btnSicuroSi");
  const btnSicuroNo    = document.getElementById("btnSicuroNo");

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
    sendingInd.classList.remove("visible");
    rsvpForm.style.display = "none";

    confirmMsg.classList.remove("yes-response", "no-response");

    if (accepted) {
      confirmMsg.classList.add("yes-response");
      confirmIcon.textContent = "🎉";
      confirmText.textContent = "Grazie! Ti aspettiamo! 🥂";
    } else {
      confirmMsg.classList.add("no-response");
      confirmIcon.textContent = "😢";
      confirmText.textContent = "Ci dispiace tanto… speriamo di rivederti presto!";
    }

    confirmMsg.classList.add("visible");
  }

  function showError(message) {
    // Reuse confirmationMessage area for the error state
    confirmMsg.classList.remove("yes-response", "no-response", "visible");
    confirmMsg.style.background = "#FFF5F5";
    confirmIcon.textContent = "⚠️";
    confirmText.textContent = message;
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
