"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/me", authMiddleware_1.authenticateToken, userController_1.getCurrentUser);
// Create a new user
router.post("/", userController_1.createUser);
// Login user
router.post("/login", userController_1.loginUser); // <-- Add this line
// Get all users
router.get("/", userController_1.getUsers);
// Get a user by email
router.get("/:email", userController_1.getUserByEmail);
router.put("/role/:userId", userController_1.updateUserRole);
// Delete a user by email
router.delete("/:email", userController_1.deleteUser);
router.post("/:userId/change-password", userController_1.changePassword);
exports.default = router;
