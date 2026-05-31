export function listLocales(db) {
  return db("locales").select("*").orderBy("id", "asc");
}

export async function upsertLocale(db, { code, name, isEnabled, previousCode }) {
  const normalizedCode = String(code).trim().toLowerCase();
  const normalizedPrevious = previousCode ? String(previousCode).trim().toLowerCase() : "";

  if (normalizedPrevious && normalizedPrevious !== normalizedCode) {
    const row = await db("locales").where({ code: normalizedPrevious }).first();
    if (!row) return { id: null, created: false, renamed: false, notFound: true };

    const conflict = await db("locales")
      .where({ code: normalizedCode })
      .whereNot({ id: row.id })
      .first();
    if (conflict) return { id: null, created: false, renamed: false, conflict: true };

    await db("locales")
      .where({ id: row.id })
      .update({
        code: normalizedCode,
        name,
        is_enabled: isEnabled,
        updated_at: db.fn.now(),
      });
    return { id: row.id, created: false, renamed: true };
  }

  const existing = await db("locales").where({ code: normalizedCode }).first();
  if (existing) {
    await db("locales")
      .where({ id: existing.id })
      .update({
        name,
        is_enabled: isEnabled,
        updated_at: db.fn.now(),
      });
    return { id: existing.id, created: false, renamed: false };
  }

  const [id] = await db("locales").insert({
    code: normalizedCode,
    name,
    is_enabled: isEnabled,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return { id, created: true, renamed: false };
}

export async function deleteLocaleByCode(db, code) {
  const deleted = await db("locales").where({ code }).delete();
  return deleted > 0;
}

export function listCountries(db) {
  return db("countries").select("*").orderBy("id", "asc");
}

export async function upsertCountry(db, { code, defaultName, previousCode }) {
  const normalizedCode = String(code).trim().toUpperCase();
  const normalizedPrevious = previousCode ? String(previousCode).trim().toUpperCase() : "";

  if (normalizedPrevious && normalizedPrevious !== normalizedCode) {
    const row = await db("countries").where({ code: normalizedPrevious }).first();
    if (!row) return { id: null, created: false, renamed: false, notFound: true };

    const conflict = await db("countries")
      .where({ code: normalizedCode })
      .whereNot({ id: row.id })
      .first();
    if (conflict) return { id: null, created: false, renamed: false, conflict: true };

    await db("countries")
      .where({ id: row.id })
      .update({
        code: normalizedCode,
        default_name: defaultName,
        updated_at: db.fn.now(),
      });
    return { id: row.id, created: false, renamed: true };
  }

  const existing = await db("countries").where({ code: normalizedCode }).first();
  if (existing) {
    await db("countries")
      .where({ id: existing.id })
      .update({ default_name: defaultName, updated_at: db.fn.now() });
    return { id: existing.id, created: false, renamed: false };
  }

  const [id] = await db("countries").insert({
    code: normalizedCode,
    default_name: defaultName,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return { id, created: true, renamed: false };
}

export async function deleteCountryByCode(db, code) {
  const deleted = await db("countries").where({ code }).delete();
  return deleted > 0;
}

export function listTeams(db) {
  return db("teams as t")
    .leftJoin("countries as c", "c.id", "t.country_id")
    .select("t.*", "c.code as country_code", "c.default_name as country_name")
    .orderBy("t.id", "asc");
}

export async function createTeam(db, { name, shortName, crestUrl, countryId }) {
  const [id] = await db("teams").insert({
    name,
    short_name: shortName,
    crest_url: crestUrl,
    country_id: countryId,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return id;
}

export async function deleteTeamById(db, teamId) {
  const deleted = await db("teams").where({ id: teamId }).delete();
  return deleted > 0;
}

export function listAthletes(db) {
  return db("athletes as a")
    .join("teams as t", "t.id", "a.team_id")
    .select("a.*", "t.name as team_name", "t.short_name as team_short_name")
    .orderBy("a.id", "asc");
}

export async function createAthlete(db, { teamId, firstName, lastName, positionCode, isActive }) {
  const [id] = await db("athletes").insert({
    team_id: teamId,
    first_name: firstName,
    last_name: lastName,
    position_code: positionCode,
    is_active: isActive,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return id;
}

export async function deleteAthleteById(db, athleteId) {
  const deleted = await db("athletes").where({ id: athleteId }).delete();
  return deleted > 0;
}

export function listPositionLabels(db) {
  return db("position_labels as pl")
    .join("locales as l", "l.id", "pl.locale_id")
    .select("pl.id", "pl.position_code", "pl.label", "pl.locale_id", "l.code as locale_code")
    .orderBy("pl.position_code", "asc");
}

export function findLocaleByCode(db, code) {
  return db("locales").where({ code }).first();
}

export async function updatePositionLabelById(db, { id, positionCode, localeId, label }) {
  const row = await db("position_labels").where({ id }).first();
  if (!row) return { id: null, created: false, notFound: true };

  const conflict = await db("position_labels")
    .where({ position_code: positionCode, locale_id: localeId })
    .whereNot({ id })
    .first();
  if (conflict) return { id: null, created: false, conflict: true };

  await db("position_labels")
    .where({ id })
    .update({
      position_code: positionCode,
      locale_id: localeId,
      label,
      updated_at: db.fn.now(),
    });
  return { id, created: false };
}

export async function upsertPositionLabel(db, { positionCode, localeId, label }) {
  const existing = await db("position_labels").where({ position_code: positionCode, locale_id: localeId }).first();
  if (existing) {
    await db("position_labels")
      .where({ id: existing.id })
      .update({ label, updated_at: db.fn.now() });
    return { id: existing.id, created: false };
  }

  const [id] = await db("position_labels").insert({
    position_code: positionCode,
    locale_id: localeId,
    label,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return { id, created: true };
}

export async function deletePositionLabelById(db, id) {
  const deleted = await db("position_labels").where({ id }).delete();
  return deleted > 0;
}

export function listQuestionLocalizations(db) {
  return db("question_localizations as ql")
    .join("locales as l", "l.id", "ql.locale_id")
    .select("ql.id", "ql.question_key", "ql.question_text", "ql.answer_text", "ql.locale_id", "l.code as locale_code")
    .orderBy("ql.question_key", "asc");
}

export function listQuestionTemplates(db) {
  return db("question_templates").select("*").orderBy("id", "asc");
}

export async function upsertQuestionTemplate(db, { id, name, prompt, isActive }) {
  if (id) {
    const existing = await db("question_templates").where({ id }).first();
    if (existing) {
      await db("question_templates")
        .where({ id })
        .update({
          name,
          prompt,
          is_active: isActive,
          updated_at: db.fn.now(),
        });
      return { id: existing.id, created: false };
    }
  }

  const [insertedId] = await db("question_templates").insert({
    name,
    prompt,
    is_active: isActive,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return { id: insertedId, created: true };
}

export async function deleteQuestionTemplateById(db, id) {
  const deleted = await db("question_templates").where({ id }).delete();
  return deleted > 0;
}

export async function upsertQuestionLocalization(db, { questionKey, localeId, questionText, answerText }) {
  const existing = await db("question_localizations")
    .where({ question_key: questionKey, locale_id: localeId })
    .first();

  if (existing) {
    await db("question_localizations")
      .where({ id: existing.id })
      .update({
        question_text: questionText,
        answer_text: answerText,
        updated_at: db.fn.now(),
      });
    return { id: existing.id, created: false };
  }

  const [id] = await db("question_localizations").insert({
    question_key: questionKey,
    locale_id: localeId,
    question_text: questionText,
    answer_text: answerText,
    created_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  return { id, created: true };
}
