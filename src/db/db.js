import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const db_connection = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`
    );
    console.log(
      `Mongo_DB connected:: DB_HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("Mongo_DB connection Failed: ", error);
    process.exit(1);
  }
};
export default db_connection;
