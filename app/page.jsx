import { useState, useEffect, useCallback } from "react";

// ── Palette & styles globaux ──────────────────────────────────────────────────
const COLORS = {
  navy: "#1B2A4A",
  navyLight: "#243559",
  gold: "#C9A84C",
  goldLight: "#E8C96A",
  cream: "#FAF7F2",
  creamDark: "#F0EBE0",
  sage: "#7A9E7E",
  text: "#1B2A4A",
  textLight: "#6B7A99",
  white: "#FFFFFF",
  red: "#C0392B",
  green: "#2E7D52",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: ${COLORS.cream};
    color: ${COLORS.text};
    min-height: 100vh;
  }

  .app-wrapper {
    min-height: 100vh;
    background: ${COLORS.cream};
  }

  /* Header */
  .header {
    background: ${COLORS.navy};
    padding: 20px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid ${COLORS.gold};
  }
  .header-title {
    font-family: 'Playfair Display', serif;
    color: ${COLORS.white};
    font-size: 1.3rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .header-sub {
    color: ${COLORS.gold};
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-top: 2px;
  }
  .header-badge {
    background: ${COLORS.gold};
    color: ${COLORS.navy};
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 20px;
  }

  /* Nav tabs */
  .nav-tabs {
    background: ${COLORS.navyLight};
    display: flex;
    gap: 0;
    border-bottom: 1px solid rgba(201,168,76,0.3);
  }
  .nav-tab {
    padding: 14px 24px;
    color: rgba(255,255,255,0.55);
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    background: none;
    border-bottom: 3px solid transparent;
    transition: all 0.2s;
  }
  .nav-tab:hover { color: rgba(255,255,255,0.85); }
  .nav-tab.active {
    color: ${COLORS.gold};
    border-bottom-color: ${COLORS.gold};
  }

  /* Main content */
  .main { padding: 32px; max-width: 1000px; margin: 0 auto; }

  /* Cards */
  .card {
    background: ${COLORS.white};
    border: 1px solid ${COLORS.creamDark};
    border-radius: 12px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(27,42,74,0.06);
  }
  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    color: ${COLORS.navy};
    margin-bottom: 20px;
    padding-bottom: 14px;
    border-bottom: 1px solid ${COLORS.creamDark};
  }

  /* Inputs */
  .field { margin-bottom: 16px; }
  .field label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${COLORS.textLight};
    margin-bottom: 6px;
  }
  .field input, .field select, .field textarea {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid ${COLORS.creamDark};
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.92rem;
    color: ${COLORS.text};
    background: ${COLORS.cream};
    transition: border-color 0.2s;
    outline: none;
  }
  .field input:focus, .field select:focus, .field textarea:focus {
    border-color: ${COLORS.gold};
    background: ${COLORS.white};
  }
  .field textarea { min-height: 90px; resize: vertical; }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

  /* Buttons */
  .btn {
    padding: 11px 22px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }
  .btn-primary {
    background: ${COLORS.navy};
    color: ${COLORS.white};
  }
  .btn-primary:hover { background: ${COLORS.navyLight}; transform: translateY(-1px); }
  .btn-gold {
    background: ${COLORS.gold};
    color: ${COLORS.navy};
  }
  .btn-gold:hover { background: ${COLORS.goldLight}; transform: translateY(-1px); }
  .btn-outline {
    background: transparent;
    color: ${COLORS.navy};
    border: 1.5px solid ${COLORS.navy};
  }
  .btn-outline:hover { background: ${COLORS.cream}; }
  .btn-danger {
    background: transparent;
    color: ${COLORS.red};
    border: 1.5px solid ${COLORS.red};
    padding: 7px 14px;
    font-size: 0.78rem;
  }
  .btn-sm { padding: 7px 14px; font-size: 0.78rem; }
  .btn-full { width: 100%; justify-content: center; display: flex; align-items: center; gap: 6px; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

  /* Status badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .badge-green { background: #E8F5EE; color: ${COLORS.green}; }
  .badge-orange { background: #FEF3E2; color: #C17B2A; }
  .badge-gray { background: #F0EBE0; color: ${COLORS.textLight}; }
  .badge-red { background: #FDECEA; color: ${COLORS.red}; }

  /* Table */
  .table { width: 100%; border-collapse: collapse; }
  .table th {
    text-align: left;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${COLORS.textLight};
    padding: 10px 14px;
    border-bottom: 2px solid ${COLORS.creamDark};
  }
  .table td {
    padding: 13px 14px;
    border-bottom: 1px solid ${COLORS.creamDark};
    font-size: 0.88rem;
    vertical-align: middle;
  }
  .table tr:last-child td { border-bottom: none; }
  .table tr:hover td { background: ${COLORS.cream}; }

  /* Créneau chips */
  .creneau-chip {
    display: inline-block;
    padding: 4px 10px;
    background: ${COLORS.cream};
    border: 1px solid ${COLORS.creamDark};
    border-radius: 6px;
    font-size: 0.8rem;
    color: ${COLORS.navy};
    font-weight: 500;
  }
  .creneau-chip.reserved {
    background: #E8F5EE;
    border-color: #A8D5B5;
    color: ${COLORS.green};
  }

  /* Slot list */
  .slot-list { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; }
  .slot-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: ${COLORS.cream};
    border: 1px solid ${COLORS.creamDark};
    border-radius: 8px;
    font-size: 0.88rem;
  }
  .slot-item.reserved {
    border-color: #A8D5B5;
    background: #F0FAF4;
  }

  /* Interview split view */
  .interview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-top: 20px;
  }
  .interview-col {
    background: ${COLORS.white};
    border: 1px solid ${COLORS.creamDark};
    border-radius: 12px;
    overflow: hidden;
  }
  .interview-col-header {
    padding: 14px 20px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-bottom: 1px solid ${COLORS.creamDark};
  }
  .interview-col-header.left {
    background: ${COLORS.navy};
    color: ${COLORS.gold};
  }
  .interview-col-header.right {
    background: ${COLORS.gold};
    color: ${COLORS.navy};
  }
  .interview-col-body { padding: 20px; }

  .qa-item { margin-bottom: 20px; }
  .qa-question {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${COLORS.textLight};
    margin-bottom: 6px;
  }
  .qa-answer {
    font-size: 0.9rem;
    color: ${COLORS.text};
    line-height: 1.6;
    background: ${COLORS.cream};
    padding: 10px 14px;
    border-radius: 8px;
    border-left: 3px solid ${COLORS.gold};
    font-style: italic;
  }

  .note-area {
    width: 100%;
    min-height: 120px;
    padding: 11px 14px;
    border: 1.5px solid ${COLORS.creamDark};
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: ${COLORS.text};
    background: ${COLORS.cream};
    resize: vertical;
    margin-bottom: 14px;
    transition: border-color 0.2s;
    outline: none;
  }
  .note-area:focus { border-color: ${COLORS.gold}; background: ${COLORS.white}; }
  .note-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${COLORS.textLight};
    margin-bottom: 6px;
  }

  /* CR modal */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(27,42,74,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    backdrop-filter: blur(3px);
  }
  .modal {
    background: ${COLORS.white};
    border-radius: 14px;
    width: 90%; max-width: 700px;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(27,42,74,0.25);
  }
  .modal-header {
    padding: 24px 28px 18px;
    border-bottom: 1px solid ${COLORS.creamDark};
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .modal-body { padding: 24px 28px; }
  .modal-footer {
    padding: 18px 28px;
    border-top: 1px solid ${COLORS.creamDark};
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .cr-content {
    background: ${COLORS.cream};
    border-radius: 10px;
    padding: 20px;
    font-size: 0.88rem;
    line-height: 1.8;
    white-space: pre-wrap;
    color: ${COLORS.text};
    border: 1px solid ${COLORS.creamDark};
    max-height: 400px;
    overflow-y: auto;
  }

  /* Login */
  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${COLORS.navy};
  }
  .login-card {
    background: ${COLORS.white};
    border-radius: 16px;
    padding: 48px 40px;
    width: 360px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    text-align: center;
  }
  .login-icon { font-size: 2.5rem; margin-bottom: 16px; }
  .login-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem;
    color: ${COLORS.navy};
    margin-bottom: 6px;
  }
  .login-sub { color: ${COLORS.textLight}; font-size: 0.85rem; margin-bottom: 28px; }

  /* Maîtresse view */
  .maitresse-wrap {
    min-height: 100vh;
    background: linear-gradient(160deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
  }
  .maitresse-card {
    background: ${COLORS.white};
    border-radius: 20px;
    width: 100%;
    max-width: 520px;
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(0,0,0,0.3);
  }
  .maitresse-header {
    background: ${COLORS.navy};
    padding: 28px 32px;
    border-bottom: 3px solid ${COLORS.gold};
  }
  .maitresse-header h1 {
    font-family: 'Playfair Display', serif;
    color: ${COLORS.white};
    font-size: 1.3rem;
    margin-bottom: 4px;
  }
  .maitresse-header p { color: ${COLORS.gold}; font-size: 0.82rem; font-weight: 500; }
  .maitresse-body { padding: 32px; }

  .slot-btn {
    width: 100%;
    padding: 16px 20px;
    border: 2px solid ${COLORS.creamDark};
    border-radius: 12px;
    background: ${COLORS.cream};
    text-align: left;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    color: ${COLORS.navy};
    font-weight: 500;
    transition: all 0.2s;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .slot-btn:hover { border-color: ${COLORS.gold}; background: #FFFBF0; }
  .slot-btn.selected {
    border-color: ${COLORS.gold};
    background: #FFFBF0;
    box-shadow: 0 0 0 3px rgba(201,168,76,0.2);
  }

  .progress-bar {
    height: 5px;
    background: ${COLORS.creamDark};
    border-radius: 3px;
    margin-bottom: 24px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: ${COLORS.gold};
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .q-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.25rem;
    color: ${COLORS.navy};
    line-height: 1.5;
    margin-bottom: 20px;
  }

  .success-wrap {
    text-align: center;
    padding: 40px 20px;
  }
  .success-icon { font-size: 3rem; margin-bottom: 16px; }
  .success-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem;
    color: ${COLORS.navy};
    margin-bottom: 10px;
  }
  .success-text { color: ${COLORS.textLight}; font-size: 0.9rem; line-height: 1.6; }

  .loading-dots { display: inline-flex; gap: 4px; }
  .loading-dots span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: ${COLORS.gold};
    animation: bounce 1.2s infinite;
  }
  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-6px); opacity: 1; }
  }

  .empty-state {
    text-align: center;
    padding: 48px 20px;
    color: ${COLORS.textLight};
  }
  .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }

  .info-box {
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 0.84rem;
    color: #1E40AF;
    margin-bottom: 16px;
  }

  .divider {
    border: none;
    border-top: 1px solid ${COLORS.creamDark};
    margin: 20px 0;
  }

  @media (max-width: 640px) {
    .main { padding: 16px; }
    .field-row, .field-row-3 { grid-template-columns: 1fr; }
    .interview-grid { grid-template-columns: 1fr; }
  }
