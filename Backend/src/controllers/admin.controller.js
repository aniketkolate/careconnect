const adminService = require("../services/admin.service");
const { successResponse } = require("../utils/response");

/* ================= DASHBOARD ================= */

exports.getDashboardStats = async (req, res, next) => {
    try {
        const data = await adminService.getDashboardStats();
        return successResponse(res, "Dashboard stats fetched", data);
    } catch (err) {
        next(err);
    }
};

exports.getTodayAvailableCaretakers = async (req, res, next) => {
    try {
        const data = await adminService.getTodayAvailableCaretakers();
        return successResponse(res, "Available caretakers fetched", data);
    } catch (err) {
        next(err);
    }
};

exports.getRecentActivities = async (req, res, next) => {
    try {
        const activities = await adminService.getRecentActivities();
        return successResponse(res, "Activities fetched", activities);
    } catch (err) {
        next(err);
    }
};

/* ================= CARE REQUESTS ================= */

exports.getAllCareRequests = async (req, res, next) => {
    try {
        const { status } = req.query;
        const data = await adminService.getAllCareRequests(status);
        return successResponse(res, "Care requests fetched", data);
    } catch (err) {
        next(err);
    }
};

exports.getCareRequestById = async (req, res, next) => {
    try {
        const request = await adminService.getCareRequestById(req.params.id);
        return successResponse(res, "Care request fetched", request);
    } catch (err) {
        next(err);
    }
};

exports.assignCaretaker = async (req, res, next) => {
    try {
        const { requestId, caretakerId } = req.body;
        const result = await adminService.assignCaretaker(requestId, caretakerId, req.user.id);
        return successResponse(res, "Caretaker assigned successfully", result);
    } catch (err) {
        next(err);
    }
};

/* ================= USER MANAGEMENT ================= */

exports.getAllUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        const users = await adminService.getAllUsers(role);
        return successResponse(res, "Users fetched", users);
    } catch (err) {
        next(err);
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;

        const user = await adminService.getUserById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

exports.updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const userId = req.params.id;

        const updated = await adminService.updateUserStatus(userId, status);
        return successResponse(res, "User status updated", updated);
    } catch (err) {
        next(err);
    }
};
