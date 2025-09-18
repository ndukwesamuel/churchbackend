import express from "express";
import { GroupController } from "./group.controller";
import methodNotAllowed from "../../middleware/methodNotAllowed";
import { GroupSchema } from "./group.schema";
import { validateBody } from "../../middleware/validateSchema";
const router = express.Router();

router
  .route("/")
  .post(
    validateBody(GroupSchema.createGroupSchema),
    GroupController.createGroup
  )
  .get(GroupController.getGroups)
  .all(methodNotAllowed);

router
  .route("/:groupId")
  .get(GroupController.getGroupById)
  .patch(
    validateBody(GroupSchema.updateGroupSchema),
    GroupController.updateGroup
  )
  .delete(GroupController.deleteGroup)
  .all(methodNotAllowed);

export default router;