`;

// ── Données initiales ─────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 1, bloc: "Bilan de l'année", text: "Comment décririez-vous cette année scolaire en quelques mots ?" },
  { id: 2, bloc: "Bilan de l'année", text: "Quelles sont vos principales fiertés sur cette année ?" },
  { id: 3, bloc: "Bilan de l'année", text: "Quelles difficultés avez-vous rencontrées (pédagogiques, organisationnelles, relationnelles) ?" },
  { id: 4, bloc: "Relation avec l'équipe", text: "Comment vivez-vous votre intégration dans l'équipe ?" },
  { id: 5, bloc: "Relation avec l'équipe", text: "Y a-t-il des points sur lesquels vous auriez eu besoin de plus de soutien de la direction ?" },
  { id: 6, bloc: "Regard sur les élèves", text: "Comment évaluez-vous la dynamique de votre classe cette année ?" },
  { id: 7, bloc: "Regard sur les élèves", text: "Y a-t-il des situations avec des élèves ou des familles qui ont été particulièrement difficiles à gérer ?" },
  { id: 8, bloc: "Perspectives", text: "Quelles sont vos envies ou priorités pour l'année prochaine ?" },
  { id: 9, bloc: "Perspectives", text: "Y a-t-il une formation ou un accompagnement que vous souhaiteriez ?" },
  { id: 10, bloc: "Expression libre", text: "Y a-t-il des sujets que vous souhaitez aborder lors de l'entretien ?" },
];

const ADMIN_PASSWORD = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ADMIN_PASSWORD) || "ecole2026";

const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};
const formatDateShort = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

// ── Configuration — à mettre à jour après déploiement ────────────────────────
const BASE_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_URL) || "https://pastoureaux.rh.bev-ops.com";

// ── Gmail via Anthropic MCP ───────────────────────────────────────────────────


async function sendEmailViaGmail({ to, subject, body }) {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body }),
    });
    const data = await res.json();
    return { success: !data.error };
  } catch (e) {
    console.error("Erreur envoi mail:", e);
    return { success: false };
  }
}

// ── Helpers emails ────────────────────────────────────────────────────────────
async function sendInvitation(maitresse) {
  return sendEmailViaGmail({
    to: maitresse.email,
    subject: "📅 Entretiens annuels 2025-2026 — Réservez votre créneau",
    body: `Bonjour ${maitresse.prenom},

