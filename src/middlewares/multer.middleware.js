import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); //null means no error and "./public/temp" is the destination folder where the uploaded files will be stored temporarily before being uploaded to Cloudinary
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage }); //instance of multer function when its called it will return a middleware function that we can use in our routes to handle file uploads
// upload.single("file") // this will handle single file upload with the field name "file" in the form data
// upload.array("files", 10) // this will handle multiple file uploads with the field name "files" in the form data and limit the number of files to 10
// we can also use upload.fields([{ name: "file1", maxCount: 1 }, { name: "file2", maxCount: 1 }]) to handle multiple file uploads with different field names in the form data

export default upload;
