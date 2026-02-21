import { updateUserCart } from "../db/usersDb.js";

//Update User Cartdata: /api/cart/update
export const updateCart = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not Authorized" });
    }

    if (cartItems == null || typeof cartItems !== "object" || Array.isArray(cartItems)) {
      return res.status(400).json({ success: false, message: "Invalid cart data" });
    }

    // Validate each quantity is a positive integer
    for (const [productId, qty] of Object.entries(cartItems)) {
      if (!productId || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ success: false, message: "Invalid cart item quantity" });
      }
    }

    const updated = await updateUserCart(userId, cartItems);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
