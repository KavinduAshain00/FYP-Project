const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");
const modulesController = require("../controllers/modulesController");

router.use(auth);
router.use(requireAdmin);

/**
 * GET /api/admin/admins - List admin emails
 */
router.get("/admins", adminController.listAdmins);

/**
 * POST /api/admin/admins - Promote user by email
 */
router.post("/admins", adminController.addAdmin);

/**
 * DELETE /api/admin/admins/:email - Demote admin (encoded email)
 */
router.delete("/admins/:email", adminController.removeAdmin);

/**
 * GET /api/admin/stats - Platform aggregates
 */
router.get("/stats", adminController.getStats);

/**
 * GET /api/admin/users - Paginated user list
 */
router.get("/users", adminController.listUsers);

/**
 * POST /api/admin/users/:id/achievements - Grant badge
 */
router.post("/users/:id/achievements", adminController.grantUserAchievement);

/**
 * DELETE /api/admin/users/:id/achievements/:achievementId - Revoke badge
 */
router.delete(
  "/users/:id/achievements/:achievementId",
  adminController.revokeUserAchievement,
);

/**
 * POST /api/admin/users/:id/grant-admin - Promote by user id
 */
router.post("/users/:id/grant-admin", adminController.grantAdminToUser);

/**
 * DELETE /api/admin/users/:id/revoke-admin - Demote by user id
 */
router.delete("/users/:id/revoke-admin", adminController.revokeAdminFromUser);

/**
 * GET /api/admin/users/:id - One user
 */
router.get("/users/:id", adminController.getUserById);

/**
 * PUT /api/admin/users/:id - Update allowed fields
 */
router.put("/users/:id", adminController.updateUser);

/**
 * DELETE /api/admin/users/:id - Delete user
 */
router.delete("/users/:id", adminController.deleteUser);

/**
 * POST /api/admin/modules/generate-steps - AI step JSON
 */
router.post("/modules/generate-steps", adminController.generateModuleSteps);

/**
 * POST /api/admin/modules/generate-curriculum - AI hints/starter code
 */
router.post(
  "/modules/generate-curriculum",
  adminController.generateModuleCurriculum,
);

/**
 * GET /api/admin/modules - List (same handler as learner catalog)
 */
router.get("/modules", modulesController.getAll);

/**
 * POST /api/admin/modules - Create module
 */
router.post("/modules", modulesController.create);

/**
 * GET /api/admin/modules/:id - One module (admin bypasses path lock)
 */
router.get("/modules/:id", modulesController.getById);

/**
 * PUT /api/admin/modules/:id - Update module
 */
router.put("/modules/:id", modulesController.update);

/**
 * DELETE /api/admin/modules/:id - Delete module
 */
router.delete("/modules/:id", modulesController.remove);

module.exports = router;
