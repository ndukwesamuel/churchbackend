// controllers/eventRegistration.controller.ts
import type { Request, Response } from "express";
import fs from "fs";
import eventRegistrationService from "./eventRegistration.service";
// import eventRegistrationService from "../services/eventRegistration.service";
import * as XLSX from "xlsx";
import eventModel from "./event.model";


class EventRegistrationController {
  // Register for event (public endpoint)
  async registerForEvent(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const { responses, registrantEmail, registrantName } = req.body;

      if (!responses || !registrantEmail || !registrantName) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const registeredBy = req.user?.id; // optional, if authenticated

      const registration = await eventRegistrationService.registerForEvent({
        eventId,
        responses,
        registrantEmail,
        registrantName,
        registeredBy,
      });

      res.status(201).json({
        success: true,
        message: "Registration successful! Check your email for confirmation.",
        data: registration,
      });
    } catch (error: any) {
      console.error("Event registration error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to register for event",
      });
    }
  }

  // Get all registrations for an event (admin)
  async getEventRegistrations(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { status, search, checkedIn } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (search) filters.search = search as string;
      // ?checkedIn=true|false — e.g. "who's currently in the building"
      if (checkedIn === "true") filters.checkedIn = true;
      if (checkedIn === "false") filters.checkedIn = false;

      const registrations =
        await eventRegistrationService.getEventRegistrations(
          eventId,
          churchId,
          filters,
        );

      res.status(200).json({
        success: true,
        data: registrations,
        count: registrations.length,
      });
    } catch (error: any) {
      console.error("Get registrations error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch registrations",
      });
    }
  }

  // Get single registration
  async getRegistration(req: Request, res: Response) {
    try {
      const { registrationId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const registration = await eventRegistrationService.getRegistrationById(
        registrationId,
        churchId,
      );

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      res.status(200).json({
        success: true,
        data: registration,
      });
    } catch (error: any) {
      console.error("Get registration error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch registration",
      });
    }
  }

  // Get a registrant's full profile: registration details, form responses
  // relabeled with the event's question text, and a QR code (as a base64
  // data URL) for check-in scanning. Admin only.
  async getRegistrationProfile(req: Request, res: Response) {
    try {
      const { registrationId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const profile = await eventRegistrationService.getRegistrationProfile(
        registrationId,
        churchId,
      );

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error("Get registration profile error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch registration profile",
      });
    }
  }

  // Serves the registrant's QR code as a raw PNG image (not wrapped in
  // JSON) — convenient for printing a badge or embedding directly as an
  // <img src="..."> without decoding a data URL first. Admin only.
  async getRegistrationQRCode(req: Request, res: Response) {
    try {
      const { registrationId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const buffer = await eventRegistrationService.getRegistrationQRCodeBuffer(
        registrationId,
        churchId,
      );

      if (!buffer) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      res.set("Content-Type", "image/png");
      res.status(200).send(buffer);
    } catch (error: any) {
      console.error("Get registration QR code error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate QR code",
      });
    }
  }

  // Scan endpoint — called when staff scan a registrant's QR code. Toggles
  // check-in state: first scan marks them "in", the next scan of the same
  // person marks them "out", and so on. Admin only, since this is meant to
  // be called from an authenticated staff scanning device/app, not by the
  // registrant themselves.
  async checkInRegistration(req: Request, res: Response) {
    try {
      const { registrationId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const result = await eventRegistrationService.toggleCheckIn(
        registrationId,
        churchId,
      );

      if (!result.ok) {
        if (result.reason === "not_found") {
          return res.status(404).json({
            success: false,
            message: "Registration not found",
          });
        }
        if (result.reason === "cancelled") {
          return res.status(409).json({
            success: false,
            message:
              "This registration was cancelled and cannot be checked in.",
          });
        }
        // reason === "pending"
        return res.status(409).json({
          success: false,
          message:
            "This registration is pending approval and must be confirmed before check-in.",
        });
      }

      res.status(200).json({
        success: true,
        message:
          result.action === "in"
            ? `${result.registration.registrantName} checked in`
            : `${result.registration.registrantName} checked out`,
        data: {
          action: result.action,
          checkedIn: result.registration.checkedIn,
          registrantName: result.registration.registrantName,
          registrationId: result.registration._id,
        },
      });
    } catch (error: any) {
      console.error("Check-in error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process check-in",
      });
    }
  }

  // Update registration status
  async updateRegistrationStatus(req: Request, res: Response) {
    try {
      const { registrationId } = req.params;
      const { status } = req.body;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!["pending", "confirmed", "cancelled", "attended"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const registration =
        await eventRegistrationService.updateRegistrationStatus(
          registrationId,
          churchId,
          status,
        );

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Registration status updated successfully",
        data: registration,
      });
    } catch (error: any) {
      console.error("Update registration status error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update registration status",
      });
    }
  }

  // Bulk update registration status
  async bulkUpdateStatus(req: Request, res: Response) {
    try {
      const { registrationIds, status } = req.body;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid registration IDs",
        });
      }

      if (!["pending", "confirmed", "cancelled", "attended"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const count = await eventRegistrationService.bulkUpdateStatus(
        registrationIds,
        churchId,
        status,
      );

      res.status(200).json({
        success: true,
        message: `${count} registration(s) updated successfully`,
        data: { updatedCount: count },
      });
    } catch (error: any) {
      console.error("Bulk update error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update registrations",
      });
    }
  }

  // Delete registration
  async deleteRegistration(req: Request, res: Response) {
    try {
      const { registrationId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const deleted = await eventRegistrationService.deleteRegistration(
        registrationId,
        churchId,
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Registration not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Registration deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete registration error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete registration",
      });
    }
  }

  // Check if user is already registered
  async checkRegistration(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const { email, name } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // `name` is optional for backward compatibility with existing
      // callers, but strongly recommended: since one email can now cover
      // multiple registrants (e.g. a family sharing a parent's email),
      // an email-only lookup can only tell you "someone registered with
      // this email", not "this specific person is registered".
      const registration =
        await eventRegistrationService.getRegistrationByEmail(
          eventId,
          email as string,
          name as string | undefined,
        );

      res.status(200).json({
        success: true,
        data: {
          isRegistered: !!registration,
          registration: registration || null,
          ...(!name && {
            note:
              "Checked by email only. If this email covers multiple " +
              "registrants, pass a 'name' query param to check a specific person.",
          }),
        },
      });
    } catch (error: any) {
      console.error("Check registration error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check registration",
      });
    }
  }

  // Export registrations
  async exportRegistrations(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const exportData = await eventRegistrationService.exportRegistrations(
        eventId,
        churchId,
      );

      res.status(200).json({
        success: true,
        data: exportData,
        count: exportData.length,
      });
    } catch (error: any) {
      console.error("Export registrations error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to export registrations",
      });
    }
  }

  // Bulk upload registrations from an Excel file
  async bulkUploadRegistrations(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
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

      // express-fileupload returns an array instead of a single object if the
      // client accidentally sends more than one file under the same field
      // name — always normalize to the first file.
      const rawFile = req.files.file as any;
      const uploadedFile = Array.isArray(rawFile) ? rawFile[0] : rawFile;

      // The app is configured with `useTempFiles: true`, which means
      // express-fileupload streams the file to disk instead of holding it
      // in memory — in that mode `uploadedFile.data` is an EMPTY buffer and
      // the real bytes live at `uploadedFile.tempFilePath`. Reading `.data`
      // directly (as before) silently parsed an empty buffer, which is why
      // XLSX always reported "no data rows" regardless of the file content.
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
        // Fallback for setups without useTempFiles (in-memory mode).
        buffer = uploadedFile.data;
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "The uploaded file was empty or unreadable. Please re-upload the file.",
        });
      }

      // Now that the bytes are in memory, remove the temp file. Best-effort —
      // express-fileupload also cleans these up on its own, so ignore errors.
      if (uploadedFile?.tempFilePath) {
        fs.unlink(uploadedFile.tempFilePath, () => {});
      }

      const event = await eventModel.findOne({ _id: eventId, churchId });
      if (!event) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }

      // Parse the workbook. A corrupted file or a file that isn't actually
      // an .xlsx/.xls/.csv will throw here instead of silently yielding an
      // empty workbook.
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
      const sheetDiagnostics: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        // A sheet with no "!ref" has no cells at all — skip it up front
        // instead of letting sheet_to_json silently return [].
        if (!worksheet || !worksheet["!ref"]) {
          sheetDiagnostics.push(`${sheetName}: empty sheet`);
          continue;
        }

        // defval fills in blank cells so a row isn't dropped just because
        // one column is empty; blankrows: false skips fully-blank rows so
        // they don't get counted as data.
        const sheetData = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          blankrows: false,
        });

        sheetDiagnostics.push(`${sheetName}: ${sheetData.length} data row(s)`);

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
          // Remove `debug` (or gate it behind an env check) once this is
          // confirmed working in your environment — it's here so you can
          // see exactly what was found per sheet while you diagnose.
          debug: sheetDiagnostics,
        });
      }

      // Normalize header text before matching: trim, lowercase, strip a
      // leading BOM and non-breaking spaces, both of which Excel sometimes
      // injects into the first header cell and which would otherwise make
      // an exact-match column lookup silently fail.
      const normalize = (s: string) =>
        s
          .replace(/^\uFEFF/, "")
          .replace(/\u00A0/g, " ")
          .trim()
          .toLowerCase();

      const columnMap = new Map<string, string>();
      event.formFields.forEach((field) => {
        columnMap.set(normalize(field.label), field.fieldId);
        columnMap.set(normalize(field.fieldId), field.fieldId);
      });

      // Recognize the registrant's identity (name/email) from common column
      // headers directly, INDEPENDENT of event.formFields. Relying solely on
      // the event's custom form fields (as before) meant a row was only
      // ever matched if the admin had literally tagged a field
      // fieldType: "email" — spreadsheets like Google Forms exports (with
      // headers like "Email", "First Name", "Surname") would never match
      // and every row would fail identically, regardless of valid data.
      const EMAIL_VALUE_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

      const successfulRegistrations = [];
      const failedRegistrations = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const responses: Record<string, any> = {};
          let registrantName = "";
          let registrantEmail = "";
          let firstName = "";
          let lastName = "";
          let emailWasCleaned = false;

          for (const [excelColumn, value] of Object.entries(row)) {
            const normalizedColumn = normalize(excelColumn);
            let cleanValue: any =
              typeof value === "string" ? value.trim() : value;

            // Map into the event's custom question responses when the
            // column matches a configured form field.
            const fieldId = columnMap.get(normalizedColumn);
            if (fieldId) {
              const formField = event.formFields.find((f) => f.fieldId === fieldId);
              if (formField?.fieldType === "checkbox" && cleanValue) {
                cleanValue = cleanValue
                  .toString()
                  .split(",")
                  .map((v: string) => v.trim());
              }
              responses[fieldId] = cleanValue;
            }

            // Separately, detect the registrant's email/name by header text
            // so this works whether or not the event's custom fields cover
            // them. Guard email with a format check so a column that merely
            // mentions "email" in a longer question doesn't get mistaken
            // for the address itself.
            const stringValue = (cleanValue ?? "").toString().trim();

            // A real email can never contain whitespace, so any embedded
            // space (e.g. "name@gmail. com", "first last@gmail.com") is
            // almost always a manual-entry typo — strip it before
            // validating instead of discarding a recoverable row.
            const emailCandidate = stringValue.replace(/\s+/g, "");

            if (
              !registrantEmail &&
              normalizedColumn.includes("email") &&
              EMAIL_VALUE_RE.test(emailCandidate)
            ) {
              registrantEmail = emailCandidate;
              emailWasCleaned = emailCandidate !== stringValue;
            } else if (!registrantEmail && EMAIL_VALUE_RE.test(emailCandidate)) {
              // Fallback: no column is headed "email" but a value looks
              // exactly like one — safer than leaving valid rows to fail.
              registrantEmail = emailCandidate;
              emailWasCleaned = emailCandidate !== stringValue;
            }

            if (FIRST_NAME_HEADERS.has(normalizedColumn)) {
              firstName = stringValue;
            } else if (LAST_NAME_HEADERS.has(normalizedColumn)) {
              lastName = stringValue;
            } else if (!registrantName && FULL_NAME_HEADERS.has(normalizedColumn)) {
              registrantName = stringValue;
            }
          }

          if (!registrantName) {
            registrantName = [firstName, lastName].filter(Boolean).join(" ").trim();
          }

          if (!registrantEmail) throw new Error("Email field not found or empty in file");
          if (!registrantName) throw new Error("Name field not found or empty in file");

          // Backfill: the event's own custom fields are entirely admin-defined
          // — there's nothing static about their labels or fieldIds. An admin
          // might configure a single required "Full Name" question instead of
          // relying on separate First Name/Surname columns, or an "Email"
          // question with different wording than the spreadsheet header. If a
          // field represents identity data we ALREADY derived above but no
          // spreadsheet column literally matched its label/fieldId text, fill
          // it in from what we know rather than letting validation fail on a
          // technicality. Only touches fields still empty — never overwrites
          // an actual answer from the spreadsheet — and only matches on
          // unambiguous signals (declared fieldType "email", or a label from
          // the same exact name-header set used above) so it can't misfire on
          // an unrelated question like "What is the name of your church?".
          for (const field of event.formFields) {
            const existing = responses[field.fieldId];
            const isEmpty =
              existing === undefined ||
              existing === null ||
              existing === "" ||
              (Array.isArray(existing) && existing.length === 0);
            if (!isEmpty) continue;

            if (field.fieldType === "email") {
              responses[field.fieldId] = registrantEmail;
            } else if (
              FULL_NAME_HEADERS.has(normalize(field.label)) ||
              FULL_NAME_HEADERS.has(normalize(field.fieldId))
            ) {
              responses[field.fieldId] = registrantName;
            }
          }

          const registration = await eventRegistrationService.registerForEvent({
            eventId,
            responses,
            registrantEmail,
            registrantName,
            registeredBy: churchId,
          });

          successfulRegistrations.push({
            row: i + 1,
            name: registrantName,
            email: registrantEmail,
            registrationId: registration._id,
            ...(emailWasCleaned && {
              note: "Email had embedded whitespace removed — please verify it's correct.",
            }),
          });
        } catch (error: any) {
          failedRegistrations.push({
            row: i + 1,
            error: error.message,
            data: row,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Bulk upload complete. ${successfulRegistrations.length} succeeded, ${failedRegistrations.length} failed.`,
        data: {
          successCount: successfulRegistrations.length,
          failedCount: failedRegistrations.length,
          successful: successfulRegistrations,
          failed: failedRegistrations,
        },
      });
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process bulk upload",
      });
    }
  }
}

export default new EventRegistrationController();