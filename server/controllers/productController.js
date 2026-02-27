import {v2 as cloudinary} from "cloudinary"
import { findAllProducts, findProductById, createProduct, updateProductByIdDb, updateProductStock} from "../db/productsDb.js";
import crypto from 'crypto';
// Add Product: /api/product/add
export const addProduct = async (req, res) => {
    try {
        let productData = JSON.parse(req.body.productData)

        const images = req.files || []

        let imageUrl = await Promise.all(
            images.map(async(item) => {
                let result = await cloudinary.uploader.upload(item.path,{
                    resource_type: 'image',
                    transformation: [
                        {width: 800, height: 800, crop: 'fill', gravity: 'auto'}, //square 1:1
                        {quality: 'auto', fetch_format: 'auto'}                   //compress & auto-format  
                    ]
                });
                return result.secure_url
            })
        )

        const id = crypto.randomUUID()

        await createProduct({...productData, image: imageUrl, _id: id})

        res.json({success:true,message:"Product Added"})

    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}

//Get Product: /api/product/list
export const productList = async (req, res) => {
    try {
        const rows = await findAllProducts()

        const products = rows.map((row) => ({
            _id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            offerPrice: row.offer_price,
            image: row.image,
            category: row.category,
            inStock: row.in_stock,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }))

        res.json({success: true, products})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}

//Get single Product: /api/product/:id
export const productById = async (req, res) => {
    try {
        const {id} = req.params

        if(!id) {
            return res.json({success: false, message: "Product id is required"})
        }

        const row = await findProductById(id)

        if(!row) {
            return res.json({success: false, message: "Product not found"})
        }

        const product =  {
            _id: row.id,
            name: row.name,
            description: row.description,
            price: row.price,
            offerPrice: row.offer_price,
            image: row.image,
            category: row.category,
            inStock: row.in_stock,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }

        res.json({success: true, product})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}

//put single Product: /api/product/:id
export const updateProductById = async (req, res) => {
    try {
        const {id} = req.params
        if(!id) {
            return res.json({success: false, message: "Product id is required"})
        }

        const existingProduct = await findProductById(id)
        if(!existingProduct) {
            return res.json({success: false, message: "Product not found"})
        }

        let productData = {};
        const raw = req.body?.productData ?? req.body;
        if (raw) {
            try {
                productData = typeof raw === "string" ? JSON.parse(raw) : raw;
            } catch {
                return res.json({ success: false, message: "Invalid product data" });
            }
        }

        const images = req.files || [];
        // start with existing images; optionally retain subset if client passes retainImages
        const retainImages = Array.isArray(productData.retainImages) ? productData.retainImages : (existingProduct.image || []);
        let imageUrl = retainImages;
        
        if(images.length) {
            const uploaded = await Promise.all(
                images.map(async(item) => {
                    let result = await cloudinary.uploader.upload(item.path,{
                        resource_type: 'image',
                        transformation: [
                            {width: 800, height: 800, crop: 'fill', gravity: 'auto'}, //square 1:1
                            {quality: 'auto', fetch_format: 'auto'}                   //compress & auto-format  
                        ]
                    });
                    return result.secure_url
                })
        )
            imageUrl = [...retainImages, ...uploaded];
        }

        delete productData.retainImages;

        const mergedProduct = {
            name: productData.name ?? existingProduct.name,
            description: productData.description ?? existingProduct.description,
            price: productData.price ?? existingProduct.price,
            offerPrice: productData.offerPrice ?? existingProduct.offer_price,
            image: imageUrl,
            category: productData.category ?? existingProduct.category,
            inStock: productData.inStock ?? existingProduct.in_stock,
        }

        const updated = await updateProductByIdDb(id,mergedProduct)

        res.json({success:true,message:"Product updated", product: updated})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}



//Change product inStock: /api/product/stock
export const changeStock = async (req, res) => {
    try {
        const {id, inStock} = req.body
        await updateProductStock(id,inStock)
        res.json({success: true, message: "Stock Updated"})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}
