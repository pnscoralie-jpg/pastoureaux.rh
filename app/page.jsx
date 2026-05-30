"use client";
import { useState, useEffect } from "react";

// ── Config Notion ─────────────────────────────────────────────────────────────
const NOTION_MCP = "https://mcp.notion.com/mcp";
const DB_CRENEAUX = "8142653829bf4e7ea85f3396e6a871d2";
const DB_MAITRESSES = "8babd9aa9d7e43dd835316865a1c36d2";
const ADMIN_PASSWORD = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_ADMIN_PASSWORD) || "ecole2026";
const BASE_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BASE_URL) || "https://pastoureaux.rh.bev-ops.com";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  navy: "#1B2A4A", navyLight: "#243559",
  gold: "#C9A84C", goldLight: "#E8C96A",
  cream: "#FAF7F2", creamDark: "#F0EBE0",
  text: "#1B2A4A", textLight: "#6B7A99",
  white: "#FFFFFF", red: "#C0392B", green: "#2E7D52",
};

const QUESTIONS = [
  { id: 1, bloc: "Bilan de l'année", text: "Comment décririez-vous cette année scolaire en quelques mots ?" },
  { id: 2, bloc: "Bilan de l'année", text: "Quelles sont vos principales fiertés cette année ?" },
  { id: 3, bloc: "Bilan de l'année", text: "Quelles difficultés avez-vous rencontrées ?" },
  { id: 4, bloc: "Relation avec l'équipe", text: "Comment vivez-vous votre intégration dans l'équipe ?" },
  { id: 5, bloc: "Relation avec l'équipe", text: "Y a-t-il des points où vous auriez eu besoin de plus de soutien ?" },
  { id: 6, bloc: "Regard sur les élèves", text: "Comment évaluez-vous la dynamique de votre classe ?" },
  { id: 7, bloc: "Regard sur les élèves", text: "Y a-t-il des situations difficiles avec des élèves ou familles ?" },
  { id: 8, bloc: "Perspectives", text: "Quelles sont vos envies pour l'année prochaine ?" },
  { id: 9, bloc: "Perspectives", text: "Y a-t-il une formation que vous souhaiteriez ?" },
  { id: 10, bloc: "Expression libre", text: "Y a-t-il des sujets à aborder lors de l'entretien ?" },
];

const formatDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "—";
const formatDateShort = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—";

// ── Anthropic API call ────────────────────────────────────────────────────────
async function callClaude({ prompt, mcp = false, tools = [] }) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  };
  if (mcp) body.mcp_servers = [{ type: "url", url: NOTION_MCP, name: "notion" }];
  if (tools.length) body.tools = tools;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Notion helpers ────────────────────────────────────────────────────────────
async function notionQuery(prompt) {
  const data = await callClaude({ prompt, mcp: true });
  const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
  const toolResults = data.content?.filter(b => b.type === "mcp_tool_result") || [];
  return { text, toolResults, raw: data };
}

async function getCreneaux() {
  const { text } = await notionQuery(
    `Interroge la base Notion "${DB_CRENEAUX}" et retourne UNIQUEMENT un JSON array des créneaux avec ces champs: id (page id), titre, date, heure, statut, maitresse, email. Réponds UNIQUEMENT avec le JSON, rien d'autre.`
  );
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start === -1) return [];
    return JSON.parse(clean.slice(start, end + 1));
  } catch { return []; }
}

async function getMaitresses() {
  const { text } = await notionQuery(
    `Interroge la base Notion "${DB_MAITRESSES}" et retourne UNIQUEMENT un JSON array avec ces champs: id (page id), nom, prenom, email, statut, creneau, reponses, notes, decisions, suivi, cr. Réponds UNIQUEMENT avec le JSON, rien d'autre.`
  );
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start === -1) return [];
    return JSON.parse(clean.slice(start, end + 1));
  } catch { return []; }
}

async function addCreneau({ titre, date, heure }) {
  await notionQuery(
    `Crée une nouvelle page dans la base Notion "${DB_CRENEAUX}" avec: Créneau="${titre}", Date="${date}", Heure="${heure}", Statut="Libre". Confirme avec OK.`
  );
}

async function reserverCreneau({ pageId, maitresse, email }) {
  await notionQuery(
    `Mets à jour la page Notion avec l'id "${pageId}" dans la base créneaux: Statut="Réservé", Maîtresse="${maitresse}", Email="${email}". Confirme avec OK.`
  );
}

