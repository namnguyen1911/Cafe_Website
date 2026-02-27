import stripe from "stripe"
import User from "../models/User.js"
import {findProductById} from "../db/productsDb.js"
import crypto from "crypto";
import {createOrderWithItemsTx} from "../db/ordersDb.js"
import { findAddressesByUserId } from "../db/addressesDb.js";


//Place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { items, addressId } = req.body;
    const userId = req.userId;

    if (!userId || !addressId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    for (const item of items) {
      if (typeof item?.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Invalid item data" });
      }
    }

    const addresses = await findAddressesByUserId(userId);
    const ownsAddress = addresses.some((a) => a.id === addressId);
    if (!ownsAddress) {
      return res.status(403).json({ success: false, message: "Invalid address" });
    }

    const amount = await items.reduce(async (accPromise, item) => {
      const acc = await accPromise;
      const row = await findProductById(item.productId);
      if (!row) throw new Error(`Product not found: ${item.productId}`);

      const price = Number(row.offer_price);
      if (!Number.isFinite(price)) throw new Error(`Invalid product price: ${item.productId}`);

      return acc + price * item.quantity;
    }, Promise.resolve(0));

    const totalAmount = amount + Math.floor(amount * 0.1);

    await createOrderWithItemsTx({
      orderId: crypto.randomUUID(),
      userId,
      addressId,
      amount: totalAmount,
      status: "Order placed",
      paymentType: "COD",
      isPaid: false,
      items,
    });

    return res.status(200).json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



//Place Order Stripe : /api/order/stripe
export const placeOrderStripe = async(req, res) => {
    try {
        const {items, address} = req.body;
        const userId = req.userId

        //Select a trusted origin instead of whatever the client sends
        const allowedOrigins = [
            process.env.CLIENT_URL,
            process.env.CLIENT_URL_ALT,
        ].filter(Boolean);
        const origin = allowedOrigins.includes(req.headers.origin) ? req.headers.origin : allowedOrigins[0];
        if(!origin) {
            return res.json({success: false, message: "No allowed client origin configured"})
        }
        
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
        //Basically, without secret key, we cannot create stripe object inside backend
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        //Create line items for stripe
        //This structure can not be customized
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

//Stripe webhooks to verify payment action: /stripe
export const stripeWebhooks = async (req,res) => {
    //Stripe Gateway Initialize
    //Basically, without secret key, we cannot create stripe object inside backend
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        return res.status(400).send(`Webhook Error: ${error.message}`)
    }

    //Handle the event
    //event is a Stripe Event Object which contains many keys
    //event.type is one of those keys
    switch (event.type) {
        case "payment_intent.succeeded": {
            //event.data is one of those keys
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            //Getting session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId
            });

            //session is like a normal object
            //It contain data key
            //Data key is an array of object
            //That object is called metadata
            //Metadata contains many keys which are defined in checkout session above
            //orderId, and userId are they key inside metadata
            const {orderId, userId} = session.data[0].metadata;
            
            //Mark payment as Paid
            await Order.findByIdAndUpdate(orderId, {isPaid: true})

            //Clear user cart
            await User.findByIdAndUpdate(userId, {cartItems: {}});
            break;
        }
        case "payment_intent.failed": {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            //Getting session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId
            });

            const {orderId} = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId);
            break;
        }
    
        default:
            console.error(`Unhandled event type ${event.type}`)
            break;
    }

    return res.json({received: true})
}

//Get orders by userId: /api/order/user
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
