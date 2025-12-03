import jwt from 'jsonwebtoken';
import crypto from 'crypto';

//Login seller: /api/seller/login
export const sellerLogin = async (req, res) => {
    try {
        const {email, password} = req.body;

        if(password === process.env.SELLER_PASSWORD && email === process.env.SELLER_EMAIL) {
            const token = jwt.sign({email},process.env.JWT_SECRET, {expiresIn: '7d'});
            const csrfToken = crypto.randomUUID();
            
            res.cookie('sellerToken',token, {
                httpOnly: true, //Prevent JavaScript to access cookie
                secure: process.env.NODE_ENV === 'production', //Use secure cookies in production
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', //CSRF protection for cross-site frontend
                maxAge: 7 * 24 * 60 * 60 * 1000, //Cookie expiration time
            });
            res.cookie('csrfToken', csrfToken, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.json({success: true, message: "Logged In"})
        }
        else {
            return res.json({sucess: false, message: "Invalid Credentials"})
        }
    }
    catch (error) {
        console.log(error.message);
        res.json({sucess: false, message: error.message})
    }
}

//Check seller Authentication: /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
    try{
        return res.json({success: true})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

//Logout Seller : /api/seller/logout
export const sellerLogout = async (req,res) => {
    try {
        res.clearCookie('sellerToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        return res.json({success: true, message: "Logged Out"})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}
