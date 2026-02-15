const requireCsrf = (req, res, next) => {
    const csrfHeader = req.get('x-csrf-token');
    const userCsrf = req.cookies?.userCsrfToken;
    const sellerCsrf = req.cookies?.sellerCsrfToken;

    const valid = csrfHeader && (csrfHeader === userCsrf || csrfHeader === sellerCsrf);
    if (!valid) {
        return res.status(403).json({success: false, message: "CSRF validation failed"});
    }

    next();
};

export default requireCsrf;
