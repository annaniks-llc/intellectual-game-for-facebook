import {
  createAthlete as createAthleteInDb,
  createTeam as createTeamInDb,
  deleteAthleteById as deleteAthleteByIdInDb,
  deleteCountryByCode as deleteCountryByCodeInDb,
  deleteLocaleByCode as deleteLocaleByCodeInDb,
  deletePositionLabelById as deletePositionLabelByIdInDb,
  deleteTeamById as deleteTeamByIdInDb,
  findLocaleByCode,
  listAthletes as listAthletesFromDb,
  listCountries as listCountriesFromDb,
  listLocales as listLocalesFromDb,
  listPositionLabels as listPositionLabelsFromDb,
  listQuestionLocalizations as listQuestionLocalizationsFromDb,
  listTeams as listTeamsFromDb,
  upsertCountry as upsertCountryInDb,
  upsertLocale as upsertLocaleInDb,
  updatePositionLabelById as updatePositionLabelByIdInDb,
  upsertPositionLabel as upsertPositionLabelInDb,
  upsertQuestionLocalization as upsertQuestionLocalizationInDb,
  listQuestionTemplates as listQuestionTemplatesFromDb,
  upsertQuestionTemplate as upsertQuestionTemplateInDb,
  deleteQuestionTemplateById as deleteQuestionTemplateByIdInDb,
} from "../services/adminContentService.js";

