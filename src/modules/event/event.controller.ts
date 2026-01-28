// controllers/event.controller.ts
// import eventService from "../services/event.service";
// import eventRegistrationService from "../eventRegistration.service";
import type { Request, Response } from "express";
import eventService from "./event.service";

class EventController {
  // Create event
  async createEvent(req: Request, res: Response) {
    try {
      // const churchId = req.user?.churchId; // from auth middleware
      const { userId }: any = req.user;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const eventData = {
        ...req.body,
        churchId: userId,
        createdBy: userId,
      };

      const event = await eventService.createEvent(eventData);

      res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: event,
      });
    } catch (error: any) {
      console.error("Create event error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create event",
      });
    }
  }

  // // Get all events for church
  async getChurchEvents(req: Request, res: Response) {
    try {
      const { userId }: any = req.user;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { status, upcoming } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (upcoming === "true") filters.upcoming = true;

      const events = await eventService.getEventsByChurch(userId, filters);

      res.status(200).json({
        success: true,
        count: events.length,

        data: events,
      });
    } catch (error: any) {
      console.error("Get events error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch events",
      });
    }
  }

  // // Get single event
  async getEvent(req: Request, res: Response) {
    try {
      const { eventId } = req.params;

      const { userId }: any = req.user;

      const event = await eventService.getEventById(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check if user has access to this event
      if (event.churchId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error: any) {
      console.error("Get event error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch event",
      });
    }
  }

  // // Get public event (no auth required)
  async getPublicEvent(req: Request, res: Response) {
    try {
      const { eventId } = req.params;

      const event = await eventService.getPublicEvent(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found or registration closed",
        });
      }

      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error: any) {
      console.error("Get public event error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch event",
      });
    }
  }

  // Update event
  async updateEvent(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const event = await eventService.updateEvent(eventId, churchId, req.body);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Event updated successfully",
        data: event,
      });
    } catch (error: any) {
      console.error("Update event error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update event",
      });
    }
  }

  // // Delete event
  // async deleteEvent(req: Request, res: Response) {
  //   try {
  //     const { eventId } = req.params;
  //     const churchId = req.user?.churchId;

  //     if (!churchId) {
  //       return res.status(401).json({
  //         success: false,
  //         message: "Unauthorized",
  //       });
  //     }

  //     const deleted = await eventService.deleteEvent(eventId, churchId);

  //     if (!deleted) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "Event not found",
  //       });
  //     }

  //     res.status(200).json({
  //       success: true,
  //       message: "Event deleted successfully",
  //     });
  //   } catch (error: any) {
  //     console.error("Delete event error:", error);
  //     res.status(500).json({
  //       success: false,
  //       message: error.message || "Failed to delete event",
  //     });
  //   }
  // }

  // Update event status
  async updateEventStatus(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const { status } = req.body;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!["draft", "open", "closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      const event = await eventService.updateEventStatus(
        eventId,
        churchId,
        status,
      );

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      res.status(200).json({
        success: true,
        message: `Event ${status} successfully`,
        data: event,
      });
    } catch (error: any) {
      console.error("Update event status error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update event status",
      });
    }
  }

  // Get event statistics
  async getEventStats(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const churchId = req.user?.userId;

      if (!churchId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const stats = await eventService.getEventStats(eventId, churchId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("Get event stats error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch event statistics",
      });
    }
  }

  // // Duplicate event
  // async duplicateEvent(req: Request, res: Response) {
  //   try {
  //     const { eventId } = req.params;
  //     const { eventName, eventDate, eventEndDate } = req.body;
  //     const churchId = req.user?.churchId;

  //     if (!churchId) {
  //       return res.status(401).json({
  //         success: false,
  //         message: "Unauthorized",
  //       });
  //     }

  //     if (!eventName || !eventDate) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Event name and date are required",
  //       });
  //     }

  //     const newEvent = await eventService.duplicateEvent(eventId, churchId, {
  //       eventName,
  //       eventDate: new Date(eventDate),
  //       eventEndDate: eventEndDate ? new Date(eventEndDate) : undefined,
  //     });

  //     res.status(201).json({
  //       success: true,
  //       message: "Event duplicated successfully",
  //       data: newEvent,
  //     });
  //   } catch (error: any) {
  //     console.error("Duplicate event error:", error);
  //     res.status(400).json({
  //       success: false,
  //       message: error.message || "Failed to duplicate event",
  //     });
  //   }
  // }
}

export default new EventController();
