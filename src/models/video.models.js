import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Like } from "./like.models.js";
import { Comment } from "./comment.models.js";

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
videoSchema.pre("findByIdAndDelete", async function () {
  await Like.deleteMany({ video: this._id });
  await Comment.deleteMany({ video: this._id });
});
videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model("Video", videoSchema);

export default Video;
