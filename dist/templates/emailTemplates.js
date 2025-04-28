"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskDeletedEmailTemplate = void 0;
const taskDeletedEmailTemplate = (deletingUser, taskName, projectName) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Deleted Notification</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .email-header { background: linear-gradient(135deg, #3498db, #2c3e50); color: white; text-align: center; padding: 20px; }
    .email-header h2 { margin: 0; font-size: 24px; }
    .email-body { padding: 20px; color: #333333; }
    .email-body p { margin: 0 0 15px; line-height: 1.6; }
    .email-body strong { color: #3498db; }
    .email-footer { text-align: center; padding: 10px; background-color: #f1f1f1; color: #777777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h2>Task Deleted</h2>
    </div>
    <div class="email-body">
      <p>
        <strong>${deletingUser}</strong> deleted the task <strong>${taskName}</strong> of project <strong>${projectName}</strong>.
      </p>
    </div>
  </div>
</body>
</html>
`;
exports.taskDeletedEmailTemplate = taskDeletedEmailTemplate;
