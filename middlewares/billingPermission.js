const User = require("../models/userModel");

/**
 * Check if user has specific billing permission
 * @param {string} permission - The permission to check (e.g., 'billing.view', 'billing.manage')
 */
const checkBillingPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await User.findById(req.user.id).select("permissions role");

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user has admin role (admins have all permissions)
      if (user.role === "admin") {
        return next();
      }

      // Check if user has specific permission
      if (!user.permissions || !user.permissions.includes(permission)) {
        return res.status(403).json({
          error: `Access denied. Required permission: ${permission}`,
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Error checking permissions" });
    }
  };
};

/**
 * Check if user is admin or has billing.manage permission
 */
const isBillingManager = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("permissions role");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.role === "admin" || user.permissions.includes("billing.manage")) {
      return next();
    }

    return res
      .status(403)
      .json({ error: "Access denied. You cannot manage payments." });
  } catch (error) {
    console.error("Permission check error:", error);
    res.status(500).json({ error: "Error checking permissions" });
  }
};

/**
 * Check if user can view billing or manage billing
 */
const canViewBilling = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("permissions role");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const hasPermission =
      user.role === "admin" ||
      user.permissions.includes("billing.view") ||
      user.permissions.includes("billing.manage");

    if (!hasPermission) {
      return res.status(403).json({ error: "Access denied." });
    }

    next();
  } catch (error) {
    console.error("Permission check error:", error);
    res.status(500).json({ error: "Error checking permissions" });
  }
};

module.exports = {
  checkBillingPermission,
  isBillingManager,
  canViewBilling,
};
