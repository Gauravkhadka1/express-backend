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
exports.deleteProspect = exports.updateProspect = exports.updateProspectStatus = exports.createProspect = exports.getProspects = void 0;
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const date_fns_tz_1 = require("date-fns-tz");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prospectDeletedEmailTemplate_1 = require("../templates/prospectDeletedEmailTemplate");
const prisma = new client_1.PrismaClient();
const transporter = nodemailer_1.default.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: "gauravkhadka111111@gmail.com",
        pass: "catgfxsmwkqrdknh", // Use environment variables for sensitive data
    },
});
function sendMail(to, sub, msg, cc) {
    const mailOptions = {
        to: to,
        subject: sub,
        html: msg,
        cc: cc,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        }
        else {
            console.log("Email Sent:", info.response);
        }
    });
}
const decodeToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '045ffc1dc9a74ea1812af89ec2f03c531a56b144b984ce3f0413ab0e6202e7c6');
        return decoded;
    }
    catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};
// Get all prospects
const getProspects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prospects = yield prisma.prospects.findMany({
            orderBy: {
                inquiryDate: 'desc', // Sort by inquiryDate in descending order (latest first)
            },
        });
        res.json(prospects);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving prospects: ${error.message}` });
    }
});
exports.getProspects = getProspects;
// Create a new prospect
const createProspect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, status = "New", category, inquiryDate } = req.body;
    // Validate required fields
    if (!name || !category) {
        res.status(400).json({ message: "Name and category are required fields." });
        return;
    }
    try {
        const newProspect = yield prisma.prospects.create({
            data: {
                name,
                status, // Defaults to "New" if not provided
                category,
                inquiryDate: inquiryDate ? new Date(inquiryDate) : null,
            },
        });
        res.status(201).json(newProspect);
    }
    catch (error) {
        res.status(500).json({ message: `Error creating a prospect: ${error.message}` });
    }
});
exports.createProspect = createProspect;
// Update prospect status
const updateProspectStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prospectId } = req.params;
    const { status, updatedBy } = req.body;
    try {
        const existingProspect = yield prisma.prospects.findUnique({
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
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: Number(updatedBy) }, // Ensure `updatedBy` is a number
        });
        if (!updatingUser) {
            res.status(400).json({ message: "Invalid user updating the prospect" });
            return;
        }
        const updatedProspect = yield prisma.prospects.update({
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
    }
    catch (error) {
        res.status(500).json({ message: `Error updating prospect status: ${error.message}` });
    }
});
exports.updateProspectStatus = updateProspectStatus;
// Edit a prospect
const updateProspect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { prospectId } = req.params;
    const { name, status, category, inquiryDate, updatedBy } = req.body;
    try {
        const existingProspect = yield prisma.prospects.findUnique({
            where: { id: Number(prospectId) },
        });
        if (!existingProspect) {
            res.status(404).json({ message: "Prospect not found" });
            return;
        }
        const updatedProspect = yield prisma.prospects.update({
            where: { id: Number(prospectId) },
            data: {
                name,
                status,
                category,
                inquiryDate: inquiryDate ? new Date(inquiryDate) : null,
            },
        });
        // Send email notification on prospect edit
        const updatingUser = yield prisma.user.findUnique({
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
          <li>Inquiry Date: ${updatedProspect.inquiryDate ? (0, date_fns_tz_1.format)(new Date(updatedProspect.inquiryDate), 'MMM d, yyyy h:mm a') : 'N/A'}</li>
        </ul>
      `;
            sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
        }
        res.json(updatedProspect);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating prospect: ${error.message}` });
    }
});
exports.updateProspect = updateProspect;
// Delete a prospect
const deleteProspect = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { prospectId } = req.params;
    try {
        const prospectToDelete = yield prisma.prospects.findUnique({
            where: { id: Number(prospectId) }, // Ensure `prospectId` is a number
        });
        if (!prospectToDelete) {
            res.status(404).json({ message: "Prospect not found" });
            return;
        }
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }
        const decodedToken = decodeToken(token);
        if (!decodedToken || !decodedToken.userId) {
            res.status(401).json({ message: "Unauthorized: Invalid token" });
            return;
        }
        const deletingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!deletingUser) {
            res.status(400).json({ message: "Invalid user deleting the prospect" });
            return;
        }
        yield prisma.prospects.delete({
            where: { id: Number(prospectId) },
        });
        // Send email to gaurav@webtech.com.np
        const gauravEmailSubject = `Prospect Deleted: ${prospectToDelete.name}`;
        const gauravEmailMessage = (0, prospectDeletedEmailTemplate_1.prospectDeletedEmailTemplate)(deletingUser.username || "Unknown User", // Fallback value if username is null
        prospectToDelete.name);
        sendMail("gaurav@webtech.com.np", gauravEmailSubject, gauravEmailMessage);
        res.status(200).json({ message: "Prospect successfully deleted" });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting prospect: ${error.message}` });
    }
});
exports.deleteProspect = deleteProspect;
