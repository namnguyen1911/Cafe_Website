import { pool } from "../configs/db.js";

const clean = (value) => String(value ?? "").trim();

export const createProduct = async (product) => {
    const {rows} = await pool.query(
        `INSERT INTO products 
        (id, name, description, price, offer_price, image, category, in_stock)
        VALUES
        ($1,$2,$3::jsonb,$4,$5,$6::jsonb,$7,$8)
        RETURNING id, name, description, price, offer_price, image, category, in_stock, created_at, updated_at`,
        [
            product._id,
            clean(product.name),
            JSON.stringify(Array.isArray(product.description) ? product.description : []),
            Number(product.price),
            Number(product.offerPrice),
            JSON.stringify(Array.isArray(product.image) ? product.image : []),
            clean(product.category),
            product.inStock ?? true,
        ]
    )

    return rows[0] || null;
}

export const updateProductByIdDb = async (id, productData) => {
  const { rows } = await pool.query(
    `UPDATE products
     SET name = $2,
         description = $3::jsonb,
         price = $4,
         offer_price = $5,
         image = $6::jsonb,
         category = $7,
         in_stock = $8,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, description, price, offer_price, image, category, in_stock, created_at, updated_at`,
    [
      id,
      clean(productData.name),
      JSON.stringify(Array.isArray(productData.description) ? productData.description : []),
      Number(productData.price),
      Number(productData.offerPrice),
      JSON.stringify(Array.isArray(productData.image) ? productData.image : []),
      clean(productData.category),
      productData.inStock ?? true,
    ]
  );

  return rows[0] || null;
};

export const updateProductStock = async (id, inStock) => {
    const {rows} = await pool.query(
        `UPDATE products
         SET in_stock = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING id, name, description, price, offer_price, image, category, in_stock, created_at, updated_at`,
         [id,inStock]
    )

    return rows[0] || null;
}


export const findAllProducts = async () => {
    const {rows} = await pool.query(
        `SELECT *
         FROM products
         ORDER BY created_at DESC`
    );
    return rows;
}

export const findProductById = async (id) => {
    const {rows} = await pool.query(
        `SELECT *
         FROM products
         WHERE id = $1
         LIMIT 1`,
         [id]
    );
    return rows[0] || null;
}