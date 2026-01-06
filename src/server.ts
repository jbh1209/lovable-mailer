import express from "express";
import nodemailer from "nodemailer";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "12mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

type SenderConfig = {
  user: string;
  pass: string;
  from: string;
};

function getSender(fromKey: string): SenderConfig | null {
  switch (fromKey) {
    case "delta":
      if (
        process.env.DELTA_SMTP_USER &&
        process.env.DELTA_SMTP_PASS &&
        process.env.DELTA_MAIL_FROM
      ) {
        return {
          user: process.env.DELTA_SMTP_USER,
          pass: process.env.DELTA_SMTP_PASS,
          from: process.env.DELTA_MAIL_FROM,
        };
      }
      return null;

    case "randburg":
      if (
        process.env.RANDBURG_SMTP_USER &&
        process.env.RANDBURG_SMTP_PASS &&
        process.env.RANDBURG_MAIL_FROM
      ) {
        return {
          user: process.env.RANDBURG_SMTP_USER,
          pass: process.env.RANDBURG_SMTP_PASS,
          from: process.env.RANDBURG_MAIL_FROM,
        };
      }
      return null;

    default:
      return null;
  }
}

app.post("/send", async (req, res) => {
  try {
    // auth guard
    const token = req.header("authorization")?.replace("Bearer ", "");
    if (!process.env.MAILER_TOKEN || token !== process.env.MAILER_TOKEN) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { fromKey, to, subject, text, html } = req.body;

    if (!fromKey || !to || !subject || (!text && !html)) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const sender = getSender(fromKey);
    if (!sender) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid fromKey" });
    }

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  requireTLS: true,
  auth: { user: sender.user, pass: sender.pass },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});




    await transporter.sendMail({
      from: sender.from,
      to,
      subject,
      text,
      html,
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error("Send failed:",err);
    res.status(500).json({ ok: false, error: err?.message ?? "Send failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Mailer listening on ${PORT}`);
});
