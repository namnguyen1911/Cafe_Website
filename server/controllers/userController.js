import { createUser, findUserByEmail, findUserById, updateUserCart} from "../db/usersDb.js";
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

        const existingUser = await findUserByEmail(email)

        if(existingUser) 
            return res.json({success: false, message: "User already exists"})

        const id = crypto.randomUUID();

        const hashedPassword = await bcrypt.hash(password,10)

        const created = await createUser({
            id,
            name,
            email,
            password: hashedPassword,
            cartItems: req.body.cartItems || {},
        });


        const token = jwt.sign({id: created.id}, process.env.JWT_SECRET,{expiresIn: '7d'});
        const csrfToken = crypto.randomUUID();

        res.cookie('token',token, {
            httpOnly: true, //Prevent JavaScript to access cookie
            secure: process.env.NODE_ENV === 'production', //Use secure cookies in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', //CSRF protection for cross-site frontend
            maxAge: 7 * 24 * 60 * 60 * 1000, //Cookie expiration time
        })
        res.cookie('userCsrfToken', csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.json({
            success: true,
            user: { email: created.email, name: created.name, cartItems: created.cart_items || {} }
        });

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

        const user = await findUserByEmail(email);
        if(!user) {
            return res.json({success:false, message: "Invalid email or password"});
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch)
            return res.json({success:false, message: "Invalid email or password"});

        // Merge guest cart with user's cart (guest cart overwrites matching items)
        const guestCart = req.body.cartItems || {};
        const mergedCart = { ...(user.cart_items || {}) };
        for (const [productId, qty] of Object.entries(guestCart)) {
            if (!qty || qty < 1) continue;
            mergedCart[productId] = qty;
        }

        await updateUserCart(user.id,mergedCart)
        

        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET,{expiresIn: '7d'});
        const csrfToken = crypto.randomUUID();

        res.cookie('token',token, {
            httpOnly: true, //Prevent JavaScript to access cookie
            secure: process.env.NODE_ENV === 'production', //Use secure cookies in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', //CSRF protection for cross-site frontend
            maxAge: 7 * 24 * 60 * 60 * 1000, //Cookie expiration time
        })
        res.cookie('userCsrfToken', csrfToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.json({success: true, user: { email: user.email, name: user.name, cartItems: mergedCart || {} }
})
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
        if (!req.cookies?.userCsrfToken) {
            return res.json({success: false, message: "Not Authorized"});
        }
        const user = await findUserById(userId);

        return res.json({
            success: true,
            user: user ? { id: user.id, email: user.email, name: user.name, cartItems: user.cart_items || {} } : null
        });

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
        res.clearCookie('userCsrfToken', {
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
