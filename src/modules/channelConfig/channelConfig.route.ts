import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { validateBody } from "../../middleware/validateSchema.js";
import { ChannelConfigController } from "./channelConfig.controller.js";
import { channelConfigSchema } from "./channelConfig.schema.js";
const router = express.Router();

router
  .route("/")
  .post(
    validateBody(channelConfigSchema.createChannelConfigSchema),
    ChannelConfigController.createChannelConfig
  )
  .get(ChannelConfigController.createChannelConfig)
  .all(methodNotAllowed);

router
  .route("/:id")
  .patch(
    validateBody(channelConfigSchema.createChannelConfigSchema),
    ChannelConfigController.updateChannelConfig
  )
  .all(methodNotAllowed);

export default router;
