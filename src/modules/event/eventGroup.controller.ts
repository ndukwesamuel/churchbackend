// controllers/eventGroup.controller.ts
import type { Request, Response } from "express";
import fs from "fs";
import * as XLSX from "xlsx";
import eventGroupService from "./eventGroup.service";

// Same header-detection lists used for bulk registration uploads — kept
// local here since it's the same small lookup used for one other purpose
// in eventRegistration.controller.ts, not worth sharing a module over.
const FIRST_NAME_HEADERS = new Set(["first name", "firstname", "given name"]);
const LAST_NAME_HEADERS = new Set([
  "surname",
  "last name",
  "lastname",
  "family name",
]);
const FULL_NAME_HEADERS = new Set([
  "name",
  "full name",
  "your name",
  "registrant name",
]);

function normalizeHeader(s: string): string {
  return s
    .replace(/^﻿/, "")
    .replace(/ /g, " ")
    .trim()
    .toLowerCase();
}

class EventGroupController {
  // Create `count` groups at once (e.g. count: 5 -> "Group 1".."Group 5")
  async createGroups(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const { count } = req.body;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const groups = await eventGroupService.createGroups(eventId, churchId, count);

      res.status(201).json({
        success: true,
        message: `${groups.length} group(s) created successfully`,
        data: groups,
      });
    } catch (error: any) {
      console.error("Create groups error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create groups",
      });
    }
  }

  // Create a single group with a custom name
  async createGroup(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const { name } = req.body;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const group = await eventGroupService.createGroup(eventId, churchId, name);

      res.status(201).json({
        success: true,
        message: "Group created successfully",
        data: group,
      });
    } catch (error: any) {
      console.error("Create group error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create group",
      });
    }
  }

  // List groups for an event, with member counts
  async getEventGroups(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const groups = await eventGroupService.getEventGroups(eventId, churchId);

      res.status(200).json({
        success: true,
        data: groups,
        count: groups.length,
      });
    } catch (error: any) {
      console.error("Get event groups error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch groups",
      });
    }
  }

  // Route 1: all groups for an event, each with its full member list
  async getGroupsWithMembers(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const groups = await eventGroupService.getGroupsWithMembers(eventId, churchId);

      res.status(200).json({
        success: true,
        data: groups,
        count: groups.length,
      });
    } catch (error: any) {
      console.error("Get groups with members error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch groups",
      });
    }
  }

  async renameGroup(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const { name } = req.body;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const group = await eventGroupService.renameGroup(groupId, churchId, name);

      if (!group) {
        return res.status(404).json({ success: false, message: "Group not found" });
      }

      res.status(200).json({
        success: true,
        message: "Group renamed successfully",
        data: group,
      });
    } catch (error: any) {
      console.error("Rename group error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to rename group",
      });
    }
  }

  async deleteGroup(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const deleted = await eventGroupService.deleteGroup(groupId, churchId);

      if (!deleted) {
        return res.status(404).json({ success: false, message: "Group not found" });
      }

      res.status(200).json({
        success: true,
        message: "Group deleted successfully. Its members are now unassigned.",
      });
    } catch (error: any) {
      console.error("Delete group error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete group",
      });
    }
  }

  // Assign (or unassign, when groupId is null/omitted) a registrant to a group
  async assignToGroup(req: Request, res: Response) {
    try {
      const { registrationId } = req.params;
      const { groupId } = req.body;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const registration = await eventGroupService.assignToGroup(
        registrationId,
        churchId,
        groupId || null,
      );

      if (!registration) {
        return res.status(404).json({ success: false, message: "Registration not found" });
      }

      res.status(200).json({
        success: true,
        message: groupId ? "Registrant assigned to group" : "Registrant unassigned from group",
        data: registration,
      });
    } catch (error: any) {
      console.error("Assign to group error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to assign registrant to group",
      });
    }
  }

  // Route 2: upload an Excel/CSV sheet of names (First Name / Surname, or a
  // single Name column), match each row against this event's registrants,
  // and assign the matches to `groupId`. Mirrors the file-handling approach
  // in eventRegistration.controller.ts#bulkUploadRegistrations.
  async bulkAssignToGroup(req: Request, res: Response) {
    try {
      const { groupId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      if (!req.files || !req.files.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Please attach a file with key 'file'.",
        });
      }

      const rawFile = req.files.file as any;
      const uploadedFile = Array.isArray(rawFile) ? rawFile[0] : rawFile;

      let buffer: Buffer | undefined;
      if (uploadedFile?.tempFilePath) {
        try {
          buffer = fs.readFileSync(uploadedFile.tempFilePath);
        } catch (readErr: any) {
          return res.status(400).json({
            success: false,
            message: `Could not read uploaded file from disk: ${readErr.message}`,
          });
        }
      } else if (
        uploadedFile?.data &&
        Buffer.isBuffer(uploadedFile.data) &&
        uploadedFile.data.length > 0
      ) {
        buffer = uploadedFile.data;
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "The uploaded file was empty or unreadable. Please re-upload the file.",
        });
      }

      if (uploadedFile?.tempFilePath) {
        fs.unlink(uploadedFile.tempFilePath, () => {});
      }

      let workbook: XLSX.WorkBook;
      try {
        workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
      } catch (parseError: any) {
        return res.status(400).json({
          success: false,
          message: `Could not parse the file as an Excel workbook: ${parseError.message}`,
        });
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({
          success: false,
          message: "The Excel file has no sheets.",
        });
      }

      let rows: any[] = [];
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet || !worksheet["!ref"]) continue;

        const sheetData = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          blankrows: false,
        });
        if (sheetData.length > 0) {
          rows = sheetData;
          break;
        }
      }

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No data rows found in any sheet of the Excel file. Make sure " +
            "the first row contains column headers and there is at least " +
            "one data row below it.",
        });
      }

      // Build a full name per row from First Name/Surname columns, or a
      // single Name column if that's what the sheet has instead.
      const names: { row: number; fullName: string }[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let firstName = "";
        let lastName = "";
        let fullName = "";

        for (const [excelColumn, value] of Object.entries(row)) {
          const normalizedColumn = normalizeHeader(excelColumn);
          const stringValue = (
            typeof value === "string" ? value.trim() : (value ?? "")
          )
            .toString()
            .trim();

          if (FIRST_NAME_HEADERS.has(normalizedColumn)) {
            firstName = stringValue;
          } else if (LAST_NAME_HEADERS.has(normalizedColumn)) {
            lastName = stringValue;
          } else if (!fullName && FULL_NAME_HEADERS.has(normalizedColumn)) {
            fullName = stringValue;
          }
        }

        if (!fullName) {
          fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
        }

        names.push({ row: i + 1, fullName });
      }

      const result = await eventGroupService.bulkAssignByNames(
        groupId,
        churchId,
        names,
      );

      res.status(200).json({
        success: true,
        message:
          `${result.assigned.length} assigned, ${result.conflicts.length} already in another group, ` +
          `${result.notFound.length} not found, ${result.ambiguous.length} ambiguous.`,
        data: result,
      });
    } catch (error: any) {
      console.error("Bulk assign to group error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to bulk-assign registrants to group",
      });
    }
  }
}

export default new EventGroupController();
