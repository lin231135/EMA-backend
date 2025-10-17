// src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.js";

dotenv.config();

const app = express();

// Evita errores de rate-limit con IP indefinida, sin ser permisivo
app.set("trust proxy", "loopback"); // desarrollo/docker local
// Producción detrás de 1 proxy real: app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

// Monta todas las rutas bajo /api
app.use("/api", router);

// Healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

export default app;
