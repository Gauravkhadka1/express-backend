import { Router } from "express";
import { createProject, getProjects, updateProjectStatus, updateProject, deleteProject } from "../controllers/projectController";

const router = Router();

router.get("/", getProjects);
router.post("/", createProject);
router.patch("/:projectId/status", updateProjectStatus);
router.delete("/:projectId", deleteProject);
router.put("/:projectId", updateProject);

export default router;