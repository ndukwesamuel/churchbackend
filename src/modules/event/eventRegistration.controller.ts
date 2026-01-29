// controllers/eventRegistration.controller.ts
import type { Request, Response } from "express";
import eventRegistrationService from "./eventRegistration.service";
// import eventRegistrationService from "../services/eventRegistration.service";

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

      const { status, search } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (search) filters.search = search as string;

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
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const registration =
        await eventRegistrationService.getRegistrationByEmail(
          eventId,
          email as string,
        );

      res.status(200).json({
        success: true,
        data: {
          isRegistered: !!registration,
          registration: registration || null,
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
}

export default new EventRegistrationController();
