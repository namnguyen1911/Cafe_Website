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

export const findOrdersByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT 
      o.id                  AS order_id,
      o.user_id,
      o.address_id,
      o.amount,
      o.status,
      o.payment_type,
      o.is_paid,
      o.created_at          AS order_created_at,
      o.updated_at          AS order_updated_at,
      oi.product_id,
      oi.quantity           AS item_quantity,
      p.name                AS product_name,
      p.price               AS product_price,
      p.offer_price         AS product_offer_price,
      p.image               AS product_image,
      p.category            AS product_category
     FROM orders o 
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC, oi.created_at ASC`,
    [userId]
  );

  const map = new Map();

  for (const r of rows) {
    if (!map.has(r.order_id)) {
      map.set(r.order_id, {
        _id: r.order_id,
        userId: r.user_id,
        addressId: r.address_id,
        amount: Number(r.amount),
        status: r.status,
        paymentType: r.payment_type,
        isPaid: r.is_paid,
        createdAt: r.order_created_at,
        updatedAt: r.order_updated_at,
        items: [],
      });
    }

    map.get(r.order_id).items.push({
      _id: r.product_id,
      name: r.product_name,
      quantity: Number(r.item_quantity),
      price: Number(r.product_price),
      offerPrice: Number(r.product_offer_price),
      image: r.product_image,
      category: r.product_category,
    });
  }

  return Array.from(map.values());
};


export const findAllOrders = async() => {
  const { rows } = await pool.query(
    `SELECT 
      o.id                  AS order_id,
      o.user_id,
      o.address_id,
      o.amount,
      o.status,
      o.payment_type,
      o.is_paid,
      o.created_at          AS order_created_at,
      o.updated_at          AS order_updated_at,
      oi.product_id,
      oi.quantity           AS item_quantity,
      p.name                AS product_name,
      p.price               AS product_price,
      p.offer_price         AS product_offer_price,
      p.image               AS product_image,
      p.category            AS product_category
     FROM orders o 
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON p.id = oi.product_id
     ORDER BY o.created_at DESC, oi.created_at ASC`,
  );

  const map = new Map();

  for (const r of rows) {
    if (!map.has(r.order_id)) {
      map.set(r.order_id, {
        _id: r.order_id,
        userId: r.user_id,
        addressId: r.address_id,
        amount: Number(r.amount),
        status: r.status,
        paymentType: r.payment_type,
        isPaid: r.is_paid,
        createdAt: r.order_created_at,
        updatedAt: r.order_updated_at,
        items: [],
      });
    }

    map.get(r.order_id).items.push({
      _id: r.product_id,
      name: r.product_name,
      quantity: Number(r.item_quantity),
      price: Number(r.product_price),
      offerPrice: Number(r.product_offer_price),
      image: r.product_image,
      category: r.product_category,
    });
  }

  return Array.from(map.values());
}


export const updateOrderPaid = async (orderId, isPaid = true) => {
  const nextStatus = isPaid ? "Order placed" : "Payment failed";

  const { rows } = await pool.query(
    `UPDATE orders
     SET is_paid = $2,
         status = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, address_id, amount, status, payment_type, is_paid, created_at, updated_at`,
    [orderId, isPaid, nextStatus]
  );

  return rows[0] || null;
};

export const updateOrderStatus = async (orderId, status) => {
  const {rows} = await pool.query(
    `UPDATE orders
     SET status = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, status, is_paid, updated_at`,
     [orderId,status]
  )

  return rows[0] || null;
}

export const deleteOrderById = async (orderId) => {
  const { rows } = await pool.query(
    `DELETE FROM orders
     WHERE id = $1
     RETURNING id, user_id, address_id, amount, status, payment_type, is_paid, created_at, updated_at`,
    [orderId]
  );

  return rows[0] || null;
};






