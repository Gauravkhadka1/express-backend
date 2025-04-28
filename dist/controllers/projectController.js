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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProject = exports.deleteProject = exports.updateProjectStatus = exports.createProject = exports.getProjects = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield prisma.project.findMany({
            include: {
                tasks: true, // Include tasks in the response
            },
        });
        res.json(projects);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving projects: ${error.message}` });
    }
});
exports.getProjects = getProjects;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, startDate, endDate, status = "New" } = req.body;
    try {
        const newProject = yield prisma.project.create({
            data: {
                name,
                description,
                startDate,
                endDate,
                status,
            },
        });
        res.status(201).json(newProject);
    }
    catch (error) {
        console.error("Error creating project:", error); // Log the complete error
        res.status(500).json({ message: `Error creating project: ${error.message}` });
    }
});
exports.createProject = createProject;
const updateProjectStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { status } = req.body;
    try {
        const updatedProject = yield prisma.project.update({
            where: {
                id: Number(projectId),
            },
            data: {
                status: status,
            },
        });
        res.json(updatedProject);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating Project: ${error.message}` });
    }
});
exports.updateProjectStatus = updateProjectStatus;
// In your projectController.ts
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    try {
        // First delete all tasks associated with this project
        yield prisma.task.deleteMany({
            where: {
                projectId: Number(projectId),
            },
        });
        // Then delete the project
        yield prisma.project.delete({
            where: {
                id: Number(projectId),
            },
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting project: ${error.message}` });
    }
});
exports.deleteProject = deleteProject;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { name, description, startDate, endDate, googleDriveLink } = req.body;
    try {
        const updatedProject = yield prisma.project.update({
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
    }
    catch (error) {
        res.status(500).json({ message: `Error updating project: ${error.message}` });
    }
});
exports.updateProject = updateProject;
