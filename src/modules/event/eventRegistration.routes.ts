// routes/eventRegistration.routes.ts
import express from "express";
import eventRegistrationController from "../controllers/eventRegistration.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { optionalAuthMiddleware } from "../middleware/auth.middleware"; // optional auth

const router = express.Router();

// Public check registration

// // Protected routes (admin only)
// router.get(
//   "/:eventId/registrations",
//   authMiddleware,
//   eventRegistrationController.getEventRegistrations,
// );

router.get(
  "/registration/:registrationId",
  authMiddleware,
  eventRegistrationController.getRegistration,
);

router.patch(
  "/registration/:registrationId/status",
  authMiddleware,
  eventRegistrationController.updateRegistrationStatus,
);

router.patch(
  "/registrations/bulk-status",
  authMiddleware,
  eventRegistrationController.bulkUpdateStatus,
);

router.delete(
  "/registration/:registrationId",
  authMiddleware,
  eventRegistrationController.deleteRegistration,
);

router.get(
  "/:eventId/export",
  authMiddleware,
  eventRegistrationController.exportRegistrations,
);

export default router;
