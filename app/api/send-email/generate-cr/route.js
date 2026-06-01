// app/api/generate-cr/route.js
import { NextResponse } from "next/server";

const QUESTIONS = [
  { id: 1, text: "Comment décririez-vous cette année scolaire en quelques mots ?" },
  { id: 2, text: "Quelles sont vos principales fiertés cette année ?" },
  { id: 3, text: "Quelles difficultés avez-vous rencontrées ?" },
  { id: 4, text: "Comment vivez-vous votre intégration dans l'équipe ?" },
  { id: 5, text: "Y a-t-il des points où vous auriez eu besoin de plus de soutien ?" },
  { id: 6, text: "Comment évaluez-vous la dynamique de votre classe ?" },
  { id: 7, text: "Y a-t-il des situations difficiles avec des élèves ou familles ?" },
  { id: 8, text: "Quelles sont vos envies pour l'année prochaine ?" },
  { id: 9, text: "Y a-t-il une formation que vous souhaiteriez ?" },
  { id: 10, text: "Y a-t-il des sujets à aborder lors de l'entretien ?" },
];

export async function POST(request) {
  const { maitresse, answers, notes } = await request.json();

  const answersText = QUESTIONS.map(q =>
    `Q: ${q.text}\nR: ${answers?.[q.id] || "(pas de réponse)"}`
  ).join("\n\n");

  const prompt = `Tu es la direction d'une école. Génère un compte-rendu d'entretien annuel professionnel et bienveillant pour ${maitresse.prenom} ${maitresse.nom}.

QUESTIONNAIRE PRÉ-ENTRETIEN :
${answersText}

NOTES DE LA DIRECTION :
Notes générales : ${notes?.general || "(aucune)"}
Décisions prises : ${notes?.decisions || "(aucune)"}
Points de suivi : ${notes?.suivi || "(aucun)"}

Rédige un CR structuré avec : en-tête (nom, date), bilan de l'année, points abordés, décisions et engagements, conclusion bienveillante. Ton chaleureux et factuel. 500 mots max.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  return NextResponse.json({ cr: text });
}
