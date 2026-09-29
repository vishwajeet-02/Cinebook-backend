import User from "../models/User.js";

// ========================================
// GET ALL USERS (admin)
// ========================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({
      createdAt: -1
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ========================================
// TOGGLE USER STATUS (admin) -- block/unblock a user
// ========================================
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? "unblocked" : "blocked"} successfully`,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};