La direction vous invite à réserver votre créneau d'entretien annuel pour l'année scolaire 2025-2026.

Pour choisir votre créneau, cliquez sur le lien ci-dessous :
👉 ${BASE_URL}/reservation?id=${maitresse.id}

Une fois votre créneau réservé, vous recevrez automatiquement un lien pour remplir votre questionnaire pré-entretien.

Cordialement,
La Direction`,
  });
}

async function sendQuestionnaireLink(maitresse, slotLabel) {
  return sendEmailViaGmail({
    to: maitresse.email,
    subject: "✅ Créneau confirmé — Questionnaire pré-entretien",
    body: `Bonjour ${maitresse.prenom},

Votre entretien annuel est confirmé : ${slotLabel}.

Merci de bien vouloir remplir votre questionnaire pré-entretien avant la date de l'entretien :
👉 ${BASE_URL}/questionnaire?id=${maitresse.id}

Cela nous permettra de préparer au mieux notre échange.

Cordialement,
La Direction`,
  });
}

async function sendCRWithSignature(maitresse, slotLabel, crText) {
  return sendEmailViaGmail({
    to: maitresse.email,
    subject: "📄 Compte-rendu de votre entretien annuel 2025-2026",
    body: `Bonjour ${maitresse.prenom},

Veuillez trouver ci-dessous le compte-rendu de votre entretien annuel du ${slotLabel}.

