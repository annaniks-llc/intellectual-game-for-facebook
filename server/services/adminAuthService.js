import { ROLE_ADMIN } from "./authService.js";

export function findAdminByEmail(db, email) {
  return db("users")
    .where({ email })
    .whereIn("role", [ROLE_ADMIN, 1, "1"])
    .first();
}

export function findAdminById(db, id) {
  return db("users")
    .where({ id })
    .whereIn("role", [ROLE_ADMIN, 1, "1"])
    .first();
}

export async function updateUserPasswordHash(db, userId, passwordHash) {
  await db("users")
    .where({ id: userId })
    .update({
      password_hash: passwordHash,
      updated_at: db.fn.now(),
    });
}

export function getAdminProfileById(db, userId) {
  return db("users")
    .select("id", "email", "role", "first_name", "last_name", "photo_url", "created_at", "updated_at")
    .where({ id: userId })
    .whereIn("role", [ROLE_ADMIN, 1, "1"])
    .first();
}

export async function updateAdminProfileById(db, userId, { firstName, lastName, photoUrl }) {
  await db("users")
    .where({ id: userId })
    .whereIn("role", [ROLE_ADMIN, 1, "1"])
    .update({
      first_name: firstName,
      last_name: lastName,
      photo_url: photoUrl || null,
      updated_at: db.fn.now(),
    });

  return getAdminProfileById(db, userId);
}
