import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import dotenv from "dotenv";
import { exportUsersToCSV } from "../controllers/userController.js";


dotenv.config();
const router = express.Router();

// 🔹 Ensure "uploads/" directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // ✅ Creates "uploads/" if not present
}

// 🔹 Multer Configuration for File Upload (Payment Screenshot)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

const generateRegistrationNumber = async () => {
  const yearPrefix = new Date().getFullYear().toString().slice(2); // "25" for 2025

  // Find the last user whose reg number starts with the current year
  const lastUser = await User.findOne({ registrationNumber: { $regex: `^${yearPrefix}E` } })
    .sort({ registrationNumber: -1 });

  if (!lastUser || !lastUser.registrationNumber) {
    return `${yearPrefix}E001`;
  }

  const lastNumber = parseInt(lastUser.registrationNumber.slice(3), 10); // After '25E'
  const nextNumber = String(lastNumber + 1).padStart(3, "0");

  return `${yearPrefix}E${nextNumber}`;
};

// ✅ User Registration Route
router.post("/register", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const {
      registrationType,
      name,
      email,
      password,
      dateOfBirth, // ✅ Added Date of Birth
      basisOfAdmission, // ✅ Added Basis of Admission
      collegeAttended, // ✅ Added College Attended
      gender,
      maritalStatus,
      motherTongue,
      isAdventist,
      union,
      sectionRegionConference,
      address,
      phoneNumber,
    } = req.body;


    // ✅ Check if required fields are missing
    if (
      !name ||
      !email ||
      !password ||
      !dateOfBirth ||
      !basisOfAdmission ||
      !collegeAttended ||
      !gender ||
      !maritalStatus ||
      !motherTongue ||
      !isAdventist ||
      !phoneNumber
    ) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    // ✅ Check if the user already exists (Email Uniqueness Check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered. Please log in or use a different email." });
    }

    // ✅ Generate Registration Number
    const registrationNumber = await generateRegistrationNumber();

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Store File URL
    const paymentScreenshot = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ Create New User Object
    const newUser = new User({
      registrationNumber, // ✅ Assign Generated Registration Number
      registrationType,
      name,
      email,
      password: hashedPassword,
      dateOfBirth,
      basisOfAdmission,
      collegeAttended,
      gender,
      maritalStatus,
      motherTongue,
      isAdventist,
      union,
      sectionRegionConference,
      address,
      phoneNumber,
      paymentScreenshot,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully!", registrationNumber });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// ✅ User Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful!", token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Fetch User Profile for Dashboard
router.get("/profileData/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // ✅ Find User by ID
    const user = await User.findById(userId).select("-password"); // Exclude password for security

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


router.get("/export/csv", exportUsersToCSV);

export default router;
