import { pool } from "../configs/db.js";
import crypto from "crypto";

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, email, password
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, email
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const safeName = String(name || "").trim();
    const derivedFirstName = String(firstName || "").trim() || safeName.split(/\s+/)[0] || "Unknown";
    const derivedLastName = String(lastName || "").trim() || safeName.split(/\s+/).slice(1).join(" ") || "Unknown";
    const fullName = safeName || `${derivedFirstName} ${derivedLastName}`.trim();

    const { rows: userRows } = await client.query(
    `INSERT INTO users (id, name, first_name, last_name, email, password)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, first_name, last_name, email`,
    [id, fullName, derivedFirstName, derivedLastName, email, password]
    );

    for(const [productId, quantity] of Object.entries(cartItems || {})) {
      await client.query(`
        INSERT INTO cart_items (id, user_id, product_id, quantity)
        VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), id, productId, quantity]
      );
    }

    await client.query("COMMIT");
    return {
      id: userRows[0].id,
      name: userRows[0].name,
      email: userRows[0].email,
      cartItems
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error
  } finally {
    client.release();
  }
};

export const updateUserCart = async (userId, cartItems) => {
  /* const {rows} = await pool.query(
    `UPDATE users
     SET cart_items = $2::jsonb, updated_at = NOW()
     WHERE id = $1
     RETURNING id, cart_items, updated_at`,
    [id, JSON.stringify(cartItems || {})]
  );
  return rows[0] || null; */
  const client = await pool.connect();

  try {
    await client.query("BEGIN");


    // Confirm the user exists and record that their cart changed.
    const {rows: userRows} = await client.query(`
      UPDATE users
      SET updated_at = NOW()
      WHERE id = $1
      RETURNING id, updated_at`,
      [userId])

    const user = userRows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return null;
    }

    // The current API submits the entire cart, so replace its rows atomically.

    await client.query(`
      DELETE FROM cart_items
      WHERE user_id = $1`,
      [userId]
      );

    for(const [productId, quantity] of Object.entries(cartItems || {})) {
      await client.query(`
        INSERT INTO cart_items (id, user_id, product_id, quantity)
        VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), userId, productId, quantity]
      );
    }

    await client.query("COMMIT");

    return true;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// server/db/usersDb.js
export const deleteUserCart = async (userId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {rows: userRows} = await client.query(`
      UPDATE users
      SET updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,[userId]);

    const user = userRows[0];

    if(!user) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query(`
      DELETE FROM cart_items
      WHERE user_id = $1
    `,[userId]);

    await client.query("COMMIT");
    return true;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const findCartItemsByUserId = async (userId) => {
  const {rows} = await pool.query(`
    SELECT product_id, quantity
    FROM cart_items
    WHERE user_id = $1
  `,[userId]);

  return Object.fromEntries(rows.map((row) => [row.product_id, row.quantity]));
};
