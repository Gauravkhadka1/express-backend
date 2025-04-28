import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { format } from 'date-fns-tz';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { taskDeletedEmailTemplate } from "../templates/emailTemplates";

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  auth: {
    user: "gauravkhadka111111@gmail.com",
    pass: "catgfxsmwkqrdknh", 
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
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const { projectId, assignedTo } = req.query;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId ? { projectId: Number(projectId) } : {}),
        ...(assignedTo ? { assignedTo: String(assignedTo) } : {}),
      },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  const {
    title,
    description,
    status,
    priority,
    startDate,
    dueDate,
    projectId,
    assignedTo,
    assignedBy,
  } = req.body;

  try {
    const newTask = await prisma.task.create({
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

    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        details: null,
        userId: Number(assignedTo), // Or use the creator's ID if different
        taskId: newTask.id,
      },
    });

    const assignedUser = await prisma.user.findUnique({
      where: { userId: Number(assignedTo) },
    });

    const assigningUser = await prisma.user.findUnique({
      where: { email: assignedBy },
    });

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      select: { name: true },
    });

    const formatNepaliTime = (dateValue: Date | null) => {
      if (!dateValue) return "N/A";
      return format(dateValue, "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
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

    const updatedProject = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: { tasks: true },
    });

    res.status(201).json({
      ...newTask,
      project: updatedProject, // Include the updated project in response
    });
  } catch (error: any) {
    res.status(500).json({ message: `Error creating a task: ${error.message}` });
  }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const { status, updatedBy } = req.body;

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: { project: true },
    });

    if (!existingTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const previousStatus = existingTask.status;
    await prisma.activityLog.create({
      data: {
        action: 'STATUS_UPDATE',
        details: `${previousStatus}|${status}`,
        userId: Number(updatedBy),
        taskId: Number(taskId),
      },
    });
    const taskName = existingTask.title;
    const projectName = existingTask.project ? existingTask.project.name : "Unknown Project";

    const updatingUser = await prisma.user.findUnique({
      where: { userId: Number(updatedBy) },
    });

    if (!updatingUser) {
      res.status(400).json({ message: "Invalid user updating the task" });
      return;
    }

    const updatedTask = await prisma.task.update({
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
  } catch (error: any) {
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};

export const getTasksByUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const tasks = await prisma.task.findMany({
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const getTasksByUserIdForUserTasks = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: userId,
      },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
  }
};

export const getTasksByUserIdForProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: userId,
      },
      // include: {
      //   project: true, // Include project details if needed
      //   assignee: true, // Include assignee details if needed
      // },
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
  }
};




export const updateTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const {
    title,
    description,
    status,
    priority,
    startDate,
    dueDate,
    assignedTo, // This should be the userId
    assignedBy,
    projectId,
  } = req.body;

  try {
    const existingTask = await prisma.task.findUnique({
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
    const assignedUser = await prisma.user.findUnique({
      where: { userId: Number(assignedTo) },
    });

    if (!assignedUser) {
      res.status(400).json({ message: "Assigned user not found" });
      return;
    }

    // Extract the logged-in user's information from the JWT token
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

    const updatingUser = await prisma.user.findUnique({
      where: { userId: decodedToken.userId },
    });

    if (!updatingUser) {
      res.status(400).json({ message: "Invalid user updating the task" });
      return;
    }

    // Update the task with the assignedTo field as the userId
    const updatedTask = await prisma.task.update({
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
    const changes: string[] = [];

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
      const oldStartDate = format(new Date(existingTask.startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
      const newStartDate = format(new Date(startDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
      changes.push(`Start Date: <strong>${oldStartDate}</strong> → <strong>${newStartDate}</strong>`);
    }
    if (dueDate && existingTask.dueDate !== null && new Date(dueDate).getTime() !== new Date(existingTask.dueDate).getTime()) {
      const oldDueDate = format(new Date(existingTask.dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
      const newDueDate = format(new Date(dueDate), "MMMM dd, yyyy hh:mm a", { timeZone: "Asia/Kathmandu" });
      changes.push(`Due Date: <strong>${oldDueDate}</strong> → <strong>${newDueDate}</strong>`);
    }
    if (assignedTo && assignedTo !== existingTask.assignedTo) {
      const oldAssignee = (await prisma.user.findUnique({ where: { userId: Number(existingTask.assignedTo) } }))?.username || existingTask.assignedTo || "N/A";
      const newAssignee = assignedUser.username || "N/A";
      changes.push(`Assigned To: <strong>${oldAssignee}</strong> → <strong>${newAssignee}</strong>`);
    }
    if (projectId && projectId !== existingTask.projectId) {
      const oldProject = existingTask.project?.name || "N/A";
      const newProject = (await prisma.project.findUnique({ where: { id: Number(projectId) } }))?.name || "N/A";
      changes.push(`Project: <strong>${oldProject}</strong> → <strong>${newProject}</strong>`);
    }
    if (assignedBy && assignedBy !== existingTask.assignedBy) {
      const oldAssignedBy = (await prisma.user.findUnique({ where: { email: existingTask.assignedBy } }))?.username || existingTask.assignedBy || "N/A";
      const newAssignedBy = (await prisma.user.findUnique({ where: { email: assignedBy } }))?.username || assignedBy || "N/A";
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
              <strong>${updatingUser.username}</strong> updated the task <strong>${updatedTask.title}</strong> of <strong>${existingTask.project?.name || "Unknown Project"}</strong>:
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
  } catch (error: any) {
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};


export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;

  try {
    const taskToDelete = await prisma.task.findUnique({
      where: { id: Number(taskId) },
      include: { project: true },
    });

    if (!taskToDelete) {
      res.status(404).json({ message: "Task not found" });
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
      res.status(400).json({ message: "Invalid user deleting the task" });
      return;
    }

    await prisma.task.delete({
      where: { id: Number(taskId) },
    });

    // Send email to gaurav@webtech.com.np
    const gauravEmailSubject = `Task Deleted: ${taskToDelete.title}`;
    const gauravEmailMessage = taskDeletedEmailTemplate(
      deletingUser.username || "Unknown User", // Fallback value if username is null
      taskToDelete.title,
      taskToDelete.project?.name || "Unknown Project"
    );

    // sendMail("gaurav@webtech.com.np", gauravEmailSubject, gauravEmailMessage);
    // sendMail("sudeep@webtechnepal.com", gauravEmailSubject, gauravEmailMessage);

    res.status(200).json({ message: "Task successfully deleted" });
  } catch (error: any) {
    res.status(500).json({ message: `Error deleting task: ${error.message}` });
  }
};

export const getTaskComments = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;

  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: Number(taskId) },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving comments: ${error.message}` });
  }
};

export const addCommentToTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const { content, userId } = req.body;

  try {
    const newComment = await prisma.comment.create({
      data: {
        content,
        userId: Number(userId),
        taskId: Number(taskId),
      },
      include: { user: true },
    });

    res.status(201).json(newComment);
  } catch (error: any) {
    res.status(500).json({ message: `Error adding comment: ${error.message}` });
  }
};