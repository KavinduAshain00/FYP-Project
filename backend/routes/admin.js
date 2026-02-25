const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

// All routes require auth + admin
router.use(auth);
router.use(requireAdmin);

// Platform statistics
router.get("/stats", adminController.getStats);

// User management
router.get("/users", adminController.listUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
