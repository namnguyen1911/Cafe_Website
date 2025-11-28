import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe"


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

//Place Order Stripe : /api/order/stripe
export const placeOrderStripe = async(req, res) => {
    try {
        const {items, address} = req.body;
        const userId = req.userId
        const {origin} = req.headers;

        
        if(!address || items.length === 0) {
            return res.json({sucess: false, message: "Invalid data"})
        }

        let productData = []

        //Calculate Amount Using Items
        let amount = await items.reduce(async(acc, item ) => {
            const product = await Product.findById(item.product);
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity
            });
            return (await acc) + product.offerPrice * item.quantity;
        },0)

        //Add Tax Charge (10%)
        amount += Math.floor(amount * 0.10);

        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            status: "Order placed",
            paymentType: "Online",
        });

        //Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        //Create line items for stripe
        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: Math.floor(item.price + item.price * 0.02) * 100
                },
                quantity: item.quantity,
            }
        })

        //Create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId,
            }
        })


        return res.json({success: true, url: session.url})
    } catch (error) {
        return res.json({sucess: false, message: error.message})
    }
}

//Ger orders by userId: /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.userId;
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