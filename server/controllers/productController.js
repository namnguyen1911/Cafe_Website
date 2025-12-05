import {v2 as cloudinary} from "cloudinary"
import Product from "../models/Product.js"
// Add Product: /api/product/add
export const addProduct = async (req, res) => {
    try {
        let productData = JSON.parse(req.body.productData)

        const images = req.files

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

        await Product.create({...productData, image: imageUrl})

        res.json({success:true,message:"Product Added"})

    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}

//Get Product: /api/product/list
export const productList = async (req, res) => {
    try {
        const products = await Product.find({})
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

        const product = await Product.findById(id)

        if(!product) {
            return res.json({success: false, message: "Product not found"})
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

        const product = await Product.findById(id)
        if(!product) {
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
        const retainImages = Array.isArray(productData.retainImages) ? productData.retainImages : (product.image || []);
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

        const updated = await Product.findByIdAndUpdate(id,{...productData, image: imageUrl}, {new: true})

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
        await Product.findByIdAndUpdate(id,{inStock})
        res.json({success: true, message: "Stock Updated"})
    } catch (error) {
        console.log(error.message);
        res.json({success:false, message: error.message})
    }
}
