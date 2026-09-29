const adminAuth = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required"
      });
    }

    next();

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

export default adminAuth;