const express = require("express");
const router = express.Router();
const {
  addUser,
  loginUser,
  dashboard,
  getRole,
  updateUser,
  deleteUser,
  getUsers,
} = require("../controller/userCtrl");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add-user", addUser);
router.post("/login-user", loginUser);
router.get("/dashboard", dashboard);
router.get("/get-role", authMiddleware, getRole);
router.put("/update-user/:id", updateUser);
router.delete("/delete-user/:id", deleteUser);
router.get("/get-users", authMiddleware, getUsers);

module.exports = router;
