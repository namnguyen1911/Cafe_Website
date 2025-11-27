import Order from "../models/Order.js";
import Product from "../models/Product.js";


//Place Order COD : /api/order/cod
export const placeOrderCOD = async(req, res) => {
    try {
        const {items, address} = req.body;
        const userId = req.userId
        
        if(!address || items.length === 0) {
            return res.json({sucess: false, message: "Invalid data"})
        }
        //Calculate Amount Using Items
        let amount = await items.reduce(async(acc, item ) => {
            const product = await Product.findById(item.product);
            return (await acc) + product.offerPrice * item.quantity;
        },0)

        //Add Tax Charge (10%)
        amount += Math.floor(amount * 0.1);

        await Order.create({
            userId,
            items,
            amount,
            address,
            status: "Order placed",
            paymentType: "COD",
        });
        return res.json({success: true, message: "Order Placed Successfully"})
    } catch (error) {
        return res.json({sucess: false, message: error.message})
    }
}

//Ger orders by userId: /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const {userId} = req.body;
        const orders = await Order.find({
            userId,
            $or: [{paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success: true, orders});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}

//Get all Orders (for seller/admin): api/order/seller
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1});
        res.json({success: true, orders});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
}