import express from "express";
import User from "../models/User.js";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Function to delete folder contents before removal
const deleteFolderRecursive = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
};

// ✅ API to Fetch All Transcripts as a ZIP file
router.get("/transcript", async (req, res) => {
  try {
    const users = await User.find({}, "name grades email");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }

    const archive = archiver("zip", { zlib: { level: 9 } }); // ✅ Compression
    res.attachment("transcripts.zip");
    archive.pipe(res);

    let completed = 0;
    const tempDir = path.join(__dirname, "../temp_transcripts");

    // Ensure temp directory exists and clean it up
    if (fs.existsSync(tempDir)) {
      deleteFolderRecursive(tempDir);
    }
    fs.mkdirSync(tempDir, { recursive: true });

    users.forEach((user) => {
      const filePath = path.join(tempDir, `${user.name.replace(/\s+/g, "_")}_transcript.pdf`);
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // ✅ Title
      doc.font("Helvetica-Bold").fontSize(24).fillColor("#2E3A59").text("Academic Transcript", { align: "center" });
      doc.moveDown(2);

      // ✅ Student Details
      doc.font("Helvetica").fontSize(16).text(`Name: ${user.name}`, { align: "left" });
      doc.text(`Email: ${user.email}`, { align: "left" });
      doc.moveDown(1);

      // ✅ Course Grades Table
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#0073e6").text("Grades", { align: "center" });
      doc.moveDown(1);

      const courses = [
        { code: "RELB151", title: "Christian Beliefs I", semester: "I" },
        { code: "RELB291", title: "Apocalyptic Literature", semester: "I" },
        { code: "RELB125", title: "Life and Teachings of Jesus", semester: "I" },
        { code: "RELB238", title: "Adventist Heritage", semester: "I" },
        { code: "EDUC131", title: "Philosophy of Education", semester: "I" },
        { code: "RELB152", title: "Christian Beliefs II", semester: "II" },
        { code: "FNCE451", title: "Church Stewardship & Finance", semester: "II" },
        { code: "RELB292", title: "Apocalyptic Literature", semester: "II" },
        { code: "RELB151_2", title: "Religions of the World", semester: "II" },
        { code: "HLED121", title: "Personal Health", semester: "II" },
      ];

      courses.forEach((course) => {
        doc.font("Helvetica-Bold").fontSize(14).fillColor("black").text(`${course.title} (${course.semester})`, { continued: true });
        doc.font("Helvetica").fontSize(14).text(` - Grade: ${user.grades?.[course.code] || "Not Assigned"}`);
      });

      doc.moveDown(2);
      doc.end();

      writeStream.on("finish", () => {
        archive.file(filePath, { name: `transcripts/${path.basename(filePath)}` });
        completed++;
        if (completed === users.length) {
          archive.finalize();
          archive.on("end", () => deleteFolderRecursive(tempDir)); // Cleanup only after finalization
        }
      });
    });
  } catch (error) {
    console.error("Error generating transcripts:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
