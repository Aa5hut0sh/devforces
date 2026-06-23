const jwt = require("jsonwebtoken");
const store = require("../store/users");
const { JWT_SECRET } = require("../config");

/**
 * Verify JWT from Authorization: Bearer <token>
 * Valid   → attach user to req.user, call next()
 * Invalid → 401 { message: "Unauthorized" }
 */


const authenticate = (req, res, next) => {
  // TODO: implement
  res.status(401).json({ message: "Unauthorized" });
};

module.exports = { authenticate };