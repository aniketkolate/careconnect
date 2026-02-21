const seekerService = require('../services/seeker.service');
const { successResponse, errorResponse } = require('../utils/response');

const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await seekerService.getDashboardStats(req.user.id);
        return successResponse(res, stats);
    } catch (err) {
        next(err);
    }
};

const createCareRequest = async (req, res, next) => {
    try {
        console.log(req.body);
        const data = await seekerService.createCareRequest(req.user.id, req.body);
        return successResponse(res, 'Care request created successfully', data);
    } catch (err) {
        next(err);
    }
};

const getAllCareRequests = async (req, res, next) => {
    console.log("req :", req.user)
    try {
        const data = await seekerService.getAllCareRequests(req.user.id, req.query);
        return successResponse(res, 'Care requests fetched successfully', data);
    } catch (err) {
        next(err);
    }
};


const getCareRequestById = async (req, res, next) => {
    try {
        const data = await seekerService.getCareRequestById(req.user.id, req.params.id);
        return successResponse(res, data);
    } catch (err) {
        next(err);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const data = await seekerService.updateProfile(req.user.id, req.body);
        return successResponse(res, data, 'Profile updated successfully');
    } catch (err) {
        next(err);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const data = await seekerService.getProfile(req.user.id);
        return successResponse(res, "Profile details fetched successfully", data);
    } catch (err) {
        next(err);
    }
};

const completeProfile = async (req, res, next) => {
    try {
        const data = await seekerService.completeProfile(req.user.id, req.body);
        return successResponse(res, data, 'Profile completed successfully');
    } catch (err) {
        next(err);
    }
};

const getRecentRequests = async (req, res, next) => {
    try {
        const data = await seekerService.getRecentRequests(req.user.id);
        return successResponse(res, "Recent requesst load successfully.", data);
    } catch (err) {
        next(err);
    }
};

const getAssignedCaretakers = async (req, res, next) => {
    try {
        const data = await seekerService.getAssignedCaretakers(req.user.id);
        return successResponse(res, "Details fetched successfully.", data);
    } catch (err) {
        next(err);
    }
};

const makePayment = async (req, res, next) => {
    try {
        const data = await seekerService.makePayment(req.user.id, req.params.careRequestId, req.body);
        return successResponse(res, data, 'Payment successful');
    } catch (err) {
        next(err);
    }
};

const deleteCareRequest = async (req, res, next) => {
    try {
        const data = await seekerService.deleteCareRequest(
            req.user.id,
            req.params.id
        );
        return successResponse(res, 'Care request deleted successfully', data);
    } catch (err) {
        next(err);
    }
};

const getCompletedRequests = async (req, res) => {
    try {
        const data = await seekerService.getCompletedRequestsWithPayment(req.user.id);
        res.json({
            success: true,
            message: 'Completed requests fetched',
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getPaymentPopup = async (req, res) => {
    try {
        const data = await seekerService.getPaymentDetails(req.params.requestId);
        res.json({
            success: true,
            data
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getNotifications = async (req, res, next) => {
    try {
        const data = await seekerService.getNotifications(req.user.id);
        return successResponse(res, "Notifications fetched successfully", data);
    } catch (err) {
        next(err);
    }
};


module.exports = {
    getDashboardStats,
    createCareRequest,
    getAllCareRequests,
    getCareRequestById,
    updateProfile,
    getProfile,
    completeProfile,
    getRecentRequests,
    getAssignedCaretakers,
    makePayment,
    deleteCareRequest,
    getCompletedRequests,
    getPaymentPopup,
    getNotifications
};
