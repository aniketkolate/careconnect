const takerService = require('../services/taker.service');
const { successResponse } = require('../utils/response');

const getDashboardStats = async (req, res, next) => {
  try {
    const data = await takerService.getDashboardStats(req.user.id);
    return successResponse(res, "Details fetched sucessfully", data);
  } catch (err) {
    next(err);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const data = await takerService.getAssignments(req.user.id, req.query);
    return successResponse(res, "Details fetched successfully", data);
  } catch (err) {
    next(err);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const data = await takerService.getAssignmentById(req.user.id, req.params.id);
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};


const respondToAssignment = async (req, res, next) => {
  try {
    const takerId = req.user?.id;
    const assignmentId = Number(req.params.id);
    const { action } = req.body;

    if (!takerId) {
      throw { status: 401, message: 'Unauthorized user' };
    }

    if (!assignmentId) {
      throw { status: 400, message: 'Assignment ID is required' };
    }

    if (!action) {
      throw { status: 400, message: 'Action is required' };
    }

    const data = await takerService.respondToAssignment(
      takerId,
      assignmentId,
      { action }
    );

    return successResponse(res, data, 'Response recorded successfully');
  } catch (err) {
    next(err);
  }
};



const updateAssignmentStatus = async (req, res, next) => {
  try {
    const data = await takerService.updateAssignmentStatus(
      req.user.id,
      req.params.id,
      req.body
    );
    return successResponse(res, 'Assignment updated successfully', data);
  } catch (err) {
    next(err);
  }
};

const setAvailability = async (req, res, next) => {
  try {
    const data = await takerService.setAvailability(req.user.id, req.body);
    return successResponse(res,'Availability updated', data );
  } catch (err) {
    next(err);
  }
};

const getAvailability = async (req, res, next) => {
  try {
    const data = await takerService.getAvailability(req.user.id);
    return successResponse(res,"Availability fetch successfully", data);
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const data = await takerService.getProfile(req.user.id);
    return successResponse(res, "Profile details fetched successfully.",data);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await takerService.updateProfile(req.user.id, req.body);
    return successResponse(res, data, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

const sendPaymentReminder = async (req, res, next) => {
  try {
    const data = await takerService.sendPaymentReminder(
      req.user.id,
      req.params.careRequestId
    );
    return successResponse(res, data, 'Payment reminder sent');
  } catch (err) {
    next(err);
  }
};

const getMonthlyEarnings = async (req, res, next) => {
  try {
    const data = await takerService.getMonthlyEarnings(req.user.id);
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};



const getTodaySchedule = async (req, res, next) => {
  try {
    const caretakerId = req.user.id;

    const data = await takerService.getTodaySchedule(caretakerId);

    return res.status(200).json({
      success: true,
      message: data.length
        ? "Today's care schedule fetched successfully"
        : "No care schedule for today",
      data
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getDashboardStats,
  getAssignments,
  getAssignmentById,
  respondToAssignment,
  updateAssignmentStatus,
  setAvailability,
  getAvailability,
  getProfile,
  updateProfile,
  sendPaymentReminder,
  getMonthlyEarnings,
  getTodaySchedule
};
