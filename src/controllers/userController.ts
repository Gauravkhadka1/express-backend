import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

/**
 * Create a new user (Signup)
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, profilePictureUrl, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        profilePictureUrl: profilePictureUrl || "default.jpg",
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: `Error creating user: ${error.message}` });
  }
};

/**
 * Login user
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { userId: true, email: true, password: true, username: true, profilePictureUrl: true, role: true },
    });
    

    if (!user || !user.password) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate JWT Token
    const token = jwt.sign({ userId: user.userId }, process.env.JWT_SECRET as string, { expiresIn: "7d" });

    res.json({ 
      message: "Login successful", 
      token, 
      user: { id: user.userId, email: user.email, username: user.username, role:user.role } 
    });
    
  } catch (error: any) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: `Error logging in: ${error.message}` });
  }
};

/**
 * Get all users
 */
export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { userId: true, username: true, email: true, profilePictureUrl: true, role:true },
    });
    res.json(users);
  } catch (error: any) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ message: `Error retrieving users: ${error.message}` });
  }
};

/**
 * Get a user by email
 */
export const getUserByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { userId: true, username: true, email: true, profilePictureUrl: true, role: true },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ message: `Error retrieving user: ${error.message}` });
  }
};

/**
 * Delete a user by email
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    const deletedUser = await prisma.user.delete({
      where: { email },
    });

    res.json({ message: "User deleted successfully", user: deletedUser });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: `Error deleting user: ${error.message}` });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
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
    const updatedUser = await prisma.user.update({
      where: { userId: Number(userId) }, 
      data: { role },
    });

    res.json({ message: "User role updated successfully", user: updatedUser });
  } catch (error: any) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: `Error updating user role: ${error.message}` });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "Current password and new password are required" });
      return;
    }

    // Find the user
    const user = await prisma.user.findUnique({
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
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { userId: Number(userId) },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error: any) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: `Error changing password: ${error.message}` });
  }
};


export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // The userId is set by the auth middleware
    const userId = (req as any).userId;
    
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
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
  } catch (error: any) {
    console.error("Error retrieving current user:", error);
    res.status(500).json({ message: `Error retrieving current user: ${error.message}` });
  }
};