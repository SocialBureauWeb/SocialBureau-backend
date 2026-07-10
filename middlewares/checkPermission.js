const User = require("../models/userModel");

/**
 * Permission-based access middleware.
 * Must be used AFTER userAuthentication middleware.
 * Admin role bypasses all permission checks.
 *
 * @param {string|string[]} permission - Required permission(s)
 *   e.g., 'billing.view' or ['billing.view', 'billing.manage']
 *   If an array is passed, the user needs at least ONE of them.
 */
const checkPermission = (permission) => async (req, res, next) => {
  try {
    const { id, role } = req.user;

    // Admin always bypasses permission checks
    if (role === "admin") return next();

    const user = await User.findById(id).select("permissions role").lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userPermissions = user.permissions || [];
    const required = Array.isArray(permission) ? permission : [permission];

    const hasPermission = required.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        message: `Access denied. Required permission: ${required.join(" or ")}`,
      });
    }

    next();
  } catch (err) {
    console.error("❌ [PERMISSION] Middleware error:", err.message);
    return res.status(500).json({ message: "Permission check failed" });
  }
};

module.exports = checkPermission;
