import express from "express";
import { createUser, loginUser, getUsers, getUserByEmail, deleteUser, updateUserRole, changePassword, getCurrentUser,  } from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/me", authenticateToken, getCurrentUser);

// Create a new user
router.post("/", createUser);

// Login user
router.post("/login", loginUser);  // <-- Add this line

// Get all users
router.get("/", getUsers);



// Get a user by email
router.get("/:email", getUserByEmail);

router.put("/role/:userId", updateUserRole);

// Delete a user by email
router.delete("/:email", deleteUser);

router.post("/:userId/change-password", changePassword);

export default router;

