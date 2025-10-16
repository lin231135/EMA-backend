// src/routes/join.team.routes.js
import { Router } from "express";
import { postJoinTeamEmail } from "../controllers/join.team.controller.js";
import rateLimit from "express-rate-limit";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 envíos por IP / 15min
});

router.post("/", limiter, postJoinTeamEmail);


export default router;