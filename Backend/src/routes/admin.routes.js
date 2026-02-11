const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");

// Protect all admin routes
router.use(authMiddleware);
router.use(roleMiddleware("ADMIN"));

/* Dashboard */
router.get("/dashboard-stats", adminController.getDashboardStats);
router.get("/available-caretakers", adminController.getTodayAvailableCaretakers);
router.get("/activities", adminController.getRecentActivities);

/* Care Requests */
router.get("/care-requests", adminController.getAllCareRequests);
router.get("/care-requests/:id", adminController.getCareRequestById);
router.post("/assign-caretaker", adminController.assignCaretaker);

/* User Management */
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/status", adminController.updateUserStatus);

module.exports = router;
