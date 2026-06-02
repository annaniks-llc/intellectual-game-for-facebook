/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.string("first_name", 128).nullable();
    table.string("last_name", 128).nullable();
    table.string("photo_url", 2048).nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("photo_url");
    table.dropColumn("last_name");
    table.dropColumn("first_name");
  });
}
