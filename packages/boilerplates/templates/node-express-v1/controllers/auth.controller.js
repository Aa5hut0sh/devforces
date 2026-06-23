const store = require("../store/users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config");

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * 201 → { user: { id, name, email }, token }
 * 409 → { message: "Email already in use" }
 */


const register = async (req, res) => {
  // TODO: implement
  res.sendStatus(501);
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 * 200 → { user: { id, name, email }, token }
 * 401 → { message: "Invalid credentials" }
 */


const login = async (req, res) => {
  // TODO: implement
  res.sendStatus(501);
};

module.exports = { register, login };