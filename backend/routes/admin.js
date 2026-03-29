const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

// Everything below requires a valid JWT and User.role === "admin".
router.use(auth);
router.use(requireAdmin);

// Admin roster by email: list, promote existing user (body { email }), revoke (:email URL-encoded).
router.get("/admins", adminController.listAdmins);
router.post("/admins", adminController.addAdmin);
router.delete("/admins/:email", adminController.removeAdmin);

// Dashboard stats and full user CRUD.
router.get("/stats", adminController.getStats);
router.get("/users", adminController.listUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
router.post("/users/:id/grant-admin", adminController.grantAdminToUser);
router.delete("/users/:id/revoke-admin", adminController.revokeAdminFromUser);

// AI helpers for module content (admin-only).
router.post("/modules/generate-steps", adminController.generateModuleSteps);
router.post("/modules/generate-curriculum", adminController.generateModuleCurriculum);

module.exports = router;
