import { pool } from "../configs/db.js";

const clean = (value) => String(value ?? "").trim();

export const createAddress = async ({ id, userId, address }) => {
  const { rows } = await pool.query(
    `INSERT INTO addresses
      (id, user_id, first_name, last_name, email, street, city, state, zipcode, country, phone)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, user_id, first_name, last_name, email, street, city, state, zipcode, country, phone, created_at, updated_at`,
    [
      id,
      userId,
      clean(address.firstName),
      clean(address.lastName),
      clean(address.email),
      clean(address.street),
      clean(address.city),
      clean(address.state),
      clean(address.zipcode),
      clean(address.country),
      clean(address.phone),
    ]
  );
  return rows[0] || null;
};

export const findAddressesByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id, user_id, first_name, last_name, email, street, city, state, zipcode, country, phone, created_at, updated_at
     FROM addresses
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};
