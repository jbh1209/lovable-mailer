import express from "express";
import nodemailer from "nodemailer";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "12mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/send", async (req, res) => {
  try {
    // simple auth guard
    const token = req.header("authorization")?.replace("Bearer ", "");
    if (!process.env.MAILER_TOKEN || token !== process.env.MAILER_TOKEN) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      text,
      html
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, error: err?.message ?? "Send failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Mailer listening on ${PORT}`);
});
