import { Router } from "express";
import { createAdminAuthController } from "../controllers/adminAuthController.js";

export function createAdminMeRoutes(db) {
  const router = Router();
  const admin = createAdminAuthController(db);

  router.get("/me", admin.adminGuard, admin.me);
  router.put("/me", admin.adminGuard, admin.updateMe);

  return router;
}
