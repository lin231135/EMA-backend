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

// Inicialización opcional de notificaciones (si existe tu servicio)
(async () => {
  try {
    const { default: notificationService } = await import(
      "./services/notification.service.js"
    );
    await notificationService.init();
    console.log("✅ Servicio de notificaciones inicializado correctamente");
  } catch (error) {
    console.warn(
      "⚠️ No se pudo inicializar el servicio de notificaciones:",
      error.message
    );
    console.log(
      "📝 El servidor continuará funcionando sin notificaciones automáticas"
    );
  }
})();

export default app;