async function addMaitresse({ prenom, nom, email }) {
  await notionQuery(
    `Crée une nouvelle page dans la base Notion "${DB_MAITRESSES}" avec: Nom="${nom}", Prénom="${prenom}", Email="${email}", Statut="Invitée". Confirme avec OK.`
  );
}

async function updateMaitresse({ pageId, fields }) {
  const fieldsStr = Object.entries(fields).map(([k, v]) => `${k}="${v}"`).join(", ");
  await notionQuery(
    `Mets à jour la page Notion avec l'id "${pageId}": ${fieldsStr}. Confirme avec OK.`
  );
}

async function generateCR({ maitresse, answers, notes }) {
  const answersText = QUESTIONS.map(q => `Q: ${q.text}\nR: ${answers?.[q.id] || "(pas de réponse)"}`).join("\n\n");
  const prompt = `Tu es la direction d'une école. Génère un compte-rendu d'entretien annuel professionnel et bienveillant pour ${maitresse.prenom} ${maitresse.nom}.

QUESTIONNAIRE:
${answersText}

NOTES DIRECTION:
${notes.general || "(aucune)"}
Décisions: ${notes.decisions || "(aucune)"}
Suivi: ${notes.suivi || "(aucun)"}

Rédige un CR structuré: en-tête, bilan, points abordés, décisions, conclusion. Ton chaleureux et factuel. 500 mots max.`;

  const data = await callClaude({ prompt });
  return data.content?.find(b => b.type === "text")?.text || "";
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: ${C.cream}; color: ${C.text}; }
  .header { background: ${C.navy}; padding: 18px 28px; display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid ${C.gold}; }
  .header-title { font-family: 'Playfair Display', serif; color: ${C.white}; font-size: 1.2rem; }
  .header-sub { color: ${C.gold}; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }
  .header-badge { background: ${C.gold}; color: ${C.navy}; font-size: 0.7rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.06em; text-transform: uppercase; }
  .nav { background: ${C.navyLight}; display: flex; border-bottom: 1px solid rgba(201,168,76,0.3); }
  .nav-btn { padding: 13px 22px; color: rgba(255,255,255,0.5); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; border: none; background: none; border-bottom: 3px solid transparent; transition: all 0.2s; }
  .nav-btn:hover { color: rgba(255,255,255,0.85); }
  .nav-btn.active { color: ${C.gold}; border-bottom-color: ${C.gold}; }
  .main { padding: 28px; max-width: 960px; margin: 0 auto; }
  .card { background: ${C.white}; border: 1px solid ${C.creamDark}; border-radius: 12px; padding: 24px; margin-bottom: 18px; box-shadow: 0 2px 10px rgba(27,42,74,0.06); }
  .card-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: ${C.navy}; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid ${C.creamDark}; }
  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${C.textLight}; margin-bottom: 5px; }
  .field input, .field select, .field textarea { width: 100%; padding: 10px 13px; border: 1.5px solid ${C.creamDark}; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; background: ${C.cream}; color: ${C.text}; outline: none; transition: border-color 0.2s; }
  .field input:focus, .field textarea:focus { border-color: ${C.gold}; background: ${C.white}; }
  .field textarea { min-height: 80px; resize: vertical; }
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .btn { padding: 10px 20px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
  .btn-navy { background: ${C.navy}; color: ${C.white}; }
  .btn-navy:hover { background: ${C.navyLight}; }
  .btn-gold { background: ${C.gold}; color: ${C.navy}; }
  .btn-gold:hover { background: ${C.goldLight}; }
  .btn-outline { background: transparent; color: ${C.navy}; border: 1.5px solid ${C.navy}; }
  .btn-sm { padding: 6px 13px; font-size: 0.76rem; }
  .btn-danger { background: transparent; color: ${C.red}; border: 1.5px solid ${C.red}; }
  .btn-full { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
  .badge-green { background: #E8F5EE; color: ${C.green}; }
  .badge-orange { background: #FEF3E2; color: #C17B2A; }
  .badge-gray { background: #F0EBE0; color: ${C.textLight}; }
  .badge-blue { background: #EFF6FF; color: #1D4ED8; }
  .table { width: 100%; border-collapse: collapse; }
  .table th { text-align: left; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${C.textLight}; padding: 10px 12px; border-bottom: 2px solid ${C.creamDark}; }
  .table td { padding: 12px 12px; border-bottom: 1px solid ${C.creamDark}; font-size: 0.86rem; vertical-align: middle; }
  .table tr:last-child td { border-bottom: none; }
  .table tr:hover td { background: ${C.cream}; }
  .slot-btn { width: 100%; padding: 15px 18px; border: 2px solid ${C.creamDark}; border-radius: 12px; background: ${C.cream}; text-align: left; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; color: ${C.navy}; font-weight: 500; transition: all 0.2s; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
  .slot-btn:hover, .slot-btn.selected { border-color: ${C.gold}; background: #FFFBF0; }
  .slot-btn.selected { box-shadow: 0 0 0 3px rgba(201,168,76,0.2); }
  .progress-bar { height: 4px; background: ${C.creamDark}; border-radius: 3px; margin-bottom: 22px; }
  .progress-fill { height: 100%; background: ${C.gold}; border-radius: 3px; transition: width 0.4s; }
  .q-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; color: ${C.navy}; line-height: 1.5; margin-bottom: 18px; }
  .note-area { width: 100%; min-height: 100px; padding: 10px 13px; border: 1.5px solid ${C.creamDark}; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; background: ${C.cream}; resize: vertical; margin-bottom: 12px; outline: none; transition: border-color 0.2s; }
  .note-area:focus { border-color: ${C.gold}; background: ${C.white}; }
  .note-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: ${C.textLight}; margin-bottom: 5px; }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px; }
  .split-col { background: ${C.white}; border: 1px solid ${C.creamDark}; border-radius: 12px; overflow: hidden; }
  .split-head { padding: 12px 18px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .split-head.left { background: ${C.navy}; color: ${C.gold}; }
  .split-head.right { background: ${C.gold}; color: ${C.navy}; }
  .split-body { padding: 18px; max-height: 480px; overflow-y: auto; }
  .qa-q { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${C.textLight}; margin-bottom: 5px; }
  .qa-a { font-size: 0.88rem; color: ${C.text}; line-height: 1.6; background: ${C.cream}; padding: 9px 13px; border-radius: 8px; border-left: 3px solid ${C.gold}; font-style: italic; margin-bottom: 16px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(27,42,74,0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(3px); }
  .modal { background: ${C.white}; border-radius: 14px; width: 90%; max-width: 680px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(27,42,74,0.25); }
  .modal-head { padding: 22px 26px 16px; border-bottom: 1px solid ${C.creamDark}; display: flex; justify-content: space-between; align-items: center; }
  .modal-body { padding: 22px 26px; }
  .modal-foot { padding: 16px 26px; border-top: 1px solid ${C.creamDark}; display: flex; gap: 10px; justify-content: flex-end; }
  .cr-box { background: ${C.cream}; border: 1px solid ${C.creamDark}; border-radius: 10px; padding: 18px; font-size: 0.86rem; line-height: 1.8; white-space: pre-wrap; max-height: 360px; overflow-y: auto; }
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(160deg, ${C.navy}, ${C.navyLight}); }
  .login-card { background: ${C.white}; border-radius: 16px; padding: 44px 38px; width: 340px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
  .login-icon { font-size: 2.4rem; margin-bottom: 14px; }
  .login-title { font-family: 'Playfair Display', serif; font-size: 1.35rem; color: ${C.navy}; margin-bottom: 6px; }
  .login-sub { color: ${C.textLight}; font-size: 0.83rem; margin-bottom: 26px; }
  .maitresse-wrap { min-height: 100vh; background: linear-gradient(160deg, ${C.navy}, ${C.navyLight}); display: flex; align-items: center; justify-content: center; padding: 28px 18px; }
  .maitresse-card { background: ${C.white}; border-radius: 18px; width: 100%; max-width: 500px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.3); }
  .maitresse-head { background: ${C.navy}; padding: 26px 30px; border-bottom: 3px solid ${C.gold}; }
  .maitresse-head h1 { font-family: 'Playfair Display', serif; color: ${C.white}; font-size: 1.25rem; margin-bottom: 4px; }
  .maitresse-head p { color: ${C.gold}; font-size: 0.8rem; font-weight: 500; }
  .maitresse-body { padding: 28px; }
  .success-wrap { text-align: center; padding: 36px 16px; }
  .success-icon { font-size: 2.8rem; margin-bottom: 14px; }
  .success-title { font-family: 'Playfair Display', serif; font-size: 1.25rem; color: ${C.navy}; margin-bottom: 10px; }
  .success-text { color: ${C.textLight}; font-size: 0.88rem; line-height: 1.6; }
  .loading { display: inline-flex; gap: 4px; }
  .loading span { width: 6px; height: 6px; border-radius: 50%; background: ${C.gold}; animation: bounce 1.2s infinite; }
  .loading span:nth-child(2) { animation-delay: 0.2s; }
  .loading span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.5} 40%{transform:translateY(-6px);opacity:1} }
  .empty { text-align: center; padding: 44px 16px; color: ${C.textLight}; }
  .empty-icon { font-size: 2.2rem; margin-bottom: 10px; }
  .info-box { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 11px 15px; font-size: 0.82rem; color: #1E40AF; margin-bottom: 14px; }
  .chip { display: inline-block; padding: 3px 10px; background: ${C.cream}; border: 1px solid ${C.creamDark}; border-radius: 6px; font-size: 0.78rem; color: ${C.navy}; font-weight: 500; }
  .success-banner { background: #E8F5EE; border: 1px solid #A8D5B5; border-radius: 10px; padding: 13px 18px; color: ${C.green}; font-weight: 600; font-size: 0.88rem; margin-top: 14px; }
  @media(max-width:640px){.main{padding:14px}.row2,.row3,.split{grid-template-columns:1fr}}
`;

const Loading = () => <span className="loading"><span/><span/><span/></span>;

// ── Composant : Réservation maîtresse ─────────────────────────────────────────
function VueReservation({ maitresse, creneaux, onDone }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const libres = creneaux.filter(c => c.statut === "Libre");

  const confirm = async () => {
    if (!selected) return;
    setLoading(true);
    const slot = creneaux.find(c => c.id === selected);
    await reserverCreneau({ pageId: selected, maitresse: `${maitresse.prenom} ${maitresse.nom}`, email: maitresse.email });
    await updateMaitresse({ pageId: maitresse.id, fields: { Statut: "Réservé", Créneau: slot?.titre || "" } });
    setLoading(false);
    setDone(true);
    if (onDone) onDone();
  };

  if (done) return (
    <div className="maitresse-wrap">
      <div className="maitresse-card">
        <div className="maitresse-head"><h1>🏫 Entretiens 2025-2026</h1></div>
        <div className="maitresse-body">
          <div className="success-wrap">
            <div className="success-icon">✅</div>
            <div className="success-title">Créneau réservé !</div>
            <p className="success-text">Merci {maitresse.prenom}. Vous recevrez bientôt le lien pour votre questionnaire.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="maitresse-wrap">
      <div className="maitresse-card">
        <div className="maitresse-head">
          <h1>🏫 Entretiens 2025-2026</h1>
          <p>Bonjour {maitresse.prenom} 👋</p>
        </div>
        <div className="maitresse-body">
          <p style={{ marginBottom: 18, color: C.textLight, fontSize: "0.88rem", lineHeight: 1.6 }}>
            Choisissez le créneau qui vous convient pour votre entretien annuel.
          </p>
          {libres.length === 0 ? (
            <div className="empty"><div className="empty-icon">📅</div><p>Aucun créneau disponible.<br/>Contactez la direction.</p></div>
          ) : libres.map(slot => (
            <button key={slot.id} className={`slot-btn ${selected === slot.id ? "selected" : ""}`} onClick={() => setSelected(slot.id)}>
              <span><strong>{slot.titre}</strong></span>
              {selected === slot.id && <span style={{ color: C.gold, fontWeight: 700 }}>✓</span>}
            </button>
          ))}
          {libres.length > 0 && (
            <button className="btn btn-gold btn-full" style={{ marginTop: 8 }} onClick={confirm} disabled={!selected || loading}>
              {loading ? <Loading /> : "✔️ Je confirme ce créneau"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Composant : Questionnaire maîtresse ───────────────────────────────────────
function VueQuestionnaire({ maitresse, onDone }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[current];
  const progress = (current / QUESTIONS.length) * 100;

  const next = async () => {
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1);
    } else {
      setLoading(true);
      const answersStr = QUESTIONS.map(q => `Q${q.id}: ${answers[q.id] || ""}`).join(" | ");
      await updateMaitresse({ pageId: maitresse.id, fields: { Statut: "Questionnaire rempli", Réponses: answersStr } });
      setLoading(false);
      setDone(true);
      if (onDone) onDone();
    }
  };

  if (done) return (
    <div className="maitresse-wrap">
      <div className="maitresse-card">
        <div className="maitresse-head"><h1>📝 Questionnaire</h1><p>Terminé !</p></div>
        <div className="maitresse-body">
          <div className="success-wrap">
            <div className="success-icon">🎉</div>
            <div className="success-title">Merci {maitresse.prenom} !</div>
            <p className="success-text">Vos réponses ont été enregistrées.<br/>À bientôt pour votre entretien.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="maitresse-wrap">
      <div className="maitresse-card">
        <div className="maitresse-head">
          <h1>📝 Avant votre entretien</h1>
          <p>Question {current + 1} sur {QUESTIONS.length}</p>
        </div>
        <div className="maitresse-body">
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <p style={{ fontSize: "0.7rem", color: C.textLight, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 700 }}>{q.bloc}</p>
          <p className="q-title">{q.text}</p>
          <textarea className="note-area" style={{ minHeight: 120 }} placeholder="Écrivez ici..." value={answers[q.id] || ""} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
          <button className="btn btn-gold btn-full" onClick={next} disabled={loading}>
            {loading ? <Loading /> : current < QUESTIONS.length - 1 ? "Question suivante →" : "Envoyer mes réponses ✓"}
          </button>
          {current > 0 && <button className="btn btn-outline btn-full" style={{ marginTop: 10 }} onClick={() => setCurrent(c => c - 1)}>← Précédente</button>}
        </div>
      </div>
    </div>
  );
}

// ── Admin : Créneaux ──────────────────────────────────────────────────────────
function AdminCreneaux({ creneaux, setCreneaux, loading }) {
  const [plage, setPlage] = useState({ debut: "", fin: "", heureDebut: "09:00", heureFin: "17:00", duree: "45", pauseDebut: "12:00", pauseFin: "13:30" });
  const [manuel, setManuel] = useState({ date: "", heure: "" });
  const [saving, setSaving] = useState(false);

  const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  const generateSlots = async () => {
    const { debut, fin, heureDebut, heureFin, duree, pauseDebut, pauseFin } = plage;
    if (!debut || !fin) return;
    setSaving(true);
    const dur = parseInt(duree);
    let cur = new Date(debut);
    const end = new Date(fin);
    while (cur <= end) {
      const [hD, mD] = heureDebut.split(":").map(Number);
      const [hF, mF] = heureFin.split(":").map(Number);
      const [pD, pM] = pauseDebut.split(":").map(Number);
      const [pF, pFm] = pauseFin.split(":").map(Number);
      let t = hD * 60 + mD;
      const tEnd = hF * 60 + mF;
      const pS = pD * 60 + pM, pE = pF * 60 + pFm;
      while (t + dur <= tEnd) {
        if (t >= pS && t < pE) { t = pE; continue; }
        const h = String(Math.floor(t / 60)).padStart(2, "0");
        const m = String(t % 60).padStart(2, "0");
        const titre = `${jours[cur.getDay()]} ${cur.getDate()} ${mois[cur.getMonth()]} — ${h}h${m}`;
        await addCreneau({ titre, date: cur.toISOString().split("T")[0], heure: `${h}h${m}` });
        t += dur;
      }
      cur.setDate(cur.getDate() + 1);
    }
    const updated = await getCreneaux();
    setCreneaux(updated);
    setSaving(false);
  };

  const addManuelSlot = async () => {
    if (!manuel.date || !manuel.heure) return;
    setSaving(true);
    const d = new Date(manuel.date);
    const heure = manuel.heure.replace(":", "h");
    const titre = `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} — ${heure}`;
    await addCreneau({ titre, date: manuel.date, heure });
    const updated = await getCreneaux();
    setCreneaux(updated);
    setManuel({ date: "", heure: "" });
    setSaving(false);
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">⚡ Générer des créneaux automatiquement</div>
        <div className="row2">
          <div className="field"><label>Date début</label><input type="date" value={plage.debut} onChange={e => setPlage(p => ({ ...p, debut: e.target.value }))} /></div>
          <div className="field"><label>Date fin</label><input type="date" value={plage.fin} onChange={e => setPlage(p => ({ ...p, fin: e.target.value }))} /></div>
        </div>
        <div className="row3">
          <div className="field"><label>Heure début</label><input type="time" value={plage.heureDebut} onChange={e => setPlage(p => ({ ...p, heureDebut: e.target.value }))} /></div>
          <div className="field"><label>Heure fin</label><input type="time" value={plage.heureFin} onChange={e => setPlage(p => ({ ...p, heureFin: e.target.value }))} /></div>
          <div className="field"><label>Durée (min)</label><input type="number" value={plage.duree} min="15" max="120" onChange={e => setPlage(p => ({ ...p, duree: e.target.value }))} /></div>
        </div>
        <div className="row2">
          <div className="field"><label>Pause début</label><input type="time" value={plage.pauseDebut} onChange={e => setPlage(p => ({ ...p, pauseDebut: e.target.value }))} /></div>
          <div className="field"><label>Pause fin</label><input type="time" value={plage.pauseFin} onChange={e => setPlage(p => ({ ...p, pauseFin: e.target.value }))} /></div>
        </div>
        <button className="btn btn-navy" onClick={generateSlots} disabled={saving || !plage.debut || !plage.fin}>
          {saving ? <><Loading /> Génération...</> : "✚ Générer les créneaux"}
        </button>
      </div>

      <div className="card">
        <div className="card-title">✏️ Ajouter un créneau manuel</div>
        <div className="row2">
          <div className="field"><label>Date</label><input type="date" value={manuel.date} onChange={e => setManuel(m => ({ ...m, date: e.target.value }))} /></div>
          <div className="field"><label>Heure</label><input type="time" value={manuel.heure} onChange={e => setManuel(m => ({ ...m, heure: e.target.value }))} /></div>
        </div>
        <button className="btn btn-navy" onClick={addManuelSlot} disabled={saving || !manuel.date || !manuel.heure}>✚ Ajouter</button>
      </div>

      <div className="card">
        <div className="card-title">📅 Créneaux ({creneaux.length})</div>
        {loading ? <div className="empty"><Loading /></div> : creneaux.length === 0 ? (
          <div className="empty"><div className="empty-icon">📅</div><p>Aucun créneau créé</p></div>
        ) : (
          <table className="table">
            <thead><tr><th>Créneau</th><th>Statut</th><th>Maîtresse</th></tr></thead>
            <tbody>
              {creneaux.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.titre}</td>
                  <td>{s.statut === "Réservé" ? <span className="badge badge-green">✅ Réservé</span> : <span className="badge badge-gray">Libre</span>}</td>
                  <td style={{ color: C.textLight }}>{s.maitresse || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Admin : Maîtresses ────────────────────────────────────────────────────────
function AdminMaitresses({ maitresses, setMaitresses, loading }) {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "" });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!form.prenom || !form.nom || !form.email) return;
    setSaving(true);
    await addMaitresse(form);
    const updated = await getMaitresses();
    setMaitresses(updated);
    setForm({ prenom: "", nom: "", email: "" });
    setSaving(false);
  };

  const getStatutBadge = (s) => {
    if (s === "CR envoyé") return <span className="badge badge-blue">✅ CR envoyé</span>;
    if (s === "Questionnaire rempli") return <span className="badge badge-green">📋 Prête</span>;
    if (s === "Réservé") return <span className="badge badge-orange">📅 Réservé</span>;
    return <span className="badge badge-gray">⏳ En attente</span>;
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">➕ Ajouter une maîtresse</div>
        <div className="row3">
          <div className="field"><label>Prénom</label><input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Marie" /></div>
          <div className="field"><label>Nom</label><input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Dupont" /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="m.dupont@ecole.fr" /></div>
        </div>
        <button className="btn btn-navy" onClick={add} disabled={saving || !form.prenom || !form.nom || !form.email}>
          {saving ? <><Loading /> Ajout...</> : "✚ Ajouter"}
        </button>
      </div>

      <div className="card">
        <div className="card-title">👩‍🏫 Maîtresses ({maitresses.length})</div>
        {loading ? <div className="empty"><Loading /></div> : maitresses.length === 0 ? (
          <div className="empty"><div className="empty-icon">👩‍🏫</div><p>Aucune maîtresse ajoutée</p></div>
        ) : (
          <table className="table">
            <thead><tr><th>Nom</th><th>Email</th><th>Créneau</th><th>Statut</th><th>Lien réservation</th></tr></thead>
            <tbody>
              {maitresses.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.prenom} {m.nom}</td>
                  <td style={{ color: C.textLight, fontSize: "0.8rem" }}>{m.email}</td>
                  <td><span className="chip">{m.creneau || "—"}</span></td>
                  <td>{getStatutBadge(m.statut)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard?.writeText(`${BASE_URL}/reservation?id=${m.id}`)}>
                      📋 Copier lien
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Admin : Planning ──────────────────────────────────────────────────────────
function AdminPlanning({ maitresses, loading, onOpen }) {
  const avecCreneau = maitresses.filter(m => m.creneau);
  return (
    <div className="card">
      <div className="card-title">📅 Planning des entretiens ({avecCreneau.length})</div>
      {loading ? <div className="empty"><Loading /></div> : avecCreneau.length === 0 ? (
        <div className="empty"><div className="empty-icon">📅</div><p>Aucun entretien planifié</p></div>
      ) : (
        <table className="table">
          <thead><tr><th>Maîtresse</th><th>Créneau</th><th>Questionnaire</th><th>CR</th><th>Action</th></tr></thead>
          <tbody>
            {avecCreneau.map(m => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.prenom} {m.nom}</td>
                <td><span className="chip">{m.creneau || "—"}</span></td>
                <td>{m.statut === "Questionnaire rempli" || m.statut === "CR envoyé" ? <span className="badge badge-green">✅</span> : <span className="badge badge-orange">⏳</span>}</td>
                <td>{m.statut === "CR envoyé" ? <span className="badge badge-blue">✅</span> : <span className="badge badge-gray">—</span>}</td>
                <td><button className="btn btn-navy btn-sm" onClick={() => onOpen(m.id)}>▶ Ouvrir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Admin : Entretien ─────────────────────────────────────────────────────────
function AdminEntretien({ maitresse, maitresses, setMaitresses, onBack }) {
  const [notes, setNotes] = useState({ general: maitresse.notes || "", decisions: maitresse.decisions || "", suivi: maitresse.suivi || "" });
  const [generating, setGenerating] = useState(false);
  const [cr, setCr] = useState(maitresse.cr || "");
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [crSent, setCrSent] = useState(false);

  const parseAnswers = () => {
    const answers = {};
    if (!maitresse.reponses) return answers;
    maitresse.reponses.split(" | ").forEach(part => {
      const match = part.match(/Q(\d+): (.*)/);
      if (match) answers[parseInt(match[1])] = match[2];
    });
    return answers;
  };

  const saveNotes = async () => {
    await updateMaitresse({ pageId: maitresse.id, fields: { "Notes direction": notes.general, Décisions: notes.decisions, Suivi: notes.suivi } });
    const updated = await getMaitresses();
    setMaitresses(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const genCR = async () => {
    setGenerating(true);
    const answers = parseAnswers();
    const text = await generateCR({ maitresse, answers, notes });
    setCr(text);
    await updateMaitresse({ pageId: maitresse.id, fields: { CR: text, Statut: "CR envoyé" } });
    const updated = await getMaitresses();
    setMaitresses(updated);
    setGenerating(false);
    setShowModal(true);
  };

  const answers = parseAnswers();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Retour</button>
        <div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: C.navy }}>{maitresse.prenom} {maitresse.nom}</span>
          <span style={{ color: C.textLight, fontSize: "0.82rem", marginLeft: 12 }}>{maitresse.creneau}</span>
        </div>
      </div>

      <div className="split">
        <div className="split-col">
          <div className="split-head left">📋 Réponses au questionnaire</div>
          <div className="split-body">
            {QUESTIONS.map(q => (
              <div key={q.id} style={{ marginBottom: 16 }}>
                <div className="qa-q">{q.text}</div>
                <div className="qa-a">{answers[q.id] || <em style={{ color: C.textLight }}>Pas de réponse</em>}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="split-col">
          <div className="split-head right">✏️ Vos notes</div>
          <div className="split-body">
            <div className="note-label">Notes générales</div>
            <textarea className="note-area" placeholder="Ce qui est dit..." value={notes.general} onChange={e => setNotes(n => ({ ...n, general: e.target.value }))} />
            <div className="note-label">Décisions prises</div>
            <textarea className="note-area" style={{ minHeight: 70 }} placeholder="Engagements, formations..." value={notes.decisions} onChange={e => setNotes(n => ({ ...n, decisions: e.target.value }))} />
            <div className="note-label">Points de suivi</div>
            <textarea className="note-area" style={{ minHeight: 70 }} placeholder="À surveiller..." value={notes.suivi} onChange={e => setNotes(n => ({ ...n, suivi: e.target.value }))} />
            <button className="btn btn-outline btn-sm" onClick={saveNotes}>{saved ? "✓ Sauvegardé" : "💾 Sauvegarder"}</button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="btn btn-gold btn-full" style={{ fontSize: "0.95rem", padding: "15px" }} onClick={genCR} disabled={generating}>
          {generating ? <><Loading /> &nbsp;Génération du CR en cours...</> : "⚡ Clôturer et générer le compte-rendu"}
        </button>
      </div>

      {crSent && <div className="success-banner">✅ Compte-rendu enregistré dans Notion pour {maitresse.prenom} {maitresse.nom}</div>}

      {showModal && cr && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", color: C.navy }}>Compte-rendu généré</div>
                <div style={{ color: C.textLight, fontSize: "0.8rem", marginTop: 2 }}>{maitresse.prenom} {maitresse.nom}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-box">✅ Ce CR a été enregistré automatiquement dans Notion.</div>
              <div className="cr-box">{cr}</div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Fermer</button>
              <button className="btn btn-gold" onClick={() => { navigator.clipboard?.writeText(cr); setCrSent(true); setShowModal(false); }}>
                📋 Copier le CR
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
  const [view, setView] = useState("login");
  const [tab, setTab] = useState("planning");
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);
  const [creneaux, setCreneaux] = useState([]);
  const [maitresses, setMaitresses] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [interviewId, setInterviewId] = useState(null);

  const loadData = async () => {
    setLoadingData(true);
    const [c, m] = await Promise.all([getCreneaux(), getMaitresses()]);
    setCreneaux(c);
    setMaitresses(m);
    setLoadingData(false);
  };

  const login = () => {
    if (password === ADMIN_PASSWORD) { setView("admin"); setPwError(false); loadData(); }
    else setPwError(true);
  };

  const interviewMaitresse = maitresses.find(m => m.id === interviewId);

  if (view === "login") return (
    <>
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-icon">🎖️</div>
          <div className="login-title">Espace Direction</div>
          <div className="login-sub">Entretiens annuels 2025-2026</div>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} placeholder="••••••••" style={{ borderColor: pwError ? C.red : undefined }} />
          </div>
          {pwError && <p style={{ color: C.red, fontSize: "0.8rem", marginBottom: 12 }}>Mot de passe incorrect</p>}
          <button className="btn btn-gold btn-full" onClick={login}>Accéder →</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div>
        <div className="header">
          <div>
            <div className="header-title">🏫 Entretiens annuels</div>
            <div className="header-sub">2025 — 2026</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btn-outline btn-sm" style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }} onClick={loadData} disabled={loadingData}>
              {loadingData ? <Loading /> : "↺ Actualiser"}
            </button>
            <span className="header-badge">Direction</span>
            <button className="btn btn-outline btn-sm" style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }} onClick={() => setView("login")}>Déconnexion</button>
          </div>
        </div>

        {interviewId && interviewMaitresse ? (
          <div className="main">
            <AdminEntretien maitresse={interviewMaitresse} maitresses={maitresses} setMaitresses={setMaitresses} onBack={() => setInterviewId(null)} />
          </div>
        ) : (
          <>
            <div className="nav">
              {[["planning", "📅 Planning"], ["maitresses", "👩‍🏫 Maîtresses"], ["creneaux", "⚙️ Créneaux"]].map(([id, label]) => (
                <button key={id} className={`nav-btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
              ))}
            </div>
            <div className="main">
              {tab === "planning" && <AdminPlanning maitresses={maitresses} loading={loadingData} onOpen={id => setInterviewId(id)} />}
              {tab === "maitresses" && <AdminMaitresses maitresses={maitresses} setMaitresses={setMaitresses} loading={loadingData} />}
              {tab === "creneaux" && <AdminCreneaux creneaux={creneaux} setCreneaux={setCreneaux} loading={loadingData} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}
