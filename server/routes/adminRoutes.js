import { Router } from "express";
import { createAdminAuthController } from "../controllers/adminAuthController.js";
import { createAdminContentController } from "../controllers/adminContentController.js";

export function createAdminRoutes(db) {
  const router = Router();
  const admin = createAdminAuthController(db);
  const content = createAdminContentController(db);

  router.post("/auth/login", admin.login);
  router.post("/auth/forgot-password", admin.forgotPassword);
  router.post("/auth/reset-password", admin.resetPassword);
  router.post("/auth/request-change-password-code", admin.adminGuard, admin.requestChangePasswordCode);
  router.post("/auth/change-password", admin.adminGuard, admin.changePassword);

  router.get("/me", admin.adminGuard, admin.me);

  router.get("/locales", admin.adminGuard, content.listLocales);
  router.post("/locales", admin.adminGuard, content.upsertLocale);
  router.delete("/locales/:code", admin.adminGuard, content.deleteLocale);

  router.get("/countries/localizations", admin.adminGuard, content.listCountries);
  router.post("/countries/localizations", admin.adminGuard, content.upsertCountry);
  router.delete("/countries/:code", admin.adminGuard, content.deleteCountry);

  router.get("/teams", admin.adminGuard, content.listTeams);
  router.post("/teams", admin.adminGuard, content.createTeam);
  router.delete("/teams/:id", admin.adminGuard, content.deleteTeam);

  router.get("/athletes", admin.adminGuard, content.listAthletes);
  router.post("/athletes", admin.adminGuard, content.createAthlete);
  router.delete("/athletes/:id", admin.adminGuard, content.deleteAthlete);

  router.get("/position-labels", admin.adminGuard, content.listPositionLabels);
  router.post("/position-labels", admin.adminGuard, content.upsertPositionLabel);
  router.delete("/position-labels/:id", admin.adminGuard, content.deletePositionLabel);

  router.get("/templates", admin.adminGuard, content.listQuestionTemplates);
  router.post("/templates", admin.adminGuard, content.upsertQuestionTemplate);
  router.delete("/templates/:id", admin.adminGuard, content.deleteQuestionTemplate);

  // Admin-editable question/answer language records.
  router.get("/question-localizations", admin.adminGuard, content.listQuestionLocalizations);
  router.post("/question-localizations", admin.adminGuard, content.upsertQuestionLocalization);

  return router;
}
