import { pool } from "../configs/db.js";

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, email, password, cart_items
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, email, cart_items
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const createUser = async ({ 
  id, 
  name, 
  firstName,
  lastName,
  email, 
  password, 
  cartItems = {} 
}) => {
  const safeName = String(name || "").trim();
  const derivedFirstName = String(firstName || "").trim() || safeName.split(/\s+/)[0] || "Unknown";
  const derivedLastName = String(lastName || "").trim() || safeName.split(/\s+/).slice(1).join(" ") || "Unknown";
  const fullName = safeName || `${derivedFirstName} ${derivedLastName}`.trim();


  const { rows } = await pool.query(
    `INSERT INTO users (id, name, first_name, last_name, email, password, cart_items)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
     RETURNING id, name, first_name, last_name, email, cart_items`,
    [id, fullName, derivedFirstName, derivedLastName, email, password, JSON.stringify(cartItems)]
  );
  return rows[0];
};

export const updateUserCart = async (id, cartItems) => {
  const {rows} = await pool.query(
    `UPDATE users
     SET cart_items = $2::jsonb, updated_at = NOW()
     WHERE id = $1
     RETURNING id, cart_items, updated_at`,
    [id, JSON.stringify(cartItems || {})]
  );
  return rows[0] || null;
};

// server/db/usersDb.js
export const deleteUserCart = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET cart_items = '{}'::jsonb,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, cart_items, updated_at`,
    [userId]
  );

  return rows[0] || null;
};
