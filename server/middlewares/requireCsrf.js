export const requireUserCsrf = (req, res, next) => {
  const csrfHeader = req.get('x-csrf-token');
  if (!csrfHeader || csrfHeader !== req.cookies?.userCsrfToken) {
    return res.status(403).json({ success: false, message: "CSRF validation failed" });
  }
  next();
};

export const requireSellerCsrf = (req, res, next) => {
  const csrfHeader = req.get('x-csrf-token');
  if (!csrfHeader || csrfHeader !== req.cookies?.sellerCsrfToken) {
    return res.status(403).json({ success: false, message: "CSRF validation failed" });
  }
  next();
};
