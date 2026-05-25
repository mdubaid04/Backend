import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Token Not Found");
    }
    const decoded = await jwt.verify(
      token,
      process.env.JWT_ACCESS_TOKEN_SECRET_KEY
    );
    console.log(decoded);
    if (!decoded) {
      throw new ApiError(401, "Token Is Not Valid");
    }
    const user = await User.findById(decoded?.userId).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "No User Found");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Token Is Invalid");
  }
});
export { verifyJwt };
