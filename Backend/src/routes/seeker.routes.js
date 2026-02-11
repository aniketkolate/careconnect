// src/routes/seeker.routes.js
const express = require('express');
const router = express.Router();

const seekerController = require('../controllers/seeker.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Protect all routes for logged-in seeker only
router.use(authMiddleware);                  // JWT token verification
router.use(roleMiddleware('CARE_SEEKER'));   // Role check for CARE_SEEKER

/* ==========================
   DASHBOARD
========================== */

// Seeker dashboard stats
router.get('/dashboard', seekerController.getDashboardStats);

// Get last 5 requests
router.get('/recent-requests', seekerController.getRecentRequests);

// Get all assigned caretakers for this seeker
router.get('/assigned-caretakers', seekerController.getAssignedCaretakers);

/* ==========================
   CARE REQUESTS
========================== */

// Create new care request
router.post('/care-request', seekerController.createCareRequest);

// Get all care requests (with optional query filters)
router.get('/care-request', seekerController.getAllCareRequests);

// Get single care request by ID
router.get('/care-request/:id', seekerController.getCareRequestById);

/* ==========================
   PROFILE MANAGEMENT
========================== */

// Update seeker profile
router.put('/profile', seekerController.updateProfile);

// Get seeker profile
router.get('/profile', seekerController.getProfile);

// Complete seeker profile (if incomplete)
router.post('/profile/complete', seekerController.completeProfile);

/* ==========================
   PAYMENTS
========================== */

// Make payment to caretaker for a care request
router.post('/payment/:careRequestId', seekerController.makePayment);

router.delete('/care-request/:id', authMiddleware, seekerController.deleteCareRequest);

router.get('/care-requests/completed', authMiddleware, seekerController.getCompletedRequests);

router.get('/payments/request/:requestId', authMiddleware, seekerController.getPaymentPopup);

module.exports = router;
