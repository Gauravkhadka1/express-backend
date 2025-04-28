import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: true, // Include tasks in the response
      },
    });
    res.json(projects);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving projects: ${error.message}` });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  const { name, description, startDate, endDate, status = "New" } = req.body;
  try {
    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        startDate,
        endDate,
        status,
      },
    });
    res.status(201).json(newProject);
  } catch (error: any) {
    console.error("Error creating project:", error);  // Log the complete error
    res.status(500).json({ message: `Error creating project: ${error.message}` });
  }
};


export const updateProjectStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { projectId } = req.params;
  const { status } = req.body;
  try {
    const updatedProject = await prisma.project.update({
      where: {
        id: Number(projectId),
      },
      data: {
        status: status,
      },
    });
    res.json(updatedProject);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating Project: ${error.message}` });
  }
};

// In your projectController.ts
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  try {
    // First delete all tasks associated with this project
    await prisma.task.deleteMany({
      where: {
        projectId: Number(projectId),
      },
    });

    // Then delete the project
    await prisma.project.delete({
      where: {
        id: Number(projectId),
      },
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: `Error deleting project: ${error.message}` });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { name, description, startDate, endDate, googleDriveLink } = req.body;
  
  try {
    const updatedProject = await prisma.project.update({
      where: {
        id: Number(projectId),
      },
      data: {
        name,
        description,
        // Convert string dates to DateTime objects
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        googleDriveLink,
      },
    });
    res.json(updatedProject);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating project: ${error.message}` });
  }
};