import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const videoSchema = new Schema(
  {
    videofile: {
      type: String,
      required: true, //url from cloudinary
    },
    thumbnail: {
      type: String,
      required: true, //url from cloudinary
    },
    title: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, //from cloudinary response
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", videoSchema);
videoSchema.plugin(mongoosePaginate);
export default Video;
