const { Router } = require("express");
const { register, login } = require("../controllers/auth.controller");

const router = Router();

router.post("/register", register);
router.post("/login", login);

// TODO (Challenge 4):
// Add GET /profile — a protected route that returns the current user's profile.
// Use the authenticate middleware from ../middleware/auth.middleware
// 200 → { user: { id, name, email } }

module.exports = router;