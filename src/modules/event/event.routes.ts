// routes/event.routes.ts
import express from "express";
import eventController from "./event.controller";
import { isAuth } from "../../middleware/auth";
import methodNotAllowed from "../../middleware/methodNotAllowed";
import eventRegistrationController from "./eventRegistration.controller";
// import eventController from "../controllers/event.controller";

const router = express.Router();

router
  .route("/")
  .post(isAuth, eventController.createEvent)
  .get(isAuth, eventController.getChurchEvents)
  .all(methodNotAllowed);

router
  .route("/:eventId")
  .get(isAuth, eventController.getEvent)
  .post(isAuth, eventController.updateEvent)
  .delete(isAuth, eventController.deleteEvent)
  .all(methodNotAllowed);

router.patch("/:eventId/status", isAuth, eventController.updateEventStatus);

// Protected routes (admin only)
router.get(
  "/registrations/:eventId",
  isAuth,
  eventRegistrationController.getEventRegistrations,
);

router.get("/:eventId/stats", isAuth, eventController.getEventStats);
// router.post(
//   "/:eventId/duplicate",
//   authMiddleware,
//   eventController.duplicateEvent,
// );

// // Public route (no auth)

router.patch(
  "/registration/:registrationId/status",
  isAuth,
  eventRegistrationController.updateRegistrationStatus,
);

router.patch(
  "/registrations/bulk-status",
  isAuth,
  eventRegistrationController.bulkUpdateStatus,
);

router.get(
  "/:eventId/export",
  isAuth,
  eventRegistrationController.exportRegistrations,
);
router.delete(
  "/registration/:registrationId",
  isAuth,
  eventRegistrationController.deleteRegistration,
);

router
  .route("/public/:eventId")
  .get(eventController.getPublicEvent)
  .post(eventRegistrationController.registerForEvent)
  .all(methodNotAllowed);

router.get(
  "/public/check/:eventId",
  eventRegistrationController.checkRegistration,
);

router.get(
  "/registration/:registrationId",
  isAuth,
  eventRegistrationController.getRegistration,
);

export default router;
