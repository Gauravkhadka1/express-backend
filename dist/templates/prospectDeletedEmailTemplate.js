"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prospectDeletedEmailTemplate = void 0;
const prospectDeletedEmailTemplate = (deletingUser, prospectName) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="background: linear-gradient(135deg, #3498db, #2c3e50); padding: 15px; border-top-left-radius: 8px; border-top-right-radius: 8px; text-align: center; color: white; margin: 0;">
        Prospect Deleted
      </h2>
      <div style="padding: 20px;">
        <p><strong>${deletingUser}</strong> deleted the prospect <strong>${prospectName}</strong>.</p>
      </div>
    </div>
  `;
};
exports.prospectDeletedEmailTemplate = prospectDeletedEmailTemplate;
