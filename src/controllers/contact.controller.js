// src/controllers/contact.controller.js
import { contactSchema } from "../validators/contact.schema.js";
import { sendContactMail } from "../services/mailer.js";

export async function postContact(req, res) {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: "Invalid payload",
        details: parsed.error.issues,
      });
    }

    const info = await sendContactMail(parsed.data);

    return res.status(202).json({
      ok: true,
      messageId: info.messageId,
    });
  } catch (err) {
    console.error("[contact] error sending mail:");
    console.error("name:", err?.name);
    console.error("code:", err?.code);
    console.error("response:", err?.response);
    console.error("command:", err?.command);
    console.error("stack:", err?.stack);
    return res.status(500).json({
      ok: false,
      error: "Unable to send message",
    });
  }
}

export default { postContact };
