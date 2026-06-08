import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videofile: {
      type: String,
      required: true, //url from cloudinary
    },
    videoPublicId: {
      type: String,
      required: true, //publicId from cloudinary for deletion
    },
    thumbnail: {
      type: String,
      required: true, //url from cloudinary
    },
    thumbnailPublicId: {
      type: String,
      required: true, //publicId from cloudinary for deletion
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
videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model("Video", videoSchema);

export default Video;
