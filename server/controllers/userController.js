import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

//Register User: /api/user/register
export const register = async (req, res) => {
    try{
        const {name, email, password} = req.body;
        if(!name || !email || !password) {
            return res.json({success: false, message: "Missing Details"})
        }

        const existingUser = await User.findOne({email})

        if(existingUser) 
            return res.json({success: false, message: "User already exists"})

        const hashedPassword = await bcrypt.hash(password,10)

        const user = await User.create({name, email, password: hashedPassword, cartItems: req.body.cartItems || {}})

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{expiresIn: '7d'});
        const csrfToken = crypto.randomUUID();

        res.cookie('token',token, {
            httpOnly: true, //Prevent JavaScript to access cookie
            secure: process.env.NODE_ENV === 'production', //Use secure cookies in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', //CSRF protection for cross-site frontend
            maxAge: 7 * 24 * 60 * 60 * 1000, //Cookie expiration time
        })
        res.cookie('csrfToken', csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.json({success: true, user: {email: user.email, name: user.name, cartItems: user.cartItems || {}}})
    } catch(error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}


//Login User: /api/user/login

export const login = async (req, res) => {
    try{
        const {email,password} = req.body;

        if(!email || !password)
            return res.json({success:false, message: "Email and password are required"});

        const user = await User.findOne({email});
        if(!user) {
            return res.json({success:false, message: "Invalid email or password"});
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch)
            return res.json({success:false, message: "Invalid email or password"});

        // Merge guest cart with user's cart (guest cart overwrites matching items)
        const guestCart = req.body.cartItems || {};
        const mergedCart = { ...(user.cartItems || {}) };
        for (const [productId, qty] of Object.entries(guestCart)) {
            if (!qty || qty < 1) continue;
            mergedCart[productId] = qty;
        }
        user.cartItems = mergedCart;
        await user.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{expiresIn: '7d'});
        const csrfToken = crypto.randomUUID();

        res.cookie('token',token, {
            httpOnly: true, //Prevent JavaScript to access cookie
            secure: process.env.NODE_ENV === 'production', //Use secure cookies in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', //CSRF protection for cross-site frontend
            maxAge: 7 * 24 * 60 * 60 * 1000, //Cookie expiration time
        })
        res.cookie('csrfToken', csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.json({success: true, user: {email: user.email, name: user.name, cartItems: user.cartItems || {}}})
    } catch(error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

//Check Auth: /api/user/is-auth
export const isAuth = async (req, res) => {
    try{
        const userId = req.userId;
        //If auth cookie is present but CSRF token is missing, treat as unauthenticated
        if (!req.cookies?.csrfToken) {
            return res.json({success: false, message: "Not Authorized"});
        }
        const user = await User.findById(userId).select("-password")
        return res.json({success: true, user})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

//Logout User : /api/user/logout

export const logout = async (req,res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });
        res.clearCookie('csrfToken', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        return res.json({success: true, message: "Logged Out"})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}