export function createAdminContentController(db) {
  async function listLocales(_req, res) {
    const rows = await listLocalesFromDb(db);
    res.json(rows);
  }

  async function upsertLocale(req, res) {
    const code = String(req.body?.code || "").trim().toLowerCase();
    const name = String(req.body?.name || "").trim();
    const isEnabled = req.body?.is_enabled !== false;
    const previousCode = String(req.body?.previous_code || "").trim().toLowerCase();
    if (!code || !name) return res.status(400).json({ error: "code and name are required" });

    const result = await upsertLocaleInDb(db, {
      code,
      name,
      isEnabled,
      previousCode: previousCode || undefined,
    });
    if (result.notFound) return res.status(404).json({ error: "locale not found" });
    if (result.conflict) return res.status(409).json({ error: "locale code already exists" });

    return res.status(result.created ? 201 : 200).json({ ok: true, id: result.id });
  }

  async function deleteLocale(req, res) {
    const code = String(req.params.code || "")
      .trim()
      .toLowerCase();
    if (!code) return res.status(400).json({ error: "code is required" });

    const deleted = await deleteLocaleByCodeInDb(db, code);
    if (!deleted) return res.status(404).json({ error: "locale not found" });
    return res.json({ ok: true });
  }

  async function listCountries(_req, res) {
    const rows = await listCountriesFromDb(db);
    res.json(rows);
  }

  async function upsertCountry(req, res) {
    const code = String(req.body?.code || "").trim().toUpperCase();
    const defaultName = String(req.body?.default_name || "").trim();
    const previousCode = String(req.body?.previous_code || "").trim().toUpperCase();
    if (code.length !== 2 || !defaultName) return res.status(400).json({ error: "valid country code and default_name are required" });

    const result = await upsertCountryInDb(db, {
      code,
      defaultName,
      previousCode: previousCode || undefined,
    });
    if (result.notFound) return res.status(404).json({ error: "country not found" });
    if (result.conflict) return res.status(409).json({ error: "country code already exists" });

    return res.status(result.created ? 201 : 200).json({ ok: true, id: result.id });
  }

  async function deleteCountry(req, res) {
    const code = String(req.params.code || "")
      .trim()
      .toUpperCase();
    if (code.length !== 2) return res.status(400).json({ error: "valid country code is required" });

    const deleted = await deleteCountryByCodeInDb(db, code);
    if (!deleted) return res.status(404).json({ error: "country not found" });
    return res.json({ ok: true });
  }

  async function listTeams(_req, res) {
    const rows = await listTeamsFromDb(db);
    res.json(rows);
  }

  async function createTeam(req, res) {
    const name = String(req.body?.name || "").trim();
    const shortName = req.body?.short_name ? String(req.body.short_name).trim() : null;
    const crestUrl = req.body?.crest_url ? String(req.body.crest_url).trim() : null;
    const countryId = req.body?.country_id ? Number(req.body.country_id) : null;
    if (!name) return res.status(400).json({ error: "name is required" });

    const id = await createTeamInDb(db, { name, shortName, crestUrl, countryId });
    return res.status(201).json({ ok: true, id });
  }

  async function deleteTeam(req, res) {
    const teamId = Number(req.params.id);
    if (!teamId) return res.status(400).json({ error: "valid team id is required" });

    const deleted = await deleteTeamByIdInDb(db, teamId);
    if (!deleted) return res.status(404).json({ error: "team not found" });
    return res.json({ ok: true });
  }

  async function listAthletes(_req, res) {
    const rows = await listAthletesFromDb(db);
    res.json(rows);
  }

  async function createAthlete(req, res) {
    const teamId = Number(req.body?.team_id);
    const firstName = String(req.body?.first_name || "").trim();
    const lastName = String(req.body?.last_name || "").trim();
    const positionCode = String(req.body?.position_code || "").trim().toUpperCase();
    const isActive = req.body?.is_active !== false;
    if (!teamId || !firstName || !lastName || !positionCode) {
      return res.status(400).json({ error: "team_id, first_name, last_name, position_code are required" });
    }

    const id = await createAthleteInDb(db, { teamId, firstName, lastName, positionCode, isActive });
    return res.status(201).json({ ok: true, id });
  }

  async function deleteAthlete(req, res) {
    const athleteId = Number(req.params.id);
    if (!athleteId) return res.status(400).json({ error: "valid athlete id is required" });

    const deleted = await deleteAthleteByIdInDb(db, athleteId);
    if (!deleted) return res.status(404).json({ error: "athlete not found" });
    return res.json({ ok: true });
  }

  async function listPositionLabels(_req, res) {
    const rows = await listPositionLabelsFromDb(db);
    res.json(rows);
  }

  async function upsertPositionLabel(req, res) {
    const id = Number(req.body?.id);
    const positionCode = String(req.body?.position_code || "").trim().toUpperCase();
    const localeCode = String(req.body?.locale_code || "").trim().toLowerCase();
    const label = String(req.body?.label || "").trim();
    if (!positionCode || !localeCode || !label) {
      return res.status(400).json({ error: "position_code, locale_code, label are required" });
    }

    const locale = await findLocaleByCode(db, localeCode);
    if (!locale) return res.status(404).json({ error: "locale not found" });

    if (id) {
      const result = await updatePositionLabelByIdInDb(db, {
        id,
        positionCode,
        localeId: locale.id,
        label,
      });
      if (result.notFound) return res.status(404).json({ error: "position label not found" });
      if (result.conflict) {
        return res.status(409).json({ error: "position label already exists for this locale" });
      }
      return res.json({ ok: true, id: result.id });
    }

    const { id: newId, created } = await upsertPositionLabelInDb(db, {
      positionCode,
      localeId: locale.id,
      label,
    });
    return res.status(created ? 201 : 200).json({ ok: true, id: newId });
  }

  async function deletePositionLabel(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "valid id is required" });

    const deleted = await deletePositionLabelByIdInDb(db, id);
    if (!deleted) return res.status(404).json({ error: "position label not found" });
    return res.json({ ok: true });
  }

  async function listQuestionTemplates(_req, res) {
    const rows = await listQuestionTemplatesFromDb(db);
    res.json(rows);
  }

  async function upsertQuestionTemplate(req, res) {
    const id = req.body?.id ? Number(req.body.id) : null;
    const name = String(req.body?.name || "").trim();
    const prompt = String(req.body?.prompt || "").trim();
    const isActive = req.body?.is_active !== false;
    if (!name || !prompt) {
      return res.status(400).json({ error: "name and prompt are required" });
    }

    try {
      const { id: savedId, created } = await upsertQuestionTemplateInDb(db, {
        id: id || undefined,
        name,
        prompt,
        isActive,
      });
      return res.status(created ? 201 : 200).json({ ok: true, id: savedId });
    } catch (error) {
      if (error?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "template name already exists" });
      }
      throw error;
    }
  }

  async function deleteQuestionTemplate(req, res) {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "valid id is required" });

    const deleted = await deleteQuestionTemplateByIdInDb(db, id);
    if (!deleted) return res.status(404).json({ error: "template not found" });
    return res.json({ ok: true });
  }

  async function listQuestionLocalizations(_req, res) {
    const rows = await listQuestionLocalizationsFromDb(db);
    res.json(rows);
  }

  async function upsertQuestionLocalization(req, res) {
    const questionKey = String(req.body?.question_key || "").trim();
    const localeCode = String(req.body?.locale_code || "").trim().toLowerCase();
    const questionText = String(req.body?.question_text || "").trim();
    const answerText = String(req.body?.answer_text || "").trim();
    if (!questionKey || !localeCode || !questionText || !answerText) {
      return res.status(400).json({ error: "question_key, locale_code, question_text, answer_text are required" });
    }

    const locale = await findLocaleByCode(db, localeCode);
    if (!locale) return res.status(404).json({ error: "locale not found" });

    const { id, created } = await upsertQuestionLocalizationInDb(db, {
      questionKey,
      localeId: locale.id,
      questionText,
      answerText,
    });
    return res.status(created ? 201 : 200).json({ ok: true, id });
  }

  return {
    listLocales,
    upsertLocale,
    deleteLocale,
    listCountries,
    upsertCountry,
    deleteCountry,
    listTeams,
    createTeam,
    deleteTeam,
    listAthletes,
    createAthlete,
    deleteAthlete,
    listPositionLabels,
    upsertPositionLabel,
    deletePositionLabel,
    listQuestionTemplates,
    upsertQuestionTemplate,
    deleteQuestionTemplate,
    listQuestionLocalizations,
    upsertQuestionLocalization,
  };
}
