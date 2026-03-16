import jwt from 'jsonwebtoken'

const authSeller = async (req, res, next) => {
    const {sellerToken} = req.cookies;

    if(!sellerToken) {
        return res.status(401).json({success: false, message: "Not Authorized"})
    }

    try{
            const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET)
            if(tokenDecode.email === process.env.SELLER_EMAIL) {
                next();
            } else {
                return res.status(401).json({success: false, message: "Not Authorized"})
            }
            
    
        } catch(error) {
            res.status(401).json({success: false, message: "Not Authorized"})
        }
}

export default authSeller;