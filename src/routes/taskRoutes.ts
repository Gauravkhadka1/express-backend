import { Router } from "express";
import {
  createTask,
  deleteTask,
  updateTask,
  getTasks,
  getTasksByUser,
  getTasksByUserIdForUserTasks, 
  getTasksByUserIdForProfile, 
  updateTaskStatus,
  getTaskComments,          
  addCommentToTask,
} from "../controllers/taskController";

const router = Router();

router.get("/", getTasks);
router.get("/user/:userId", getTasksByUser);
router.get("/usertasks/:userId", getTasksByUserIdForUserTasks); // New route for user tasks
router.get("/profile/:userId", getTasksByUserIdForProfile);
router.post("/", createTask);
router.put("/:taskId", updateTask); 
router.delete("/:taskId", deleteTask); 
router.patch("/:taskId/status", updateTaskStatus);

router.get("/:taskId/comments", getTaskComments);        // GET comments for a task
router.post("/:taskId/comments", addCommentToTask);      // POST a new comment

export default router;
