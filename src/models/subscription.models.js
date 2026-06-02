import mongoose, { Schema } from "mongoose";
import User from "./user.models";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      // Users who subscribe to the channel
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      //User whose channel is being subscribed to
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
