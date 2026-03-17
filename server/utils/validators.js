import { createHttpError } from "./http.js";

export const validateCartItems = (cartItems) => {
    if(cartItems == null || typeof cartItems != "object" || Array.isArray(cartItems)) {
        throw createHttpError(400, "Invalid cart data");
    }

    for(const [productId, qty] of Object.entries(cartItems)) {
        if(!productId || !Number.isInteger(qty) || qty < 1) {
            throw createHttpError(400, "Invalid cart item quantity");
        }
    }

    return cartItems;
}