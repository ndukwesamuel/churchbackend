// services/event.service.ts

import type { IEvent } from "./event.interface";
import type { IEventRegistration } from "./eventRegistration.interface";
import mongoose from "mongoose";
import eventModel from "./event.model";
import eventRegistrationModel from "./eventRegistration.model";

class EventService {
  //   // Create a new event
  async createEvent(eventData: Partial<IEvent>): Promise<IEvent> {
    const event = new eventModel(eventData);
    await event.save();
    return event;
  }
  // Get all events for a church
  async getEventsByChurch(
    churchId: string,
    filters?: {
      status?: "draft" | "open" | "closed";
      upcoming?: boolean;
    },
  ): Promise<IEvent[]> {
    const query: any = { churchId };
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.upcoming) {
      query.eventDate = { $gte: new Date() };
    }
    const events = await eventModel.find(query).sort({ eventDate: -1 }).lean();
    return events as IEvent[];
  }
  // Get single event by ID
  async getEventById(eventId: string): Promise<IEvent | null> {
    const event = await eventModel.findById(eventId).lean();
    return event as IEvent | null;
  }
  // Get public event (for registration page)
  async getPublicEvent(eventId: string): Promise<IEvent | null> {
    const event = await eventModel
      .findOne({
        _id: eventId,
        status: "open",
        isPublic: true,
      })
      .lean();
    return event as IEvent | null;
  }
  // Update event
  async updateEvent(
    eventId: string,
    churchId: string,
    updateData: Partial<IEvent>,
  ): Promise<IEvent | null> {
    const event = await eventModel.findOneAndUpdate(
      { _id: eventId, churchId },
      { $set: updateData },
      { new: true, runValidators: true },
    );
    return event;
  }
  // Delete event
  async deleteEvent(eventId: string, churchId: string): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Delete event
      const result = await eventModel
        .deleteOne({ _id: eventId, churchId })
        .session(session);
      // Delete all registrations for this event
      await eventRegistrationModel.deleteMany({ eventId }).session(session);
      await session.commitTransaction();
      return result.deletedCount > 0;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  //   // Update event status
  async updateEventStatus(
    eventId: string,
    churchId: string,
    status: "draft" | "open" | "closed",
  ): Promise<IEvent | null> {
    const event = await eventModel.findOneAndUpdate(
      { _id: eventId, churchId },
      { $set: { status } },
      { new: true },
    );
    return event;
  }
  // Get event statistics
  async getEventStats(eventId: string, churchId: string) {
    const event = await eventModel.findOne({ _id: eventId, churchId });
    if (!event) {
      return null;
    }
    const registrations = await eventRegistrationModel.find({ eventId });
    const stats = {
      totalRegistrations: registrations.length,
      confirmedRegistrations: registrations.filter(
        (r) => r.status === "confirmed",
      ).length,
      pendingRegistrations: registrations.filter((r) => r.status === "pending")
        .length,
      cancelledRegistrations: registrations.filter(
        (r) => r.status === "cancelled",
      ).length,
      attendedCount: registrations.filter((r) => r.status === "attended")
        .length,
      capacity: event.capacity,
      availableSpots: event.capacity
        ? event.capacity - registrations.length
        : null,
      isFull: event.capacity ? registrations.length >= event.capacity : false,
    };
    return stats;
  }
  // Duplicate event (create template)
  //   async duplicateEvent(
  //     eventId: string,
  //     churchId: string,
  //     newEventData: {
  //       eventName: string;
  //       eventDate: Date;
  //       eventEndDate?: Date;
  //     },
  //   ): Promise<IEvent> {
  //     const originalEvent = await Event.findOne({ _id: eventId, churchId });
  //     if (!originalEvent) {
  //       throw new Error("Event not found");
  //     }
  //     const duplicatedEvent = new Event({
  //       churchId: originalEvent.churchId,
  //       eventName: newEventData.eventName,
  //       description: originalEvent.description,
  //       eventDate: newEventData.eventDate,
  //       eventEndDate: newEventData.eventEndDate,
  //       location: originalEvent.location,
  //       capacity: originalEvent.capacity,
  //       status: "draft",
  //       formFields: originalEvent.formFields,
  //       allowMultipleRegistrations: originalEvent.allowMultipleRegistrations,
  //       requireApproval: originalEvent.requireApproval,
  //       isPublic: originalEvent.isPublic,
  //       createdBy: originalEvent.createdBy,
  //       registrationCount: 0,
  //     });
  //     await duplicatedEvent.save();
  //     return duplicatedEvent;
  //   }
}

export default new EventService();
