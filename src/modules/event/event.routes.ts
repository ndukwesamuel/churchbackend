// routes/event.routes.ts
import express from "express";
import eventController from "./event.controller";
import { isAuth } from "../../middleware/auth";
import methodNotAllowed from "../../middleware/methodNotAllowed";
import eventRegistrationController from "./eventRegistration.controller";
import eventGroupController from "./eventGroup.controller";
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

  router
  .route("/bulk-upload/:eventId")
  .post(isAuth,eventRegistrationController.bulkUploadRegistrations)
  .all(methodNotAllowed);



  

router.get(
  "/public/check/:eventId",
  eventRegistrationController.checkRegistration,
);

// TEMPORARY — no auth, hardcoded to one event. Requested 2026-08-24 for a
// one-off frontend test; remove by end of September 2026.
router.get(
  "/public-test/everyone",
  eventRegistrationController.getPublicTestRegistrations,
);

router.post(
  "/public-test/registration/:registrationId/checkin",
  eventRegistrationController.checkInRegistrationPublicTest,
);

router.get(
  "/registration/:registrationId",
  isAuth,
  eventRegistrationController.getRegistration,
);

// Full profile (registration + relabeled responses + QR code data URL)
router.get(
  "/registration/:registrationId/profile",
  isAuth,
  eventRegistrationController.getRegistrationProfile,
);

// Raw QR code image (image/png) — for printing/embedding directly
router.get(
  "/registration/:registrationId/qrcode",
  isAuth,
  eventRegistrationController.getRegistrationQRCode,
);

// Scan action — toggles check-in / check-out
router.post(
  "/registration/:registrationId/checkin",
  isAuth,
  eventRegistrationController.checkInRegistration,
);

// Groups — admin creates the number of groups they want, then manually
// assigns registrants to one of them.
router
  .route("/:eventId/groups")
  .get(isAuth, eventGroupController.getEventGroups)
  .post(isAuth, eventGroupController.createGroup)
  .all(methodNotAllowed);

router.post("/:eventId/groups/bulk", isAuth, eventGroupController.createGroups);

// Route 1: all groups for an event, each with its full member list
router.get(
  "/:eventId/groups/members",
  isAuth,
  eventGroupController.getGroupsWithMembers,
);

router
  .route("/groups/:groupId")
  .patch(isAuth, eventGroupController.renameGroup)
  .delete(isAuth, eventGroupController.deleteGroup)
  .all(methodNotAllowed);

// Route 2: upload a spreadsheet of names (First Name/Surname or Name),
// match them against this event's registrants, and assign matches to
// this group. Conflicts (already in a different group) are reported, not
// overwritten.
router.post(
  "/groups/:groupId/bulk-assign",
  isAuth,
  eventGroupController.bulkAssignToGroup,
);

router.patch(
  "/registration/:registrationId/group",
  isAuth,
  eventGroupController.assignToGroup,
);

export default router;
