import { pool } from "../configs/db.js";
import crypto from "crypto"

export const createOrderWithItemsTx = async ({
  orderId,
  userId,
  addressId,
  amount,
  status = "Order placed",
  paymentType = "COD",
  isPaid = false,
  items,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders
        (id, user_id, address_id, amount, status, payment_type, is_paid)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, address_id, amount, status, payment_type, is_paid, created_at, updated_at`,
      [orderId, userId, addressId, Number(amount), status, paymentType, isPaid]
    );

    const order = orderResult.rows[0];
    if (!order) throw new Error("Failed to create order");

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Order items are required");
    }

    const values = [];
    const placeholders = [];

    items.forEach((item, i) => {
      const base = i * 4;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      values.push(
        crypto.randomUUID(),
        order.id,
        item.productId,
        Number(item.quantity)
      );
    });

    await client.query(
      `INSERT INTO order_items (id, order_id, product_id, quantity)
       VALUES ${placeholders.join(",")}
       RETURNING id`,
      values
    );

    await client.query("COMMIT");
    return order;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};


