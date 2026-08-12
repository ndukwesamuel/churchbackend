// services/eventRegistration.service.ts
import type { IEventRegistration } from "./eventRegistration.interface"; //"../models/eventRegistration.interface";
import type { IFormField } from "./event.interface"; //"../models/event.interface";
import QRCode from "qrcode";
import eventModel from "./event.model";
import eventRegistrationModel from "./eventRegistration.model";

// Escapes regex special characters in a string so it can be used safely
// inside a $regex query. Names commonly contain characters like ".", "(",
// ")", "-" (e.g. "Ijitimehin (Jr.)") which would otherwise be interpreted
// as regex syntax instead of literal text.
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class EventRegistrationService {
  //   Register for an event
  async registerForEvent(registrationData: {
    eventId: string;
    responses: Record<string, any>;
    registrantEmail: string;
    registrantName: string;
    registeredBy?: string;
  }): Promise<IEventRegistration> {
    const {
      eventId,
      responses,
      registrantEmail,
      registrantName,
      registeredBy,
    } = registrationData;
    // Get event
    const event = await eventModel.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }
    // Check if event is open
    if (event.status !== "open") {
      throw new Error("Event registration is not open");
    }
    // Check capacity
    if (event.capacity) {
      const currentCount = await eventRegistrationModel.countDocuments({
        eventId,
      });
      if (currentCount >= event.capacity) {
        throw new Error("Event is at full capacity");
      }
    }
    // Check for duplicate registration
    if (!event.allowMultipleRegistrations) {
      // Match on BOTH email and name (case-insensitive) rather than email
      // alone. Families/groups often share one email address (e.g. a
      // parent's email for several children), so email alone is too broad
      // and would block legitimate distinct registrants. Matching on the
      // pair still catches an accidental re-upload of the same person.
      const existingRegistration = await eventRegistrationModel.findOne({
        eventId,
        registrantEmail: registrantEmail.toLowerCase(),
        registrantName: {
          $regex: `^${escapeRegExp(registrantName.trim())}$`,
          $options: "i",
        },
      });
      if (existingRegistration) {
        throw new Error("You have already registered for this event");
      }
    }
    // Validate responses against form fields
    this.validateResponses(responses, event.formFields);
    // Create registration
    const registration = new eventRegistrationModel({
      eventId,
      churchId: event.churchId,
      responses,
      registrantEmail: registrantEmail.toLowerCase(),
      registrantName,
      registeredBy,
      status: event.requireApproval ? "pending" : "confirmed",
    });
    await registration.save();
    // Update event registration count
    await eventModel.findByIdAndUpdate(eventId, {
      $inc: { registrationCount: 1 },
    });
    return registration;
  }
  // Validate form responses
  private validateResponses(
    responses: Record<string, any>,
    formFields: IFormField[],
  ): void {
    for (const field of formFields) {
      const value = responses[field.fieldId];
      // Check required fields
      if (
        field.required &&
        (value === undefined || value === null || value === "")
      ) {
        throw new Error(`${field.label} is required`);
      }
      // Skip validation if field is not required and empty
      if (!value) continue;
      // Type-specific validation
      switch (field.fieldType) {
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            throw new Error(`${field.label} must be a valid email`);
          }
          break;
        case "phone":
          if (field.validation?.pattern) {
            const phoneRegex = new RegExp(field.validation.pattern);
            if (!phoneRegex.test(value)) {
              throw new Error(`${field.label} must be a valid phone number`);
            }
          }
          break;
        case "number":
          const numValue = Number(value);
          if (isNaN(numValue)) {
            throw new Error(`${field.label} must be a number`);
          }
          if (
            field.validation?.min !== undefined &&
            numValue < field.validation.min
          ) {
            throw new Error(
              `${field.label} must be at least ${field.validation.min}`,
            );
          }
          if (
            field.validation?.max !== undefined &&
            numValue > field.validation.max
          ) {
            throw new Error(
              `${field.label} must be at most ${field.validation.max}`,
            );
          }
          break;
        case "text":
        case "textarea":
          if (
            field.validation?.minLength &&
            value.length < field.validation.minLength
          ) {
            throw new Error(
              `${field.label} must be at least ${field.validation.minLength} characters`,
            );
          }
          if (
            field.validation?.maxLength &&
            value.length > field.validation.maxLength
          ) {
            throw new Error(
              `${field.label} must be at most ${field.validation.maxLength} characters`,
            );
          }
          break;
        case "select":
        case "radio":
          if (field.options && !field.options.includes(value)) {
            throw new Error(`Invalid value for ${field.label}`);
          }
          break;
        case "checkbox":
          if (!Array.isArray(value)) {
            throw new Error(`${field.label} must be an array`);
          }
          if (field.options) {
            for (const item of value) {
              if (!field.options.includes(item)) {
                throw new Error(`Invalid option in ${field.label}`);
              }
            }
          }
          break;
      }
    }
  }
  //   // Get all registrations for an event
  async getEventRegistrations(
    eventId: string,
    churchId: string,
    filters?: {
      status?: "pending" | "confirmed" | "cancelled" | "attended";
      search?: string;
      checkedIn?: boolean;
    },
  ): Promise<IEventRegistration[]> {
    const query: any = { eventId, churchId };
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.checkedIn !== undefined) {
      query.checkedIn = filters.checkedIn;
    }
    if (filters?.search) {
      query.$or = [
        { registrantName: { $regex: filters.search, $options: "i" } },
        { registrantEmail: { $regex: filters.search, $options: "i" } },
      ];
    }
    const registrations = await eventRegistrationModel
      .find(query)
      .sort({ registeredAt: -1 })
      .lean();
    return registrations as IEventRegistration[];
  }
  // Get single registration
  async getRegistrationById(
    registrationId: string,
    churchId: string,
  ): Promise<IEventRegistration | null> {
    const registration = await eventRegistrationModel
      .findOne({
        _id: registrationId,
        churchId,
      })
      .lean();
    return registration as IEventRegistration | null;
  }

  // Generates a QR code (as a base64 PNG data URL) for a registration.
  // The payload is just enough to identify the registration on scan — it
  // isn't a security boundary itself; the scan/check-in endpoint it's used
  // against is admin-only (isAuth), so trust is enforced there, not in the
  // QR contents.
  private async generateQRCodeDataUrl(
    registrationId: string,
    eventId: string,
  ): Promise<string> {
    const payload = JSON.stringify({ registrationId, eventId });
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });
  }

  // Full profile for a single registrant: the raw registration, form
  // responses relabeled using the event's formFields (so the admin sees
  // "What is the name of your church?" instead of a fieldId), and a QR
  // code for check-in scanning.
  async getRegistrationProfile(
    registrationId: string,
    churchId: string,
  ): Promise<{
    registration: IEventRegistration;
    formattedResponses: Record<string, any>;
    qrCode: string;
  } | null> {
    const registration = await eventRegistrationModel
      .findOne({ _id: registrationId, churchId })
      .lean();
    if (!registration) {
      return null;
    }

    const event = await eventModel.findOne({
      _id: registration.eventId,
      churchId,
    });

    const formattedResponses: Record<string, any> = {};
    if (event) {
      for (const field of event.formFields) {
        const value = registration.responses[field.fieldId];
        formattedResponses[field.label] = Array.isArray(value)
          ? value.join(", ")
          : (value ?? "");
      }
    }

    const qrCode = await this.generateQRCodeDataUrl(
      registration._id.toString(),
      registration.eventId.toString(),
    );

    return {
      registration: registration as IEventRegistration,
      formattedResponses,
      qrCode,
    };
  }

  // Just the QR code for a registration, as a raw PNG buffer — for
  // endpoints that want to serve `image/png` directly (printing, <img>
  // src) rather than embedding a data URL in JSON.
  async getRegistrationQRCodeBuffer(
    registrationId: string,
    churchId: string,
  ): Promise<Buffer | null> {
    const registration = await eventRegistrationModel
      .findOne({ _id: registrationId, churchId })
      .select("_id eventId")
      .lean();
    if (!registration) {
      return null;
    }
    const payload = JSON.stringify({
      registrationId: registration._id.toString(),
      eventId: registration.eventId.toString(),
    });
    return QRCode.toBuffer(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
    });
  }

  // Toggles check-in state for a registration — this is what the QR scan
  // action calls. First scan: "in". Next scan of the same person: "out".
  // And so on, alternating. Every scan is appended to checkInHistory so
  // admins can see a full in/out log, not just the current state.
  //
  // This is done as a single atomic findOneAndUpdate using an aggregation
  // pipeline, rather than read-then-modify-then-save. With read-then-save,
  // two near-simultaneous scans (two staff members, a slow network, a
  // double-tap) could both read checkedIn:false before either write lands,
  // and both would write "in" instead of alternating in/out. MongoDB
  // serializes concurrent updates to the same document, and each stage
  // here computes the new checkedIn/action/status from whatever the
  // CURRENTLY STORED value is at the moment that specific update actually
  // runs — not from a value read earlier in application code — so this
  // can't happen. (Requires MongoDB 4.2+ / Mongoose 5.10+ for pipeline
  // updates in findOneAndUpdate.)
  //
  // Eligibility is enforced in the same atomic step via the query filter:
  // only registrations with status "confirmed" or already "attended" can
  // be checked in. Cancelled or still-pending-approval registrations are
  // rejected rather than silently let through.
  async toggleCheckIn(
    registrationId: string,
    churchId: string,
  ): Promise<
    | { ok: true; registration: IEventRegistration; action: "in" | "out" }
    | { ok: false; reason: "not_found" | "cancelled" | "pending" }
  > {
    const registration = await eventRegistrationModel.findOneAndUpdate(
      {
        _id: registrationId,
        churchId,
        status: { $in: ["confirmed", "attended"] },
      },
      [
        {
          $set: {
            checkedIn: { $not: ["$checkedIn"] },
            // A person who has checked in at all has attended — keep this
            // set on both check-in and check-out so the existing `status`
            // field stays meaningful for admins who only look at that.
            status: "attended",
            checkInHistory: {
              $concatArrays: [
                "$checkInHistory",
                [
                  {
                    action: { $cond: ["$checkedIn", "out", "in"] },
                    timestamp: "$$NOW",
                  },
                ],
              ],
            },
          },
        },
      ],
      { new: true },
    );

    if (registration) {
      const action: "in" | "out" = registration.checkedIn ? "in" : "out";
      return { ok: true, registration, action };
    }

    // The filter didn't match — figure out why, for a precise error
    // message. This second read has a small race window of its own, but
    // it's only used for messaging, not for the check-in decision itself
    // (which already happened atomically above), so it doesn't reintroduce
    // the bug this method exists to fix.
    const existing = await eventRegistrationModel
      .findOne({ _id: registrationId, churchId })
      .select("status")
      .lean();

    if (!existing) {
      return { ok: false, reason: "not_found" };
    }
    if (existing.status === "cancelled") {
      return { ok: false, reason: "cancelled" };
    }
    return { ok: false, reason: "pending" };
  }

  // Update registration status
  async updateRegistrationStatus(
    registrationId: string,
    churchId: string,
    status: "pending" | "confirmed" | "cancelled" | "attended",
  ): Promise<IEventRegistration | null> {
    const registration = await eventRegistrationModel.findOneAndUpdate(
      { _id: registrationId, churchId },
      { $set: { status } },
      { new: true },
    );
    return registration;
  }
  // Bulk update registration status
  async bulkUpdateStatus(
    registrationIds: string[],
    churchId: string,
    status: "pending" | "confirmed" | "cancelled" | "attended",
  ): Promise<number> {
    const result = await eventRegistrationModel.updateMany(
      { _id: { $in: registrationIds }, churchId },
      { $set: { status } },
    );
    return result.modifiedCount;
  }
  // Delete registration
  async deleteRegistration(
    registrationId: string,
    churchId: string,
  ): Promise<boolean> {
    const registration = await eventRegistrationModel.findOne({
      _id: registrationId,
      churchId,
    });
    if (!registration) {
      return false;
    }
    await eventRegistrationModel.deleteOne({ _id: registrationId });
    // Update event registration count
    await eventModel.findByIdAndUpdate(registration.eventId, {
      $inc: { registrationCount: -1 },
    });
    return true;
  }
  // Get registration by email (and optionally name) for a given event.
  // When multiple registrants can share one email (allowMultipleRegistrations,
  // or the email+name duplicate policy), email alone no longer uniquely
  // identifies a person — pass `name` whenever you're checking on behalf of
  // a specific individual, not just "does this email have any registration".
  async getRegistrationByEmail(
    eventId: string,
    email: string,
    name?: string,
  ): Promise<IEventRegistration | null> {
    const query: any = {
      eventId,
      registrantEmail: email.toLowerCase(),
    };
    if (name) {
      query.registrantName = {
        $regex: `^${escapeRegExp(name.trim())}$`,
        $options: "i",
      };
    }
    const registration = await eventRegistrationModel.findOne(query).lean();
    return registration as IEventRegistration | null;
  }
  // Export registrations (get data for CSV export)
  async exportRegistrations(eventId: string, churchId: string): Promise<any[]> {
    const event = await eventModel.findOne({ _id: eventId, churchId });
    if (!event) {
      throw new Error("Event not found");
    }
    const registrations = await eventRegistrationModel
      .find({ eventId, churchId })
      .sort({ registeredAt: 1 })
      .lean();
    // Flatten responses for CSV export
    const exportData = registrations.map((reg) => {
      // Summarize check-in history into flat, CSV-friendly fields rather
      // than dumping the raw array — a spreadsheet column can't usefully
      // hold nested objects.
      const inEvents = reg.checkInHistory.filter((h) => h.action === "in");
      const lastEvent = reg.checkInHistory[reg.checkInHistory.length - 1];

      const flatData: any = {
        registrationId: reg._id,
        registrantName: reg.registrantName,
        registrantEmail: reg.registrantEmail,
        status: reg.status,
        registeredAt: reg.registeredAt,
        checkedIn: reg.checkedIn ? "Yes" : "No",
        totalCheckIns: inEvents.length,
        lastCheckInOutAction: lastEvent ? lastEvent.action : "",
        lastCheckInOutAt: lastEvent ? lastEvent.timestamp : "",
      };
      // Add all form field responses
      for (const field of event.formFields) {
        const value = reg.responses[field.fieldId];
        flatData[field.label] = Array.isArray(value)
          ? value.join(", ")
          : value || "";
      }
      return flatData;
    });
    return exportData;
  }
}

export default new EventRegistrationService();