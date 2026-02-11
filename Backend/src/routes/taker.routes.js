// src/routes/seeker.routes.js
const express = require('express');
const router = express.Router();

const takerController = require('../controllers/taker.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Protect all routes for logged-in seeker only
router.use(authMiddleware);                  // JWT token verification
router.use(roleMiddleware('CARE_TAKER'));   // Role check for CARE_SEEKER

// Dashboard
router.get('/dashboard', takerController.getDashboardStats);

// Assignments
router.get('/assignments', takerController.getAssignments);
router.get("/assignments/today", authMiddleware, takerController.getTodaySchedule);
router.get('/assignments/:id', takerController.getAssignmentById);
router.post('/assignments/:id/respond', takerController.respondToAssignment);
router.put('/assignments/:id/status', takerController.updateAssignmentStatus);

// Availability
router.post('/availability', takerController.setAvailability);
router.get('/availability', takerController.getAvailability);

// Profile
router.get('/profile', takerController.getProfile);
router.put('/profile', takerController.updateProfile);

// Payments & Earnings
router.post('/payment-reminder/:careRequestId', takerController.sendPaymentReminder);
router.get('/earnings/month', takerController.getMonthlyEarnings);

module.exports = router;
