const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

// Bootstrap: create first admin when there are none (no auth)
router.post("/bootstrap", adminController.bootstrap);

// All other routes require auth + admin
router.use(auth);
router.use(requireAdmin);

// Admin email management
router.get("/admins", adminController.listAdmins);
router.post("/admins", adminController.addAdmin);
router.delete("/admins/:email", adminController.removeAdmin);

// User management
router.get("/stats", adminController.getStats);
router.get("/users", adminController.listUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
router.post("/users/:id/grant-admin", adminController.grantAdminToUser);
router.delete("/users/:id/revoke-admin", adminController.revokeAdminFromUser);
router.post("/users/:id/achievements", adminController.grantAchievement);
router.delete(
  "/users/:id/achievements/:achievementId",
  adminController.revokeAchievement,
);

module.exports = router;