---

${crText}

---

Pour signer électroniquement ce document, cliquez sur le lien suivant :
👉 ${BASE_URL}/signature?id=${maitresse.id}

Cordialement,
La Direction`,
  });
}

// ── Storage helpers ───────────────────────────────────────────────────────────
const store = {
  async get(key) {
    try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; }
  },
  async set(key, val) {
    try { await window.storage.set(key, JSON.stringify(val)); } catch (e) { console.error(e); }
  },
};

// ── Composants utilitaires ────────────────────────────────────────────────────
const LoadingDots = () => (
  <span className="loading-dots">
    <span /><span /><span />
  </span>
);

// ── Vue MAÎTRESSE : Réservation ───────────────────────────────────────────────
function MaitresseReservation({ maitresse, slots, onReserved }) {
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);

  const freeSlots = slots.filter(s => !s.reservedBy);

  const confirm = async () => {
    if (!selected) return;
    const updated = slots.map(s =>
      s.id === selected ? { ...s, reservedBy: maitresse.id, reservedAt: new Date().toISOString() } : s
    );
    await store.set("slots", updated);
    const maitresses = (await store.get("maitresses")) || [];
    const updatedM = maitresses.map(m =>
      m.id === maitresse.id ? { ...m, slotId: selected, status: "reserved" } : m
    );
    await store.set("maitresses", updatedM);
    // Envoyer le lien questionnaire par mail
    const slot = slots.find(s => s.id === selected);
    const label = slot ? `${formatDate(slot.date)} à ${slot.heure}` : "";
    try { await sendQuestionnaireLink(maitresse, label); } catch(e) { console.error(e); }
    setDone(true);
    if (onReserved) onReserved(selected);
  };

  if (done) return (
    <div className="maitresse-wrap">
      <div className="maitresse-card">
        <div className="maitresse-header">
          <h1>🏫 Entretiens 2025-2026</h1>
          <p>École Notre-Dame</p>
        </div>
        <div className="maitresse-body">
          <div className="success-wrap">
            <div className="success-icon">✅</div>
            <div className="success-title">Créneau réservé !</div>
            <p className="success-text">
              Merci {maitresse.prenom}.<br />
              Vous recevrez un mail de confirmation avec le lien pour remplir votre questionnaire.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="maitresse-wrap">
      <div className="maitresse-card">
        <div className="maitresse-header">
          <h1>🏫 Entretiens 2025-2026</h1>
          <p>Bonjour {maitresse.prenom} 👋</p>
        </div>
        <div className="maitresse-body">
          <p style={{ marginBottom: 20, color: COLORS.textLight, fontSize: "0.9rem", lineHeight: 1.6 }}>
            Choisissez le créneau qui vous convient pour votre entretien annuel avec la direction.
          </p>
          {freeSlots.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p>Aucun créneau disponible pour le moment.<br />Contactez la direction.</p>
            </div>
          ) : (
            freeSlots.map(slot => (
              <button
                key={slot.id}
                className={`slot-btn ${selected === slot.id ? "selected" : ""}`}
                onClick={() => setSelected(slot.id)}
              >
                <span>
                  <strong>{formatDate(slot.date)}</strong>
                  <span style={{ color: COLORS.textLight, marginLeft: 8 }}>à {slot.heure}</span>
                </span>
                {selected === slot.id && <span style={{ color: COLORS.gold, fontWeight: 700 }}>✓</span>}
              </button>
            ))
          )}
          {freeSlots.length > 0 && (
            <button
              className="btn btn-gold btn-full"
              style={{ marginTop: 8 }}
              onClick={confirm}
              disabled={!selected}
            >
              ✔️ Je confirme ce créneau
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Vue MAÎTRESSE : Questionnaire ─────────────────────────────────────────────
function MaitresseQuestionnaire({ maitresse, onDone }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const q = QUESTIONS[current];
  const progress = ((current) / QUESTIONS.length) * 100;

  const next = async () => {
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1);
    } else {
      const maitresses = (await store.get("maitresses")) || [];
      const updated = maitresses.map(m =>
        m.id === maitresse.id ? { ...m, answers, questionnaireAt: new Date().toISOString(), status: m.status === "reserved" ? "questionnaire_done" : m.status } : m
      );
      await store.set("maitresses", updated);
      setDone(true);
      if (onDone) onDone();
    }
  };

  if (done) return (
    <div className="maitresse-wrap">
      <div className="maitresse-card">
        <div className="maitresse-header">
          <h1>🏫 Entretiens 2025-2026</h1>
          <p>Questionnaire complété</p>
        </div>
        <div className="maitresse-body">
          <div className="success-wrap">
            <div className="success-icon">🎉</div>
            <div className="success-title">Merci {maitresse.prenom} !</div>
            <p className="success-text">
              Vos réponses ont bien été enregistrées.<br />
              La direction les consultera avant votre entretien.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="maitresse-wrap">
      <div className="maitresse-card">
        <div className="maitresse-header">
          <h1>📝 Avant votre entretien</h1>
          <p>Question {current + 1} sur {QUESTIONS.length}</p>
        </div>
        <div className="maitresse-body">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p style={{ fontSize: "0.72rem", color: COLORS.textLight, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontWeight: 600 }}>
            {q.bloc}
          </p>
          <p className="q-title">{q.text}</p>
          <textarea
            className="note-area"
            placeholder="Écrivez ici..."
            value={answers[q.id] || ""}
            onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
          />
          <button className="btn btn-gold btn-full" onClick={next}>
            {current < QUESTIONS.length - 1 ? "Question suivante →" : "Envoyer mes réponses ✓"}
          </button>
          {current > 0 && (
            <button
              className="btn btn-outline btn-full"
              style={{ marginTop: 10 }}
              onClick={() => setCurrent(c => c - 1)}
            >
              ← Précédente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin : Créneaux ──────────────────────────────────────────────────────────
function AdminCreneaux({ slots, setSlots }) {
  const [plage, setPlage] = useState({ debut: "", fin: "", heureDebut: "09:00", heureFin: "17:00", duree: "45", pauseDebut: "12:00", pauseFin: "13:30" });
  const [manuel, setManuel] = useState({ date: "", heure: "" });

  const generateSlots = async () => {
    const { debut, fin, heureDebut, heureFin, duree, pauseDebut, pauseFin } = plage;
    if (!debut || !fin) return;
    const generated = [];
    let cur = new Date(debut);
    const end = new Date(fin);
    const dur = parseInt(duree);

    while (cur <= end) {
      const [hD, mD] = heureDebut.split(":").map(Number);
      const [hF, mF] = heureFin.split(":").map(Number);
      let t = hD * 60 + mD;
      const tEnd = hF * 60 + mF;
      const [pD, pM] = pauseDebut.split(":").map(Number);
      const [pF, pFm] = pauseFin.split(":").map(Number);
      const pauseS = pD * 60 + pM;
      const pauseE = pF * 60 + pFm;

      while (t + dur <= tEnd) {
        if (t >= pauseS && t < pauseE) { t = pauseE; continue; }
        const h = String(Math.floor(t / 60)).padStart(2, "0");
        const m = String(t % 60).padStart(2, "0");
        const dateStr = cur.toISOString().split("T")[0];
        generated.push({ id: `${dateStr}-${h}${m}`, date: dateStr, heure: `${h}h${m}`, reservedBy: null });
        t += dur;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const merged = [...slots, ...generated.filter(g => !slots.find(s => s.id === g.id))];
    merged.sort((a, b) => a.id.localeCompare(b.id));
    await store.set("slots", merged);
    setSlots(merged);
  };

  const addManuel = async () => {
    if (!manuel.date || !manuel.heure) return;
    const id = `${manuel.date}-${manuel.heure.replace(":", "")}`;
    if (slots.find(s => s.id === id)) return;
    const heure = manuel.heure.replace(":", "h");
    const newSlot = { id, date: manuel.date, heure, reservedBy: null };
    const updated = [...slots, newSlot].sort((a, b) => a.id.localeCompare(b.id));
    await store.set("slots", updated);
    setSlots(updated);
    setManuel({ date: "", heure: "" });
  };

  const deleteSlot = async (id) => {
    const updated = slots.filter(s => s.id !== id);
    await store.set("slots", updated);
    setSlots(updated);
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">⚡ Générer des créneaux automatiquement</div>
        <div className="field-row">
          <div className="field"><label>Date de début</label><input type="date" value={plage.debut} onChange={e => setPlage(p => ({ ...p, debut: e.target.value }))} /></div>
          <div className="field"><label>Date de fin</label><input type="date" value={plage.fin} onChange={e => setPlage(p => ({ ...p, fin: e.target.value }))} /></div>
        </div>
        <div className="field-row-3">
          <div className="field"><label>Heure début</label><input type="time" value={plage.heureDebut} onChange={e => setPlage(p => ({ ...p, heureDebut: e.target.value }))} /></div>
          <div className="field"><label>Heure fin</label><input type="time" value={plage.heureFin} onChange={e => setPlage(p => ({ ...p, heureFin: e.target.value }))} /></div>
          <div className="field"><label>Durée (min)</label><input type="number" value={plage.duree} min="15" max="120" onChange={e => setPlage(p => ({ ...p, duree: e.target.value }))} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Pause — début</label><input type="time" value={plage.pauseDebut} onChange={e => setPlage(p => ({ ...p, pauseDebut: e.target.value }))} /></div>
          <div className="field"><label>Pause — fin</label><input type="time" value={plage.pauseFin} onChange={e => setPlage(p => ({ ...p, pauseFin: e.target.value }))} /></div>
        </div>
        <button className="btn btn-primary" onClick={generateSlots}>✚ Générer les créneaux</button>
      </div>

      <div className="card">
        <div className="card-title">✏️ Ajouter un créneau manuel</div>
        <div className="field-row">
          <div className="field"><label>Date</label><input type="date" value={manuel.date} onChange={e => setManuel(m => ({ ...m, date: e.target.value }))} /></div>
          <div className="field"><label>Heure</label><input type="time" value={manuel.heure} onChange={e => setManuel(m => ({ ...m, heure: e.target.value }))} /></div>
        </div>
        <button className="btn btn-primary" onClick={addManuel} disabled={!manuel.date || !manuel.heure}>✚ Ajouter</button>
      </div>

      <div className="card">
        <div className="card-title">📅 Créneaux ({slots.length})</div>
        {slots.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📅</div><p>Aucun créneau créé</p></div>
        ) : (
          <div className="slot-list">
            {slots.map(s => (
              <div key={s.id} className={`slot-item ${s.reservedBy ? "reserved" : ""}`}>
                <span style={{ fontWeight: 500 }}>{formatDate(s.date)} — {s.heure}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {s.reservedBy
                    ? <span className="badge badge-green">✅ Réservé</span>
                    : <span className="badge badge-gray">Libre</span>}
                  {!s.reservedBy && (
                    <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(s.id)}>🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Admin : Maîtresses ────────────────────────────────────────────────────────
function AdminMaitresses({ maitresses, setMaitresses, slots }) {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "" });
  const [sending, setSending] = useState(null);

  const add = async () => {
    if (!form.prenom || !form.nom || !form.email) return;
    const m = { id: Date.now().toString(), ...form, status: "invited", invitedAt: new Date().toISOString(), answers: {}, slotId: null };
    const updated = [...maitresses, m];
    await store.set("maitresses", updated);
    setMaitresses(updated);
    setSending(m.id);
    try { await sendInvitation(m); } catch(e) { console.error(e); }
    setSending(null);
    setForm({ prenom: "", nom: "", email: "" });
  };

  const relancer = async (m) => {
    setSending(m.id);
    try {
      if (m.status === "reserved" || m.status === "questionnaire_done") {
        const slot = slots.find(s => s.id === m.slotId);
        const label = slot ? `${formatDate(slot.date)} à ${slot.heure}` : "";
        await sendQuestionnaireLink(m, label);
      } else {
        await sendInvitation(m);
      }
    } catch(e) { console.error(e); }
    setSending(null);
  };

  const remove = async (id) => {
    const updated = maitresses.filter(m => m.id !== id);
    await store.set("maitresses", updated);
    setMaitresses(updated);
  };

  const getSlot = (slotId) => slots.find(s => s.id === slotId);

  const getStatus = (m) => {
    if (m.status === "questionnaire_done") return <span className="badge badge-green">✅ Prête</span>;
    if (m.status === "reserved") return <span className="badge badge-orange">📋 Questionnaire en attente</span>;
    return <span className="badge badge-gray">⏳ En attente de réservation</span>;
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">➕ Ajouter une maîtresse</div>
        <div className="field-row-3">
          <div className="field"><label>Prénom</label><input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Marie" /></div>
          <div className="field"><label>Nom</label><input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Dupont" /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="m.dupont@ecole.fr" /></div>
        </div>
        <button className="btn btn-primary" onClick={add} disabled={!form.prenom || !form.nom || !form.email}>✚ Ajouter et envoyer l'invitation</button>
      </div>

      <div className="card">
        <div className="card-title">👩‍🏫 Maîtresses ({maitresses.length})</div>
        {maitresses.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">👩‍🏫</div><p>Aucune maîtresse ajoutée</p></div>
        ) : (
          <table className="table">
            <thead><tr>
              <th>Nom</th><th>Email</th><th>Créneau</th><th>Statut</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {maitresses.map(m => {
                const slot = m.slotId ? getSlot(m.slotId) : null;
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.prenom} {m.nom}</td>
                    <td style={{ color: COLORS.textLight, fontSize: "0.82rem" }}>{m.email}</td>
                    <td>
                      {slot
                        ? <span className="creneau-chip reserved">{formatDateShort(slot.date)} {slot.heure}</span>
                        : <span className="creneau-chip">—</span>}
                    </td>
                    <td>{getStatus(m)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => relancer(m)} disabled={sending === m.id}>
                          {sending === m.id ? <LoadingDots /> : "↺ Relancer"}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(m.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Admin : Planning ──────────────────────────────────────────────────────────
function AdminPlanning({ maitresses, slots, onOpenInterview }) {
  const reserved = maitresses.filter(m => m.slotId);
  const sorted = [...reserved].sort((a, b) => {
    const sa = slots.find(s => s.id === a.slotId);
    const sb = slots.find(s => s.id === b.slotId);
    return (sa?.id || "").localeCompare(sb?.id || "");
  });

  return (
    <div className="card">
      <div className="card-title">📅 Planning des entretiens ({sorted.length})</div>
      {sorted.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📅</div><p>Aucun entretien planifié pour le moment</p></div>
      ) : (
        <table className="table">
          <thead><tr>
            <th>Maîtresse</th><th>Date</th><th>Heure</th><th>Questionnaire</th><th>CR</th><th>Action</th>
          </tr></thead>
          <tbody>
            {sorted.map(m => {
              const slot = slots.find(s => s.id === m.slotId);
              const hasQ = m.status === "questionnaire_done";
              const hasCR = m.status === "cr_done";
              return (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.prenom} {m.nom}</td>
                  <td>{slot ? formatDate(slot.date) : "—"}</td>
                  <td><span className="creneau-chip">{slot?.heure || "—"}</span></td>
                  <td>{hasQ || hasCR ? <span className="badge badge-green">✅ Rempli</span> : <span className="badge badge-orange">⏳ En attente</span>}</td>
                  <td>{hasCR ? <span className="badge badge-green">✅ Envoyé</span> : <span className="badge badge-gray">—</span>}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => onOpenInterview(m.id)}>
                      {hasCR ? "👁️ Voir" : "▶ Ouvrir"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Admin : Vue entretien ─────────────────────────────────────────────────────
function AdminInterview({ maitresse, slot, maitresses, setMaitresses, onBack }) {
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState({ general: maitresse.notesGeneral || "", decisions: maitresse.notesDecisions || "", suivis: maitresse.notesSuivis || "" });
  const [sendingCR, setSendingCR] = useState(false);
  const [crSent, setCrSent] = useState(false);

  const sendCR = async () => {
    setSendingCR(true);
    try {
      await sendCRWithSignature(maitresse, slotDate, cr);
      setCrSent(true);
    } catch(e) { console.error(e); }
    setSendingCR(false);
    setShowModal(false);
  };
  const [cr, setCr] = useState(maitresse.cr || "");
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveNotes = async () => {
    const updated = maitresses.map(m => m.id === maitresse.id ? { ...m, ...notes, notesGeneral: notes.general, notesDecisions: notes.decisions, notesSuivis: notes.suivis } : m);
    await store.set("maitresses", updated);
    setMaitresses(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generateCR = async () => {
    setGenerating(true);
    try {
      const answersText = QUESTIONS.map(q => `Q : ${q.text}\nR : ${maitresse.answers?.[q.id] || "(pas de réponse)"}`).join("\n\n");
      const prompt = `Tu es la direction d'une école. Génère un compte-rendu d'entretien annuel professionnel et bienveillant pour ${maitresse.prenom} ${maitresse.nom}, basé sur les éléments suivants.

