// src/routes/contact.routes.js
import { Router } from "express";
import { postContact } from "../controllers/contact.controller.js";
import rateLimit from "express-rate-limit";

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 envíos por IP / 15min
});

router.post("/contact", limiter, postContact);


export default router;