import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request) {
  const { to, subject, body } = await request.json();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Direction Pastoureaux" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: body,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur envoi mail:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
