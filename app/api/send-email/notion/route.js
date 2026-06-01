// app/api/notion/route.js
import { NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DB_CRENEAUX = process.env.NOTION_DB_CRENEAUX;
const DB_MAITRESSES = process.env.NOTION_DB_MAITRESSES;

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
};

// ── Helpers Notion ─────────────────────────────────────────────────────────────
async function queryDB(dbId, filter = null) {
  const body = filter ? { filter } : {};
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  return res.json();
}

async function createPage(dbId, properties) {
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST", headers,
    body: JSON.stringify({ parent: { database_id: dbId }, properties }),
  });
  return res.json();
}

async function updatePage(pageId, properties) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH", headers,
    body: JSON.stringify({ properties }),
  });
  return res.json();
}

// ── Parsers ────────────────────────────────────────────────────────────────────
function parseCreneau(page) {
  const p = page.properties;
  return {
    id: page.id,
    titre: p["Créneau"]?.title?.[0]?.plain_text || "",
    date: p["Date"]?.date?.start || "",
    heure: p["Heure"]?.rich_text?.[0]?.plain_text || "",
    statut: p["Statut"]?.select?.name || "Libre",
    maitresse: p["Maîtresse"]?.rich_text?.[0]?.plain_text || "",
    email: p["Email"]?.email || "",
  };
}

function parseMaitresse(page) {
  const p = page.properties;
  return {
    id: page.id,
    nom: p["Nom"]?.title?.[0]?.plain_text || "",
    prenom: p["Prénom"]?.rich_text?.[0]?.plain_text || "",
    email: p["Email"]?.email || "",
    statut: p["Statut"]?.select?.name || "Invitée",
    creneau: p["Créneau"]?.rich_text?.[0]?.plain_text || "",
    reponses: p["Réponses"]?.rich_text?.[0]?.plain_text || "",
    notes: p["Notes direction"]?.rich_text?.[0]?.plain_text || "",
    decisions: p["Décisions"]?.rich_text?.[0]?.plain_text || "",
    suivi: p["Suivi"]?.rich_text?.[0]?.plain_text || "",
    cr: p["CR"]?.rich_text?.[0]?.plain_text || "",
  };
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function POST(request) {
  const { action, data } = await request.json();

  try {
    switch (action) {

      case "getCreneaux": {
        const res = await queryDB(DB_CRENEAUX);
        return NextResponse.json(res.results?.map(parseCreneau) || []);
      }

      case "getMaitresses": {
        const res = await queryDB(DB_MAITRESSES);
        return NextResponse.json(res.results?.map(parseMaitresse) || []);
      }

      case "addCreneau": {
        const { titre, date, heure } = data;
        await createPage(DB_CRENEAUX, {
          "Créneau": { title: [{ text: { content: titre } }] },
          "Date": { date: { start: date } },
          "Heure": { rich_text: [{ text: { content: heure } }] },
          "Statut": { select: { name: "Libre" } },
        });
        return NextResponse.json({ ok: true });
      }

      case "reserverCreneau": {
        const { pageId, maitresse, email } = data;
        await updatePage(pageId, {
          "Statut": { select: { name: "Réservé" } },
          "Maîtresse": { rich_text: [{ text: { content: maitresse } }] },
          "Email": { email },
        });
        return NextResponse.json({ ok: true });
      }

      case "addMaitresse": {
        const { prenom, nom, email } = data;
        await createPage(DB_MAITRESSES, {
          "Nom": { title: [{ text: { content: nom } }] },
          "Prénom": { rich_text: [{ text: { content: prenom } }] },
          "Email": { email },
          "Statut": { select: { name: "Invitée" } },
        });
        return NextResponse.json({ ok: true });
      }

      case "updateMaitresse": {
        const { pageId, fields } = data;
        const props = {};
        if (fields.statut) props["Statut"] = { select: { name: fields.statut } };
        if (fields.creneau) props["Créneau"] = { rich_text: [{ text: { content: fields.creneau } }] };
        if (fields.reponses) props["Réponses"] = { rich_text: [{ text: { content: fields.reponses.slice(0, 2000) } }] };
        if (fields.notes) props["Notes direction"] = { rich_text: [{ text: { content: fields.notes } }] };
        if (fields.decisions) props["Décisions"] = { rich_text: [{ text: { content: fields.decisions } }] };
        if (fields.suivi) props["Suivi"] = { rich_text: [{ text: { content: fields.suivi } }] };
        if (fields.cr) props["CR"] = { rich_text: [{ text: { content: fields.cr.slice(0, 2000) } }] };
        await updatePage(pageId, props);
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
