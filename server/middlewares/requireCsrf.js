const requireCsrf = (req, res, next) => {
    const csrfCookie = req.cookies?.csrfToken;
    const csrfHeader = req.get('x-csrf-token');

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return res.status(403).json({success: false, message: "CSRF validation failed"});
    }

    next();
};

export default requireCsrf;
