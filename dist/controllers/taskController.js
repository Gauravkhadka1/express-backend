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
exports.addCommentToTask = exports.getTaskComments = exports.deleteTask = exports.updateTask = exports.getTasksByUserIdForProfile = exports.getTasksByUserIdForUserTasks = exports.getTasksByUser = exports.updateTaskStatus = exports.createTask = exports.getTasks = void 0;
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const date_fns_tz_1 = require("date-fns-tz");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const emailTemplates_1 = require("../templates/emailTemplates");
const prisma = new client_1.PrismaClient();
const transporter = nodemailer_1.default.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: "gauravkhadka111111@gmail.com",
        pass: "catgfxsmwkqrdknh",
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
const getTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId, assignedTo } = req.query;
    try {
        const tasks = yield prisma.task.findMany({
            where: Object.assign(Object.assign({}, (projectId ? { projectId: Number(projectId) } : {})), (assignedTo ? { assignedTo: String(assignedTo) } : {})),
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasks = getTasks;
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, status, priority, startDate, dueDate, projectId, assignedTo, assignedBy, } = req.body;
    try {
        const newTask = yield prisma.task.create({
            data: {
                title,
                description,
                status,
                priority,
                startDate,
                dueDate,
                projectId,
                assignedTo,
                assignedBy,
            },
        });
        yield prisma.activityLog.create({
            data: {
                action: 'CREATE',
                details: null,
                userId: Number(assignedTo), // Or use the creator's ID if different
                taskId: newTask.id,
            },
        });
        const assignedUser = yield prisma.user.findUnique({
            where: { userId: Number(assignedTo) },
        });
        const assigningUser = yield prisma.user.findUnique({
            where: { email: assignedBy },
        });
        const project = yield prisma.project.findUnique({
            where: { id: Number(projectId) },
            select: { name: true },
        });
        const formatNepaliTime = (dateValue) => {
            if (!dateValue)
                return "N/A";
            return (0, date_fns_tz_1.format)(dateValue, "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
        };
        if (assignedUser && assignedUser.email && assigningUser && project) {
            const emailSubject = `New Task Assigned: ${newTask.title}`;
            const formattedStartDate = formatNepaliTime(newTask.startDate);
            const formattedDueDate = formatNepaliTime(newTask.dueDate);
            const assignedUserMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Task Assigned</h2>
          </div>
          <div style="padding: 20px;">
            <p><strong style="color: #2c3e50;">${assigningUser.username}</strong> assigned you a new task <strong style="color: #3498db;">${newTask.title}</strong> in <strong style="color: #3498db;">${project.name}</strong>.</p>
          </div>
        </div>
      `;
            const gauravMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Task Assigned</h2>
          </div>
          <div style="padding: 20px;">
            <p><strong style="color: #2c3e50;">${assigningUser.username}</strong> assigned <strong style="color: #2c3e50;">${assignedUser.username}</strong> a new task <strong style="color: #3498db;">${newTask.title}</strong> in <strong style="color: #3498db;">${project.name}</strong>.</p>
          </div>
        </div>
      `;
            // sendMail(assignedUser.email, emailSubject, assignedUserMessage);
            // sendMail('gaurav@webtech.com.np', emailSubject, gauravMessage);
            // sendMail('sudeep@webtechnepal.com', emailSubject, gauravMessage);
        }
        const updatedProject = yield prisma.project.findUnique({
            where: { id: Number(projectId) },
            include: { tasks: true },
        });
        res.status(201).json(Object.assign(Object.assign({}, newTask), { project: updatedProject }));
    }
    catch (error) {
        res.status(500).json({ message: `Error creating a task: ${error.message}` });
    }
});
exports.createTask = createTask;
const updateTaskStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { status, updatedBy } = req.body;
    try {
        const existingTask = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: { project: true },
        });
        if (!existingTask) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        const previousStatus = existingTask.status;
        yield prisma.activityLog.create({
            data: {
                action: 'STATUS_UPDATE',
                details: `${previousStatus}|${status}`,
                userId: Number(updatedBy),
                taskId: Number(taskId),
            },
        });
        const taskName = existingTask.title;
        const projectName = existingTask.project ? existingTask.project.name : "Unknown Project";
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: Number(updatedBy) },
        });
        if (!updatingUser) {
            res.status(400).json({ message: "Invalid user updating the task" });
            return;
        }
        const updatedTask = yield prisma.task.update({
            where: { id: Number(taskId) },
            data: { status },
        });
        const emailSubject = `Task Status Updated: ${taskName}`;
        const emailMessage = `
      <p><strong>${updatingUser.username}</strong> updated the task <strong>${taskName}</strong> of project <strong>${projectName}</strong>.</p>
      <p>Status changed from <strong>${previousStatus}</strong> to <strong>${status}</strong>.</p>
    `;
        // sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
        // sendMail("sudeep@webtechnepal.com", emailSubject, emailMessage);
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
});
exports.updateTaskStatus = updateTaskStatus;
const getTasksByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const tasks = yield prisma.task.findMany({
            where: { assignedTo: userId },
            include: {
                activityLogs: {
                    include: { user: true },
                    orderBy: { timestamp: 'desc' },
                },
                comments: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' },
                }
            },
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});
exports.getTasksByUser = getTasksByUser;
const getTasksByUserIdForUserTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const tasks = yield prisma.task.findMany({
            where: {
                assignedTo: userId,
            },
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasksByUserIdForUserTasks = getTasksByUserIdForUserTasks;
const getTasksByUserIdForProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const tasks = yield prisma.task.findMany({
            where: {
                assignedTo: userId,
            },
            // include: {
            //   project: true, // Include project details if needed
            //   assignee: true, // Include assignee details if needed
            // },
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
    }
});
exports.getTasksByUserIdForProfile = getTasksByUserIdForProfile;
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const { taskId } = req.params;
    const { title, description, status, priority, startDate, dueDate, assignedTo, // This should be the userId
    assignedBy, projectId, } = req.body;
    try {
        const existingTask = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: {
                project: true,
            },
        });
        if (!existingTask) {
            res.status(404).json({ message: "Task not found" });
            return;
        }
        // Fetch the assigned user's details
        const assignedUser = yield prisma.user.findUnique({
            where: { userId: Number(assignedTo) },
        });
        if (!assignedUser) {
            res.status(400).json({ message: "Assigned user not found" });
            return;
        }
        // Extract the logged-in user's information from the JWT token
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
        const updatingUser = yield prisma.user.findUnique({
            where: { userId: decodedToken.userId },
        });
        if (!updatingUser) {
            res.status(400).json({ message: "Invalid user updating the task" });
            return;
        }
        // Update the task with the assignedTo field as the userId
        const updatedTask = yield prisma.task.update({
            where: { id: Number(taskId) },
            data: {
                title,
                description,
                status,
                priority,
                startDate,
                dueDate,
                assignedTo: assignedTo, // Use the userId directly
                assignedBy,
                projectId,
            },
            include: {
                project: true,
            },
        });
        // Rest of the code (email notifications, etc.)
        const changes = [];
        if (title && title !== existingTask.title) {
            changes.push(`Task Title: <strong>${existingTask.title}</strong> → <strong>${title}</strong>`);
        }
        if (description !== undefined && description !== existingTask.description) {
            changes.push(`Description: <strong>${existingTask.description || "N/A"}</strong> → <strong>${description || "N/A"}</strong>`);
        }
        if (status && status !== existingTask.status) {
            changes.push(`Status: <strong>${existingTask.status || "N/A"}</strong> → <strong>${status}</strong>`);
        }
        if (priority && priority !== existingTask.priority) {
            changes.push(`Priority: <strong>${existingTask.priority || "N/A"}</strong> → <strong>${priority}</strong>`);
        }
        if (startDate && existingTask.startDate !== null && new Date(startDate).getTime() !== new Date(existingTask.startDate).getTime()) {
            const oldStartDate = (0, date_fns_tz_1.format)(new Date(existingTask.startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            const newStartDate = (0, date_fns_tz_1.format)(new Date(startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            changes.push(`Start Date: <strong>${oldStartDate}</strong> → <strong>${newStartDate}</strong>`);
        }
        if (dueDate && existingTask.dueDate !== null && new Date(dueDate).getTime() !== new Date(existingTask.dueDate).getTime()) {
            const oldDueDate = (0, date_fns_tz_1.format)(new Date(existingTask.dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            const newDueDate = (0, date_fns_tz_1.format)(new Date(dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
            changes.push(`Due Date: <strong>${oldDueDate}</strong> → <strong>${newDueDate}</strong>`);
        }
        if (assignedTo && assignedTo !== existingTask.assignedTo) {
            const oldAssignee = ((_b = (yield prisma.user.findUnique({ where: { userId: Number(existingTask.assignedTo) } }))) === null || _b === void 0 ? void 0 : _b.username) || existingTask.assignedTo || "N/A";
            const newAssignee = assignedUser.username || "N/A";
            changes.push(`Assigned To: <strong>${oldAssignee}</strong> → <strong>${newAssignee}</strong>`);
        }
        if (projectId && projectId !== existingTask.projectId) {
            const oldProject = ((_c = existingTask.project) === null || _c === void 0 ? void 0 : _c.name) || "N/A";
            const newProject = ((_d = (yield prisma.project.findUnique({ where: { id: Number(projectId) } }))) === null || _d === void 0 ? void 0 : _d.name) || "N/A";
            changes.push(`Project: <strong>${oldProject}</strong> → <strong>${newProject}</strong>`);
        }
        if (assignedBy && assignedBy !== existingTask.assignedBy) {
            const oldAssignedBy = ((_e = (yield prisma.user.findUnique({ where: { email: existingTask.assignedBy } }))) === null || _e === void 0 ? void 0 : _e.username) || existingTask.assignedBy || "N/A";
            const newAssignedBy = ((_f = (yield prisma.user.findUnique({ where: { email: assignedBy } }))) === null || _f === void 0 ? void 0 : _f.username) || assignedBy || "N/A";
            changes.push(`Assigned By: <strong>${oldAssignedBy}</strong> → <strong>${newAssignedBy}</strong>`);
        }
        if (changes.length > 0) {
            const emailSubject = `Task Updated: ${updatedTask.title}`;
            const emailMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white; margin: 0;">
            Task Updated by ${updatingUser.username}
          </h2>
          <div style="padding: 20px;">
            <p>
              <strong>${updatingUser.username}</strong> updated the task <strong>${updatedTask.title}</strong> of <strong>${((_g = existingTask.project) === null || _g === void 0 ? void 0 : _g.name) || "Unknown Project"}</strong>:
            </p>
            <ul style="list-style-type: disc; padding-left: 20px;">
              ${changes.map(change => `<li>${change}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
            if (assignedUser.email) {
                // Send to assigned user and both admin emails
                sendMail(assignedUser.email, emailSubject, emailMessage);
            }
            // sendMail("gaurav@webtech.com.np", emailSubject, emailMessage);
            // sendMail("sudeep@webtechnepal.com", emailSubject, emailMessage);
            console.error("Assigned user email is missing or invalid. Email sent only to admins.");
        }
        res.json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating task: ${error.message}` });
    }
});
exports.updateTask = updateTask;
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { taskId } = req.params;
    try {
        const taskToDelete = yield prisma.task.findUnique({
            where: { id: Number(taskId) },
            include: { project: true },
        });
        if (!taskToDelete) {
            res.status(404).json({ message: "Task not found" });
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
            res.status(400).json({ message: "Invalid user deleting the task" });
            return;
        }
        yield prisma.task.delete({
            where: { id: Number(taskId) },
        });
        // Send email to gaurav@webtech.com.np
        const gauravEmailSubject = `Task Deleted: ${taskToDelete.title}`;
        const gauravEmailMessage = (0, emailTemplates_1.taskDeletedEmailTemplate)(deletingUser.username || "Unknown User", // Fallback value if username is null
        taskToDelete.title, ((_b = taskToDelete.project) === null || _b === void 0 ? void 0 : _b.name) || "Unknown Project");
        // sendMail("gaurav@webtech.com.np", gauravEmailSubject, gauravEmailMessage);
        // sendMail("sudeep@webtechnepal.com", gauravEmailSubject, gauravEmailMessage);
        res.status(200).json({ message: "Task successfully deleted" });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting task: ${error.message}` });
    }
});
exports.deleteTask = deleteTask;
const getTaskComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    try {
        const comments = yield prisma.comment.findMany({
            where: { taskId: Number(taskId) },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(comments);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving comments: ${error.message}` });
    }
});
exports.getTaskComments = getTaskComments;
const addCommentToTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { taskId } = req.params;
    const { content, userId } = req.body;
    try {
        const newComment = yield prisma.comment.create({
            data: {
                content,
                userId: Number(userId),
                taskId: Number(taskId),
            },
            include: { user: true },
        });
        res.status(201).json(newComment);
    }
    catch (error) {
        res.status(500).json({ message: `Error adding comment: ${error.message}` });
    }
});
exports.addCommentToTask = addCommentToTask;
