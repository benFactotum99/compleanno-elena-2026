/**
 * Google Apps Script — Riceve le RSVP dal sito e le salva nel foglio Google.
 *
 * Come usare:
 *  1. Apri script.google.com e crea un nuovo progetto collegato al tuo Google Sheet.
 *  2. Incolla questo intero file in Code.gs.
 *  3. Esegui initSheet() una volta per creare la riga di intestazione.
 *  4. Fai il deploy come Web App (vedi istruzioni in fondo).
 */

// ── Costanti ──────────────────────────────────────────────────────────────────

// Nome del foglio su cui scrivere le righe (modifica se necessario)
const SHEET_NAME = "RSVP";

// Intestazioni delle colonne
const HEADERS = ["Timestamp", "Nome", "Cognome", "Risposta"];

// ── Inizializzazione foglio (esegui una volta) ────────────────────────────────

function initSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Scrivi intestazioni solo se il foglio è vuoto
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

// ── doPost — punto di ingresso per le richieste POST ─────────────────────────

function doPost(e) {
  try {
    const body     = JSON.parse(e.postData.contents);
    const nome     = sanitize(body.nome      || "");
    const cognome  = sanitize(body.cognome   || "");
    const risposta = sanitize(body.risposta  || "");
    const ts       = sanitize(body.timestamp || new Date().toISOString());

    if (!nome || !cognome || !risposta) {
      return buildResponse({ result: "error", message: "Campi mancanti" }, 400);
    }

    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let   sheet = ss.getSheetByName(SHEET_NAME);

    // Crea il foglio al volo se non esiste ancora
    if (!sheet) {
      initSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    sheet.appendRow([ts, nome, cognome, risposta]);

    return buildResponse({ result: "success" });

  } catch (err) {
    return buildResponse({ result: "error", message: err.message }, 500);
  }
}

// ── doGet — risposta rapida per verificare che il deploy sia attivo ───────────

function doGet() {
  return buildResponse({ result: "ok", message: "Il servizio RSVP è attivo." });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitize(value) {
  return String(value).trim().replace(/<[^>]*>/g, "");
}

function buildResponse(payload, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/*
 ╔══════════════════════════════════════════════════════════════════════════╗
 ║  ISTRUZIONI PER IL DEPLOY (in italiano)                                 ║
 ╠══════════════════════════════════════════════════════════════════════════╣
 ║                                                                          ║
 ║  1. CREA IL GOOGLE SHEET                                                 ║
 ║     • Vai su sheets.google.com e crea un nuovo foglio.                  ║
 ║     • Chiamalo come preferisci (es. "RSVP Compleanno 2026").            ║
 ║                                                                          ║
 ║  2. APRI APPS SCRIPT                                                     ║
 ║     • Nel foglio, vai su Estensioni → Apps Script.                      ║
 ║     • Si apre l'editor di script collegato al foglio.                   ║
 ║                                                                          ║
 ║  3. INCOLLA IL CODICE                                                    ║
 ║     • Cancella il contenuto esistente di Code.gs.                       ║
 ║     • Incolla l'intero contenuto di questo file.                        ║
 ║     • Salva (Ctrl+S / Cmd+S).                                           ║
 ║                                                                          ║
 ║  4. ESEGUI L'INIZIALIZZAZIONE                                            ║
 ║     • Nella barra degli strumenti seleziona la funzione "initSheet".    ║
 ║     • Clicca ▶ Esegui.                                                   ║
 ║     • Approva le autorizzazioni richieste (accesso al foglio).          ║
 ║     • Dopo l'esecuzione troverai la riga di intestazione nel foglio.    ║
 ║                                                                          ║
 ║  5. DEPLOY COME WEB APP                                                  ║
 ║     • Clicca su Deploy → Nuovo deployment.                              ║
 ║     • Tipo di deployment: seleziona "App web".                          ║
 ║     • Descrizione: es. "RSVP v1".                                       ║
 ║     • Esegui come: Me (il tuo account Google).                          ║
 ║     • Chi ha accesso: Chiunque (Anyone).                                ║
 ║     • Clicca Deploy e autorizza di nuovo se richiesto.                  ║
 ║                                                                          ║
 ║  6. COPIA L'URL DEL DEPLOYMENT                                           ║
 ║     • Dopo il deploy apparirà un URL del tipo:                          ║
 ║       https://script.google.com/macros/s/XXXXX.../exec                  ║
 ║     • Copia quell'URL.                                                   ║
 ║                                                                          ║
 ║  7. AGGIORNA script.js                                                   ║
 ║     • Apri script.js nel tuo sito.                                      ║
 ║     • Sostituisci "YOUR_DEPLOYMENT_URL_HERE" con l'URL copiato.        ║
 ║                                                                          ║
 ║  NOTA: ogni volta che modifichi il codice devi creare un NUOVO          ║
 ║  deployment (non aggiornare il precedente) per evitare cache issues.    ║
 ╚══════════════════════════════════════════════════════════════════════════╝
*/
