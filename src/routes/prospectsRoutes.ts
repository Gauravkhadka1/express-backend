import { Router } from "express";
import {
  getProspects,
  createProspect,
  updateProspectStatus,
  updateProspect,
  deleteProspect,
} from "../controllers/prospectsController";// Optional: Add authentication middleware

const router = Router();

// Get all prospects
router.get("/", getProspects);

// Create a new prospect
router.post("/", createProspect);

// Update prospect status
router.patch("/:prospectId/status", updateProspectStatus);

// Edit a prospect
router.put("/:prospectId", updateProspect);

// Delete a prospect
router.delete("/:prospectId", deleteProspect);

export default router;