QUESTIONNAIRE PRÉ-ENTRETIEN :
${answersText}

NOTES DE LA DIRECTION PENDANT L'ENTRETIEN :
Notes générales : ${notes.general || "(aucune)"}
Décisions prises : ${notes.decisions || "(aucune)"}
Points de suivi : ${notes.suivis || "(aucun)"}

Rédige un CR structuré avec :
1. En-tête (nom, date, heure)
2. Bilan de l'année (synthèse des réponses)
3. Points abordés pendant l'entretien
4. Décisions et engagements
5. Conclusion bienveillante

Ton : professionnel, chaleureux, factuel. Maximum 600 mots.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setCr(text);
      const updated = maitresses.map(m => m.id === maitresse.id ? { ...m, cr: text, status: "cr_done" } : m);
      await store.set("maitresses", updated);
      setMaitresses(updated);
      setShowModal(true);
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const slotDate = slot ? `${formatDate(slot.date)} à ${slot.heure}` : "—";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Retour</button>
        <div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: COLORS.navy }}>
            {maitresse.prenom} {maitresse.nom}
          </span>
          <span style={{ color: COLORS.textLight, fontSize: "0.85rem", marginLeft: 12 }}>{slotDate}</span>
        </div>
      </div>

      <div className="interview-grid">
        {/* Colonne gauche : réponses */}
        <div className="interview-col">
          <div className="interview-col-header left">📋 Réponses au questionnaire</div>
          <div className="interview-col-body" style={{ maxHeight: 520, overflowY: "auto" }}>
            {QUESTIONS.map(q => (
              <div className="qa-item" key={q.id}>
                <div className="qa-question">{q.text}</div>
                <div className="qa-answer">{maitresse.answers?.[q.id] || <em style={{ color: COLORS.textLight }}>Pas de réponse</em>}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite : notes */}
        <div className="interview-col">
          <div className="interview-col-header right">✏️ Vos notes</div>
          <div className="interview-col-body">
            <div className="note-label">Notes générales</div>
            <textarea className="note-area" placeholder="Ce qui est dit pendant l'entretien..." value={notes.general} onChange={e => setNotes(n => ({ ...n, general: e.target.value }))} />
            <div className="note-label">Décisions prises</div>
            <textarea className="note-area" style={{ minHeight: 80 }} placeholder="Engagements, actions, formations..." value={notes.decisions} onChange={e => setNotes(n => ({ ...n, decisions: e.target.value }))} />
            <div className="note-label">Points de suivi</div>
            <textarea className="note-area" style={{ minHeight: 80 }} placeholder="À surveiller, à revoir..." value={notes.suivis} onChange={e => setNotes(n => ({ ...n, suivis: e.target.value }))} />
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline btn-sm" onClick={saveNotes}>{saved ? "✓ Sauvegardé" : "💾 Sauvegarder"}</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-gold btn-full" style={{ fontSize: "1rem", padding: "16px" }} onClick={generateCR} disabled={generating}>
          {generating ? <><LoadingDots /> &nbsp; Génération du CR en cours...</> : "⚡ Clôturer et générer le compte-rendu"}
        </button>
      </div>

      {crSent && (
        <div style={{ background: "#E8F5EE", border: "1px solid #A8D5B5", borderRadius: 10, padding: "14px 20px", marginTop: 16, color: COLORS.green, fontWeight: 600, fontSize: "0.9rem" }}>
          ✅ Compte-rendu envoyé à {maitresse.email}
        </div>
      )}

      {showModal && cr && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: COLORS.navy }}>Compte-rendu généré</div>
                <div style={{ color: COLORS.textLight, fontSize: "0.82rem", marginTop: 2 }}>{maitresse.prenom} {maitresse.nom} — {slotDate}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box">📧 Ce CR sera envoyé à {maitresse.email} avec un lien de signature électronique.</div>
              <div className="cr-content">{cr}</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Modifier les notes</button>
              <button className="btn btn-gold" onClick={sendCR} disabled={sendingCR}>
                {sendingCR ? <><LoadingDots /> &nbsp;Envoi en cours...</> : "📨 Envoyer pour signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── App principale ────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("login"); // login | admin | maitresse-resa | maitresse-questionnaire
  const [adminTab, setAdminTab] = useState("planning");
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);
  const [slots, setSlots] = useState([]);
  const [maitresses, setMaitresses] = useState([]);
  const [interviewId, setInterviewId] = useState(null);



  useEffect(() => {
    (async () => {
      const s = await store.get("slots"); if (s) setSlots(s);
      const m = await store.get("maitresses"); if (m) setMaitresses(m);
    })();
  }, []);

  const login = () => {
    if (password === ADMIN_PASSWORD) { setView("admin"); setPwError(false); }
    else setPwError(true);
  };

  const interviewMaitresse = maitresses.find(m => m.id === interviewId);
  const interviewSlot = interviewMaitresse ? slots.find(s => s.id === interviewMaitresse.slotId) : null;

  // ── Login ──
  if (view === "login") return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${COLORS.navy}, ${COLORS.navyLight})`, gap: 20 }}>
        <div className="login-card">
          <div className="login-icon">🎖️</div>
          <div className="login-title">Espace Direction</div>
          <div className="login-sub">Entretiens annuels 2025-2026</div>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} placeholder="••••••••" style={{ borderColor: pwError ? COLORS.red : undefined }} />
          </div>
          {pwError && <p style={{ color: COLORS.red, fontSize: "0.82rem", marginBottom: 12 }}>Mot de passe incorrect</p>}
          <button className="btn btn-gold btn-full" onClick={login}>Accéder →</button>
        </div>

      </div>
    </>
  );



  // ── Admin ──
  return (
    <>
      <style>{css}</style>
      <div className="app-wrapper">
        <div className="header">
          <div>
            <div className="header-title">🏫 Entretiens annuels</div>
            <div className="header-sub">2025 — 2026</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="header-badge">Direction</span>
            <button className="btn btn-outline btn-sm" style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }} onClick={() => setView("login")}>Déconnexion</button>
          </div>
        </div>

        {interviewId && interviewMaitresse ? (
          <div className="main">
            <AdminInterview
              maitresse={interviewMaitresse}
              slot={interviewSlot}
              maitresses={maitresses}
              setMaitresses={setMaitresses}
              onBack={() => setInterviewId(null)}
            />
          </div>
        ) : (
          <>
            <div className="nav-tabs">
              {[["planning", "📅 Planning"], ["maitresses", "👩‍🏫 Maîtresses"], ["creneaux", "⚙️ Créneaux"]].map(([id, label]) => (
                <button key={id} className={`nav-tab ${adminTab === id ? "active" : ""}`} onClick={() => setAdminTab(id)}>{label}</button>
              ))}
            </div>
            <div className="main">
              {adminTab === "planning" && <AdminPlanning maitresses={maitresses} slots={slots} onOpenInterview={id => setInterviewId(id)} />}
              {adminTab === "maitresses" && <AdminMaitresses maitresses={maitresses} setMaitresses={setMaitresses} slots={slots} />}
              {adminTab === "creneaux" && <AdminCreneaux slots={slots} setSlots={setSlots} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}
