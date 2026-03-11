import stripe from "stripe"
import {findProductById, findProductsByIds} from "../db/productsDb.js"
import crypto from "crypto";
import {createOrderWithItemsTx, findAllOrders, findOrdersByUserId, updateOrderPaid, updateOrderStatus} from "../db/ordersDb.js"
import {deleteUserCart} from "../db/usersDb.js"
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

    let subTotalCents = 0;
    const productIds = items.map((item) => item.productId);
    const products = await findProductsByIds(productIds);
    const productMap = new Map(products.map((product) => [product.id,product]));

    for(const item of items) {
        const product = productMap.get(item.productId);
        if(!product) throw new Error(`Product not found: ${item.productId}`);
        

        const unitPriceCents = Math.round(Number(product.offer_price) * 100);
        if(!Number.isFinite(unitPriceCents)) throw new Error(`Invalid product price: ${item.productId}`);

        const quantity = Number(item.quantity);
        if(!Number.isInteger(quantity)) throw new Error(`Invalid product quantity: ${item.productId}`);

        subTotalCents += unitPriceCents * quantity;
      }

      //Add Tax Charge (10%)
      const totalTaxCents = Math.round(subTotalCents * 0.1)
      const totalAmountCents = subTotalCents + totalTaxCents;

    await createOrderWithItemsTx({
      orderId: crypto.randomUUID(),
      userId,
      addressId,
      amount: totalAmountCents / 100,
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
        const {items, addressId} = req.body;
        const userId = req.userId

        //Checking if it is a bad request
        if (!userId || !addressId || !Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ success: false, message: "Invalid data" });
        }

        for (const item of items) {
          if (typeof item?.productId !== "string" || !Number.isInteger(item.quantity) || item.quantity <= 0) {
            return res.status(400).json({ success: false, message: "Invalid item data" });
          }
        }

        // Checking whether addressId belongs to the user
        const addresses = await findAddressesByUserId(userId);
        const ownsAddress = addresses.some((a) => a.id === addressId);

        if (!ownsAddress) {
          return res.status(403).json({ success: false, message: "Invalid address" });
        }

        //Select a trusted origin instead of whatever the client sends
        const allowedOrigins = [
            process.env.CLIENT_URL,
            process.env.CLIENT_URL_ALT,
        ].filter(Boolean);
        const origin = allowedOrigins.includes(req.headers.origin) ? req.headers.origin : allowedOrigins[0];
        if(!origin) {
            return res.status(500).json({success: false, message: "No allowed client origin configured"})
        }

        let productData = []
        
        //Calculate Amount Using Items
        let subTotalCents = 0;
        const productIds = items.map((item) => item.productId);
        const products = await findProductsByIds(productIds);
        const productMap = new Map(products.map((product) => [product.id,product]));

        for(const item of items) {
          const product = productMap.get(item.productId);
          if(!product) throw new Error(`Product not found: ${item.productId}`);
          

          const unitPriceCents = Math.round(Number(product.offer_price) * 100);
          if(!Number.isFinite(unitPriceCents)) throw new Error(`Invalid product price: ${item.productId}`);

          const quantity = Number(item.quantity);
          if(!Number.isInteger(quantity)) throw new Error(`Invalid product quantity: ${item.productId}`);

          subTotalCents += unitPriceCents * quantity;

          productData.push({
            name: product.name,
            unitPriceCents: unitPriceCents,
            quantity: Number(item.quantity)
          });

        }

        //Add Tax Charge (10%)
        const totalTaxCents = Math.round(subTotalCents * 0.1)
        const totalAmountCents = subTotalCents + totalTaxCents;

        const order = await createOrderWithItemsTx({
            orderId: crypto.randomUUID(),
            userId,
            addressId,
            amount: totalAmountCents / 100,
            status: "Order placed",
            paymentType: "Online",
            isPaid: false,
            items,
        });

        try {
          //Stripe Gateway Initialize
          //Basically, without secret key, we cannot create stripe object inside backend
          const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

          //Create line items for stripe
          //This structure can not be customized
          const line_items = [...productData.map((item) => {
              return {
                  price_data: {
                      currency: "usd",
                      product_data: {
                          name: item.name,
                      },
                      unit_amount: item.unitPriceCents 
                  },
                  quantity: item.quantity,
              }
          }),{
            price_data: {
                      currency: "usd",
                      product_data: {
                          name: "Sales Tax",
                      },
                      unit_amount: totalTaxCents 
                  },
                  quantity: 1,
          }];

          //Create session
          const session = await stripeInstance.checkout.sessions.create({
              line_items,
              mode: "payment",
              success_url: `${origin}/loader?next=my-orders`,
              cancel_url: `${origin}/cart`,
              metadata: {
                  orderId: order.id,
                  userId,
              }
          })

          return res.status(200).json({success: true, url: session.url})
        } catch (e) {
          if(order?.id) {
            await updateOrderStatus(order.id,"Payment init failed");
          }

          return res.status(500).json({success: false, message: e.message})
        }

        


        
    } catch (error) {
        return res.status(500).json({success: false, message: error.message})
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
    try{
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded":
        case "checkout.session.async_payment_failed": {
            const session = event.data.object;
            const {orderId, userId} = session.metadata || {};

            if(!orderId) {
              return res.status(400).json({received: false, message: "Missing orderId metadata"});
            }

            if (event.type === "checkout.session.async_payment_failed") {
              await updateOrderPaid(orderId, false);
              break;
            }

            if (session.payment_status === "paid") {
              await updateOrderPaid(orderId, true);
              if(userId) await deleteUserCart(userId);
              break;
            }

            await updateOrderStatus(orderId, "Payment pending");
            break;
        }
        default:
            console.error(`Unhandled event type ${event.type}`)
            break;
      }

      return res.json({received: true})
    } catch (error) {
      return res.status(500).json({received: false, message: error.message});
    }
}

//Get orders by userId: /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not Authorized" });
    }

    const orders = await findOrdersByUserId(userId);
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//Get all Orders (for seller/admin): api/order/seller
export const getAllOrders = async (req, res) => {
  try {
    const orders = await findAllOrders();
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
