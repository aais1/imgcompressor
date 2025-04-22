import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";

const app = express();
const corsOption = {
  origin: "*",
};
app.use(cors(corsOption));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "..", "uploads");
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

if (!fs.existsSync(path.join(__dirname, "..", "uploads"))) {
  console.log("Uploads directory does not exist, creating it...");
  fs.mkdirSync(path.join(__dirname, "..", "uploads"));
  console.log("Created the uploads folder.");
} else {
  console.log("Uploads directory exists.");
}

app.post("/upload", upload.single("image"), (req, res) => {
  res.json({
    message: "File uploaded successfully!",
    file: req.file,
  });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
