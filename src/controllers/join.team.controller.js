// src/controllers/join.team.controller.js
import { joinTeamSchema } from "../validators/join.team.schema.js";
import { sendJoinTeamMail } from "../services/mailer.js";

export async function postJoinTeamEmail(req, res) {
    try {
        const parsed = joinTeamSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: "Validation failed",
                details: parsed.error.issues,
            });
        }

        const data = parsed.data;
        const info = await sendJoinTeamMail(parsed.data);

        console.log("email sent succesfully");
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

export default { postJoinTeamEmail };
