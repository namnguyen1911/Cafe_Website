import { pool } from "../configs/db.js";
import crypto from "crypto";

const clean = (value) => String(value ?? "").trim();

const normalizeDescription = (description) => {
    return Array.isArray(description) ? description.map((line) => clean(line)).filter(Boolean) : [];
}

const normalizeImages = (image) => {
    return Array.isArray(image) ? image.map((line) => clean(line)).filter(Boolean) : [];
}

export const createProduct = async (product) => {

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const description = normalizeDescription(product.description);
        const image = normalizeImages(product.image);

        const {rows} = await client.query(
            `INSERT INTO products 
            (id, name, description, price, offer_price, image, category, in_stock)
            VALUES
            ($1,$2,$3::jsonb,$4,$5,$6::jsonb,$7,$8)
            RETURNING id, name, price, offer_price, category, in_stock, created_at, updated_at`,
            [
                product._id,
                clean(product.name),
                JSON.stringify(description),
                Number(product.price),
                Number(product.offerPrice),
                JSON.stringify(image),
                clean(product.category),
                product.inStock ?? true,
            ]
        );

        for(let index = 0; index < description.length; index += 1) {
            await client.query(
                `INSERT INTO product_description_lines (id, product_id, line_order, content)
                 VALUES ($1, $2, $3, $4)`,
                 [crypto.randomUUID(),product._id, index, description[index]]
            );
        }

        for(let index = 0; index < image.length; index += 1) {
            await client.query(
                `INSERT INTO product_images (id, product_id, image_url, sort_order)
                 VALUES ($1, $2, $3, $4)`,
                 [crypto.randomUUID(),product._id, image[index], index]
            );
        }

        await client.query("COMMIT");

        return {
            _id: rows[0].id,
            name: rows[0].name,
            description,
            price: Number(rows[0].price),
            offerPrice: Number(rows[0].offer_price),
            image,
            category: rows[0].category,
            inStock: rows[0].in_stock,
            createdAt: rows[0].created_at,
            updatedAt: rows[0].updated_at
        };
        
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const updateProductByIdDb = async (id, productData) => {
    const client = await pool.connect();

    const description = normalizeDescription(productData.description);
    const image = normalizeImages(productData.image);

    try {
        await client.query("BEGIN");

        const { rows } = await client.query(
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
             RETURNING id, name, price, offer_price, category, in_stock, created_at, updated_at`,
            [
                id,
                clean(productData.name),
                JSON.stringify(description),
                Number(productData.price),
                Number(productData.offerPrice),
                JSON.stringify(image),
                clean(productData.category),
                productData.inStock ?? true,
            ]
        );

        if (!rows[0]) {
            await client.query("ROLLBACK");
            return null;
        }

        await client.query(
            `DELETE FROM product_description_lines
             WHERE product_id = $1`,
            [id]
        );

        for (let index = 0; index < description.length; index += 1) {
            await client.query(
                `INSERT INTO product_description_lines (id, product_id, line_order, content)
                 VALUES ($1, $2, $3, $4)`,
                [crypto.randomUUID(), id, index, description[index]]
            );
        }

        await client.query(
            `DELETE FROM product_images
             WHERE product_id = $1`,
            [id]
        );

        for (let index = 0; index < image.length; index += 1) {
            await client.query(
                `INSERT INTO product_images (id, product_id, image_url, sort_order)
                 VALUES ($1, $2, $3, $4)`,
                [crypto.randomUUID(), id, image[index], index]
            );
        }

        await client.query("COMMIT");

        return {
            _id: rows[0].id,
            name: rows[0].name,
            description,
            price: Number(rows[0].price),
            offerPrice: Number(rows[0].offer_price),
            image,
            category: rows[0].category,
            inStock: rows[0].in_stock,
            createdAt: rows[0].created_at,
            updatedAt: rows[0].updated_at,
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
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
    const {rows: productRows} = await pool.query(
        `SELECT id, name, price, offer_price, category, in_stock, created_at, updated_at
         FROM products
         ORDER BY created_at DESC`
    );

    if(!productRows.length) {
        return [];
    }

    const productIds = productRows.map((product) => product.id);

    const {rows: descriptionRows} = await pool.query(
        `SELECT product_id, line_order, content
         FROM product_description_lines
         WHERE product_id = ANY($1::text[])
         ORDER BY product_id, line_order `,
         [productIds]
    );

    const { rows: imageRows } = await pool.query(
        `SELECT product_id, sort_order, image_url
         FROM product_images
         WHERE product_id = ANY($1::text[])
         ORDER BY product_id, sort_order`,
        [productIds]
    );

    const descriptionsByProduct = new Map();

    for (const row of descriptionRows) {
        if (!descriptionsByProduct.has(row.product_id)) {
            descriptionsByProduct.set(row.product_id, []);
        }

        descriptionsByProduct.get(row.product_id).push(row.content);
    }

    const imagesByProduct = new Map();

    for (const row of imageRows) {
        if (!imagesByProduct.has(row.product_id)) {
            imagesByProduct.set(row.product_id, []);
        }

        imagesByProduct.get(row.product_id).push(row.image_url);
    }

    return productRows.map((product) => ({
        _id: product.id,
        name: product.name,
        description: descriptionsByProduct.get(product.id) || [],
        price: Number(product.price),
        offerPrice: Number(product.offer_price),
        image: imagesByProduct.get(product.id) || [],
        category: product.category,
        inStock: product.in_stock,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
    }));

}

//Find one product
export const findProductById = async (id) => {

    // const {rows: productRows} = await pool.query(`
    //     SELECT name, price, offer_price, category, in_stock, created_at, updated_at
    //     FROM products
    //     WHERE id = $1
    //     LIMIT 1`,
    //     [id]
    // );
    

    // if(!productRows.length) {
    //     return null;
    // }
    // const {rows: descriptionRows} = await pool.query(`
    //     SELECT product_id, line_order, content
    //     FROM product_description_lines
    //     WHERE product_id = $1
    //     ORDER BY product_id, line_order`,
    //     [id]
    // );
    
    // const {rows: imageRows} = await pool.query(`
    //     SELECT product_id, sort_order, image_url
    //     FROM product_images
    //     WHERE product_id = $1
    //     ORDER BY product_id, sort_order`,
    //     [id]
    // ) 

    // return {
    //     _id: id,
    //     name: productRows[0].name,
    //     description: descriptionRows.map((description) => description.content),
    //     price: Number(productRows[0].price),
    //     offerPrice: Number(productRows[0].offer_price),
    //     image: imageRows.map((image) => image.image_url),
    //     category: productRows[0].category,
    //     inStock: productRows[0].in_stock,
    //     createdAt: productRows[0].created_at,
    //     updatedAt: productRows[0].updated_at
    // }

    //Different approach, one query
    const {rows} = await pool.query(`
        SELECT p.id,
               p.name,
               p.category,
               p.price,
               p.offer_price,
               p.in_stock,
               p.created_at,
               p.updated_at,
               COALESCE (descriptions.disp, '[]'::jsonb) AS description,
               COALESCE (images.img, '[]'::jsonb) AS image
        FROM products AS p
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(pdl.content ORDER BY pdl.line_order) AS disp
            FROM product_description_lines AS pdl
            WHERE pdl.product_id = p.id
        ) descriptions ON TRUE
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(pi.image_url ORDER BY pi.sort_order) AS img
            FROM product_images AS pi
            WHERE pi.product_id = p.id
        ) images ON TRUE
        WHERE p.id = $1`,
        [id]
    );

    const product = rows[0];

    if(!product) {
        return null;
    }

    return {
        _id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        offerPrice: Number(product.offer_price),
        image: product.image,
        category: product.category,
        inStock: product.in_stock,
        createdAt: product.created_at,
        updatedAt: product.updated_at
    };
}

//Find multiple products
export const findProductsByIds = async (ids) => {
    const {rows} = await pool.query(
        `SELECT *
         FROM products
         WHERE id = ANY($1::text[])`,
         [ids]
    );

    return rows;
}