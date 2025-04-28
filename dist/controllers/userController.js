"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.changePassword = exports.updateUserRole = exports.deleteUser = exports.getUserByEmail = exports.getUsers = exports.loginUser = exports.createUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
/**
 * Create a new user (Signup)
 */
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, profilePictureUrl, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }
        // Hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma.user.create({
            data: {
                username,
                email,
                profilePictureUrl: profilePictureUrl || "default.jpg",
                password: hashedPassword,
            },
        });
        res.status(201).json({ message: "User created successfully", user: newUser });
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: `Error creating user: ${error.message}` });
    }
});
exports.createUser = createUser;
/**
 * Login user
 */
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }
        // Check if user exists
        const user = yield prisma.user.findUnique({
            where: { email },
            select: { userId: true, email: true, password: true, username: true, profilePictureUrl: true, role: true },
        });
        if (!user || !user.password) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Compare passwords
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Generate JWT Token
        const token = jsonwebtoken_1.default.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({
            message: "Login successful",
            token,
            user: { id: user.userId, email: user.email, username: user.username, role: user.role }
        });
    }
    catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: `Error logging in: ${error.message}` });
    }
});
exports.loginUser = loginUser;
/**
 * Get all users
 */
const getUsers = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            select: { userId: true, username: true, email: true, profilePictureUrl: true, role: true },
        });
        res.json(users);
    }
    catch (error) {
        console.error("Error retrieving users:", error);
        res.status(500).json({ message: `Error retrieving users: ${error.message}` });
    }
});
exports.getUsers = getUsers;
/**
 * Get a user by email
 */
const getUserByEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const user = yield prisma.user.findUnique({
            where: { email },
            select: { userId: true, username: true, email: true, profilePictureUrl: true, role: true },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error retrieving user:", error);
        res.status(500).json({ message: `Error retrieving user: ${error.message}` });
    }
});
exports.getUserByEmail = getUserByEmail;
/**
 * Delete a user by email
 */
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const deletedUser = yield prisma.user.delete({
            where: { email },
        });
        res.json({ message: "User deleted successfully", user: deletedUser });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: `Error deleting user: ${error.message}` });
    }
});
exports.deleteUser = deleteUser;
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        // Validate role input
        const validRoles = ["ADMIN", "MANAGER", "INTERN"];
        if (!validRoles.includes(role)) {
            res.status(400).json({ message: "Invalid role selected" });
            return;
        }
        // Update the user's role in the database
        const updatedUser = yield prisma.user.update({
            where: { userId: Number(userId) },
            data: { role },
        });
        res.json({ message: "User role updated successfully", user: updatedUser });
    }
    catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: `Error updating user role: ${error.message}` });
    }
});
exports.updateUserRole = updateUserRole;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: "Current password and new password are required" });
            return;
        }
        // Find the user
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Ensure the user has a password
        if (!user.password) {
            res.status(401).json({ message: "User does not have a password set" });
            return;
        }
        // Verify the current password
        const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Current password is incorrect" });
            return;
        }
        // Hash the new password
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        // Update the user's password
        yield prisma.user.update({
            where: { userId: Number(userId) },
            data: { password: hashedPassword },
        });
        res.status(200).json({ message: "Password changed successfully" });
    }
    catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: `Error changing password: ${error.message}` });
    }
});
exports.changePassword = changePassword;
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // The userId is set by the auth middleware
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: {
                userId: true,
                username: true,
                email: true,
                profilePictureUrl: true,
                role: true
            },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error retrieving current user:", error);
        res.status(500).json({ message: `Error retrieving current user: ${error.message}` });
    }
});
exports.getCurrentUser = getCurrentUser;
