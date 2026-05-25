import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //for faster search and retrieval
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: false,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (t) {
  // console.log(typeof next);

  if (!this.isModified("password")) {
    return; // If the password is not modified, skip hashing and move to the next middleware  //in async function mongoose automatically handle promise and next() function, so we don't need to call next() explicitly. If we return from the function, it will automatically proceed to the next middleware or save the document.
  }
  this.password = await bcrypt.hash(this.password, 10);
  // Call the next middleware or save the document
});
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password); // Compare the provided password with the hashed password stored in the database and return true if they match, otherwise return false
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      username: this.username,
      email: this.email,
      fullname: this.fullname,
    },
    process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
    {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || "1d",
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      username: this.username,
    },
    process.env.JWT_REFRESH_TOKEN_SECRET_KEY,
    {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || "10d",
    }
  );
};

const User = mongoose.model("User", userSchema);

export default User;
