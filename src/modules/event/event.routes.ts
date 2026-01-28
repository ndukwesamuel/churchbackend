// routes/event.routes.ts
import express from "express";
import eventController from "./event.controller";
import { isAuth } from "../../middleware/auth";
import methodNotAllowed from "../../middleware/methodNotAllowed";
import eventRegistrationController from "./eventRegistration.controller";
// import eventController from "../controllers/event.controller";

const router = express.Router();

// Protected routes (require authentication)
// router.post("/", isAuth, eventController.createEvent);
router
  .route("/")
  .post(isAuth, eventController.createEvent)
  .get(isAuth, eventController.getChurchEvents)
  .all(methodNotAllowed);

router
  .route("/:eventId")
  .get(isAuth, eventController.getEvent)
  .post(isAuth, eventController.updateEvent)
  .all(methodNotAllowed);

router.patch("/:eventId/status", isAuth, eventController.updateEventStatus);

// Protected routes (admin only)
router.get(
  "/registrations/:eventId",
  isAuth,
  eventRegistrationController.getEventRegistrations,
);

// router.post("/:eventId", isAuth, eventController.updateEvent);
// router.delete("/:eventId", authMiddleware, eventController.deleteEvent);

router.get("/:eventId/stats", isAuth, eventController.getEventStats);
// router.post(
//   "/:eventId/duplicate",
//   authMiddleware,
//   eventController.duplicateEvent,
// );

// // Public route (no auth)

router
  .route("/public/:eventId")
  .get(eventController.getPublicEvent)
  .post(eventRegistrationController.registerForEvent)
  .all(methodNotAllowed);

router.get(
  "/public/check/:eventId",
  eventRegistrationController.checkRegistration,
);

// // Public registration endpoint
// router.post(
//   "/:eventId/register",
//   optionalAuthMiddleware, // optional - captures user if logged in
//   eventRegistrationController.registerForEvent,
// );
export default router;
