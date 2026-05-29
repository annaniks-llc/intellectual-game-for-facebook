import { Router } from "express";
import { createPlayerAuthController } from "../controllers/playerAuthController.js";
import { authGuard, ROLE_PLAYER } from "../services/authService.js";

export function createPlayerMeRoutes(db) {
  const router = Router();
  const player = createPlayerAuthController(db);

  router.get("/me", authGuard(ROLE_PLAYER), player.me);

  return router;
}
