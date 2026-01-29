// services/eventRegistration.service.ts
import type { IEventRegistration } from "./eventRegistration.interface"; //"../models/eventRegistration.interface";
import type { IFormField } from "./event.interface"; //"../models/event.interface";
import eventModel from "./event.model";
import eventRegistrationModel from "./eventRegistration.model";

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
      const existingRegistration = await eventRegistrationModel.findOne({
        eventId,
        registrantEmail: registrantEmail.toLowerCase(),
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
    },
  ): Promise<IEventRegistration[]> {
    const query: any = { eventId, churchId };
    if (filters?.status) {
      query.status = filters.status;
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
  // Get registration by email and event
  async getRegistrationByEmail(
    eventId: string,
    email: string,
  ): Promise<IEventRegistration | null> {
    const registration = await eventRegistrationModel
      .findOne({
        eventId,
        registrantEmail: email.toLowerCase(),
      })
      .lean();
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
      const flatData: any = {
        registrationId: reg._id,
        registrantName: reg.registrantName,
        registrantEmail: reg.registrantEmail,
        status: reg.status,
        registeredAt: reg.registeredAt,
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
