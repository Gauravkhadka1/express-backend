import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { format } from 'date-fns-tz';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prospectDeletedEmailTemplate } from "../templates/prospectDeletedEmailTemplate";

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "gauravkhadka111111@gmail.com",
    pass: "catgfxsmwkqrdknh", // Use environment variables for sensitive data
  },
});

function sendMail(to: string, sub: string, msg: string, cc?: string) {
  const mailOptions = {
    to: to,
    subject: sub,
    html: msg,
    cc: cc,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email Sent:", info.response);
    }
  });
}

interface DecodedToken extends JwtPayload {
  userId: number; // Add other properties if needed
}

const decodeToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '045ffc1dc9a74ea1812af89ec2f03c531a56b144b984ce3f0413ab0e6202e7c6') as DecodedToken;
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Get all prospects
export const getProspects = async (req: Request, res: Response): Promise<void> => {
  try {
    const prospects = await prisma.prospects.findMany({
      orderBy: {
        inquiryDate: 'desc', // Sort by inquiryDate in descending order (latest first)
      },
    });
    res.json(prospects);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving prospects: ${error.message}` });
  }
};

// Create a new prospect
export const createProspect = async (req: Request, res: Response): Promise<void> => {
  const { name, status = "New", category, inquiryDate } = req.body;

  // Validate required fields
  if (!name || !category) {
    res.status(400).json({ message: "Name and category are required fields." });
    return;
  }

  try {
    const newProspect = await prisma.prospects.create({
      data: {
        name,
        status, // Defaults to "New" if not provided
        category,
        inquiryDate: inquiryDate ? new Date(inquiryDate) : null,
      },
    });

    res.status(201).json(newProspect);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating a prospect: ${error.message}` });
  }
};

// Update prospect status
export const updateProspectStatus = async (req: Request, res: Response): Promise<void> => {
  const { prospectId } = req.params;
  const { status, updatedBy } = req.body;

  try {
    const existingProspect = await prisma.prospects.findUnique({
      where: { id: Number(prospectId) },
    });

    if (!existingProspect) {
      res.status(404).json({ message: "Prospect not found" });
      return;
    }

    const previousStatus = existingProspect.status;
    const prospectName = existingProspect.name;

    // Ensure `updatedBy` is provided and valid
    if (!updatedBy) {
      res.status(400).json({ message: "Invalid user updating the prospect" });
      return;
    }

    const updatingUser = await prisma.user.findUnique({
      where: { userId: Number(updatedBy) }, // Ensure `updatedBy` is a number
    });

    if (!updatingUser) {
      res.status(400).json({ message: "Invalid user updating the prospect" });
      return;
    }

    const updatedProspect = await prisma.prospects.update({
      where: { id: Number(prospectId) },
      data: { status },
    });

    const emailSubject = `Prospect Status Updated: ${prospectName}`;
    const emailMessage = `
      <p><strong>${updatingUser.username}</strong> updated the prospect <strong>${prospectName}</strong>.</p>
      <p>Status changed from <strong>${previousStatus}</strong> to <strong>${status}</strong>.</p>
    `;

    sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);

    res.json(updatedProspect);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating prospect status: ${error.message}` });
  }
};

// Edit a prospect
export const updateProspect = async (req: Request, res: Response): Promise<void> => {
  const { prospectId } = req.params;
  const { name, status, category, inquiryDate, updatedBy } = req.body;

  try {
    const existingProspect = await prisma.prospects.findUnique({
      where: { id: Number(prospectId) },
    });

    if (!existingProspect) {
      res.status(404).json({ message: "Prospect not found" });
      return;
    }

    const updatedProspect = await prisma.prospects.update({
      where: { id: Number(prospectId) },
      data: {
        name,
        status,
        category,
        inquiryDate: inquiryDate ? new Date(inquiryDate) : null,
      },
    });

    // Send email notification on prospect edit
    const updatingUser = await prisma.user.findUnique({
      where: { userId: Number(updatedBy) },
    });

    if (updatingUser) {
      const emailSubject = `Prospect Updated: ${updatedProspect.name}`;
      const emailMessage = `
        <p><strong>${updatingUser.username}</strong> updated the prospect <strong>${updatedProspect.name}</strong>.</p>
        <p>Details:</p>
        <ul>
          <li>Name: ${updatedProspect.name}</li>
          <li>Status: ${updatedProspect.status}</li>
          <li>Category: ${updatedProspect.category}</li>
          <li>Inquiry Date: ${updatedProspect.inquiryDate ? format(new Date(updatedProspect.inquiryDate), 'MMM d, yyyy h:mm a') : 'N/A'}</li>
        </ul>
      `;

      sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
    }

    res.json(updatedProspect);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating prospect: ${error.message}` });
  }
};
// Delete a prospect
export const deleteProspect = async (req: Request, res: Response): Promise<void> => {
  const { prospectId } = req.params;

  try {
    const prospectToDelete = await prisma.prospects.findUnique({
      where: { id: Number(prospectId) }, // Ensure `prospectId` is a number
    });

    if (!prospectToDelete) {
      res.status(404).json({ message: "Prospect not found" });
      return;
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    const decodedToken = decodeToken(token);
    if (!decodedToken || !decodedToken.userId) {
      res.status(401).json({ message: "Unauthorized: Invalid token" });
      return;
    }

    const deletingUser = await prisma.user.findUnique({
      where: { userId: decodedToken.userId },
    });

    if (!deletingUser) {
      res.status(400).json({ message: "Invalid user deleting the prospect" });
      return;
    }

    await prisma.prospects.delete({
      where: { id: Number(prospectId) },
    });

    // Send email to gaurav@webtech.com.np
    const gauravEmailSubject = `Prospect Deleted: ${prospectToDelete.name}`;
    const gauravEmailMessage = prospectDeletedEmailTemplate(
      deletingUser.username || "Unknown User", // Fallback value if username is null
      prospectToDelete.name
    );

    sendMail("gaurav@webtech.com.np", gauravEmailSubject, gauravEmailMessage);

    res.status(200).json({ message: "Prospect successfully deleted" });
  } catch (error: any) {
    res.status(500).json({ message: `Error deleting prospect: ${error.message}` });
  }
};
