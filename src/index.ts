import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

const corsOption = {
  origin: "*",
};
app.use(cors(corsOption));
app.use(cookieParser());
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

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 2, // 2 MB limit
  },
});

if (!fs.existsSync(path.join(__dirname, "..", "uploads"))) {
  console.log("Uploads directory does not exist, creating it...");
  fs.mkdirSync(path.join(__dirname, "..", "uploads"));
  console.log("Created the uploads folder.");
} else {
  console.log("Uploads directory exists.");
}

app.post("/login", async (req, res): Promise<any> => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin") {
    console.log("verify");
    const userId = "abc123";

    const accesstoken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: "15min",
    });
    console.log("accesstoken", accesstoken);

    const refreshtoken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: "2d",
    });
    console.log(accesstoken, refreshtoken);

    res.cookie("refresh_token", refreshtoken, {
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("accesstoken", accesstoken);

    return res
      .status(200)
      .json({ message: "Login Success", token: accesstoken });
  } else {
    return res.status(401).json({ message: "Login Failed" });
  }
});

app.post("/refresh-token", async (req, res): Promise<any> => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const decoded: any = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    );

    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET!,
      {
        expiresIn: "15min",
      }
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: "2d",
      }
    );

    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 2 * 24 * 60 * 60 * 1000, // Refresh token expires in 2 days
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Error verifying refresh token:", err);
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
});

app.post("/upload", (req, res): any => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: `${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    return res.json({
      message: "File uploaded successfully!",
      file: req.file,
    });
  });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
