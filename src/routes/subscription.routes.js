import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  toggleSubscription,
  getSubscribersDetails,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";

const router = Router();

router
  .route("/toggle-subscribe/:channelId")
  .post(verifyJwt, toggleSubscription);
router.route("/subscribers/:channelId").get(verifyJwt, getSubscribersDetails);
router
  .route("/subscribed-channels/:channelId")
  .get(verifyJwt, getSubscribedChannels);

export default router;
