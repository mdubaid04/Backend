import dotenv from "dotenv";
import db_connection from "./db/db.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});
db_connection()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running on Port: ${process.env.PORT}`);
    });
  })
  .catch(() => {
    app.on("error", () => {
      console.log("DB_CONNECTION Failed: ", error);
    });
  });
