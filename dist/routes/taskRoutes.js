"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController_1 = require("../controllers/taskController");
const router = (0, express_1.Router)();
router.get("/", taskController_1.getTasks);
router.get("/user/:userId", taskController_1.getTasksByUser);
router.get("/usertasks/:userId", taskController_1.getTasksByUserIdForUserTasks); // New route for user tasks
router.get("/profile/:userId", taskController_1.getTasksByUserIdForProfile);
router.post("/", taskController_1.createTask);
router.put("/:taskId", taskController_1.updateTask);
router.delete("/:taskId", taskController_1.deleteTask);
router.patch("/:taskId/status", taskController_1.updateTaskStatus);
router.get("/:taskId/comments", taskController_1.getTaskComments); // GET comments for a task
router.post("/:taskId/comments", taskController_1.addCommentToTask); // POST a new comment
exports.default = router;
