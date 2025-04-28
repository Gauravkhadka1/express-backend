import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return; // This returns void which matches the expected type
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: "Invalid or expired token" });
      return; // This returns void which matches the expected type
    }
    
    // Attach userId to the request
    (req as any).userId = user.userId;
    next(); // Properly continues to the next middleware
  });
};