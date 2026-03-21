import { updateUserCart } from "../db/usersDb.js";
import { validateCartItems } from "../utils/validators.js";

//Update User Cartdata: /api/cart/update
export const updateCart = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not Authorized" });
    }


    const validatedCartItems = validateCartItems(cartItems);

    const updated = await updateUserCart(userId, validatedCartItems);
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error.message);
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
