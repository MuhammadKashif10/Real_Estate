const User = require('../models/User');
const Property = require('../models/Property');
const bcrypt = require('bcryptjs');
const { successResponse, errorResponse, paginationMeta } = require('../utils/responseFormatter');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalProperties, pendingProperties, activeAgents] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'agent', isActive: true })
    ]);

    const stats = {
      totalUsers,
      totalProperties,
      pendingProperties,
      activeAgents
    };

    res.json(
      successResponse(stats, 'Dashboard stats retrieved successfully')
    );
  } catch (error) {
    res.status(500).json(
      errorResponse('Server error retrieving dashboard stats', 500)
    );
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.query.role;

    let query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json(
      successResponse(
        users,
        'Users retrieved successfully',
        200,
        paginationMeta(page, limit, total)
      )
    );
  } catch (error) {
    res.status(500).json(
      errorResponse('Server error retrieving users', 500)
    );
  }
};

// @desc    Change admin password
// @route   POST /api/admin/change-password
// @access  Private (Admin only)
const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    // Validate request body
    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        errorResponse('Current password and new password are required', 400)
      );
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json(
        errorResponse('New password must be at least 8 characters long', 400)
      );
    }

    // Get admin user with password field
    const admin = await User.findById(adminId).select('+password');
    if (!admin) {
      return res.status(404).json(
        errorResponse('Admin user not found', 404)
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json(
        errorResponse('Current password is incorrect', 401)
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await User.findByIdAndUpdate(adminId, {
      password: hashedNewPassword
    });

    res.json(
      successResponse(
        { message: 'Password changed successfully' },
        'Password updated successfully'
      )
    );
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json(
      errorResponse('Server error while changing password', 500)
    );
  }
};

// @desc    Toggle user suspension status
// @route   PATCH /api/admin/users/:id/suspend
// @access  Private (Admin only)
const toggleUserSuspension = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    // Toggle the isActive status
    user.isActive = !user.isActive;
    await user.save();

    res.json(
      successResponse(
        { user: { id: user._id, isActive: user.isActive } },
        `User ${user.isActive ? 'activated' : 'suspended'} successfully`
      )
    );
  } catch (error) {
    console.error('Error toggling user suspension:', error);
    res.status(500).json(
      errorResponse('Server error while updating user status', 500)
    );
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json(
        errorResponse('User not found', 404)
      );
    }

    // Soft delete by setting isDeleted flag
    user.isDeleted = true;
    await user.save();

    res.json(
      successResponse(
        { message: 'User deleted successfully' },
        'User deleted successfully'
      )
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json(
      errorResponse('Server error while deleting user', 500)
    );
  }
};

// @desc    Reset property assignments
// @route   POST /api/admin/assignments/reset
// @access  Private (Admin only)
const resetAssignments = async (req, res) => {
  try {
    // Reset all property assignments by removing assigned agents
    const result = await Property.updateMany(
      { assignedAgent: { $exists: true } },
      { $unset: { assignedAgent: 1 } }
    );

    res.json(
      successResponse(
        { 
          message: 'Property assignments reset successfully',
          modifiedCount: result.modifiedCount 
        },
        'Assignments reset successfully'
      )
    );
  } catch (error) {
    console.error('Error resetting assignments:', error);
    res.status(500).json(
      errorResponse('Server error while resetting assignments', 500)
    );
  }
};

// @desc    Get terms acceptance logs
// @route   GET /api/admin/terms-logs
// @access  Private (Admin only)
const getTermsLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // This would require a TermsAcceptance model - for now return empty array
    const logs = [];
    const total = 0;

    res.json(
      successResponse(
        logs,
        'Terms logs retrieved successfully',
        200,
        paginationMeta(page, limit, total)
      )
    );
  } catch (error) {
    console.error('Error getting terms logs:', error);
    res.status(500).json(
      errorResponse('Server error while retrieving terms logs', 500)
    );
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  changeAdminPassword,
  toggleUserSuspension,
  deleteUser,
  resetAssignments,
  getTermsLogs
};