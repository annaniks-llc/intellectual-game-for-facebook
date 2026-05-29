import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import db from "./db/connection.js";
import { health } from "./controllers/healthController.js";
import { createAdminRoutes } from "./routes/adminRoutes.js";
import { createAdminMeRoutes } from "./routes/adminMeRoutes.js";
import { createPlayerRoutes } from "./routes/playerRoutes.js";
import { createPlayerMeRoutes } from "./routes/playerMeRoutes.js";
import { createFacebookRoutes } from "./routes/facebookRoutes.js";

dotenv.config({ path: "./.env" });

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigins = new Set(
  [
    ...(process.env.FRONTEND_URL || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    ...(process.env.ADMIN_FRONTEND_URL || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ]
);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/health", health);
app.use("/admin", createAdminMeRoutes(db));
app.use("/player", createPlayerMeRoutes(db));
app.use("/api", createPlayerRoutes(db));
app.use("/api/facebook", createFacebookRoutes(db));
app.use("/v1/admin", createAdminRoutes(db));

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
