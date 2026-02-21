import crypto from "crypto";
import { createAddress, findAddressesByUserId } from "../db/addressesDb.js";

//Add Address: /api/address/add
export const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not Authorized" });
    }

    if (!address || typeof address !== "object" || Array.isArray(address)) {
      return res.status(400).json({ success: false, message: "Invalid address data" });
    }

    const required = ["firstName", "lastName", "email", "street", "city", "state", "zipcode", "country", "phone"];
    for (const key of required) {
      const value = address[key];
      if (value == null || String(value).trim() === "") {
        return res.status(400).json({ success: false, message: `Missing address field: ${key}` });
      }
    }

    const zipcodeStr = String(address.zipcode).trim();
    const phoneStr = String(address.phone).trim();

    // Basic format checks; tune by target countries if needed
    if (!/^[A-Za-z0-9 -]{3,12}$/.test(zipcodeStr)) {
      return res.status(400).json({ success: false, message: "Invalid zipcode format" });
    }

    if (!/^\+?[0-9][0-9 -]{6,19}$/.test(phoneStr)) {
      return res.status(400).json({ success: false, message: "Invalid phone format" });
    }

    const created = await createAddress({
      id: crypto.randomUUID(),
      userId,
      address,
    });

    if (!created) {
      return res.status(500).json({ success: false, message: "Failed to create address" });
    }

    return res.status(200).json({ success: true, message: "Address added successfully" });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};


//Get Address: /api/address/get
export const getAddress = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not Authorized" });
    }

    const rows = await findAddressesByUserId(userId);

    const addresses = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      street: row.street,
      city: row.city,
      state: row.state,
      zipcode: row.zipcode,
      country: row.country,
      phone: row.phone,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
