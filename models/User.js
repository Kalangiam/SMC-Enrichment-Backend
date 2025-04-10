import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  grade: { type: String, default: "F" },
  pts: { type: Number, default: 0.0 },
  creditHours: { type: Number, required: true },
});

const userSchema = new mongoose.Schema({
  registrationNumber: { type: String, unique: true },

  // ✅ Mandatory Fields
  registrationType: { type: String, required: true, enum: ["NEW", "OLD"] }, 
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  dateOfBirth: { type: String, required: true }, // ✅ Date of Birth
  basisOfAdmission: { type: String, required: true }, // ✅ Basis of Admission
  collegeAttended: { type: String, required: true }, // ✅ College Attended
  gender: { type: String, required: true, enum: ["Male", "Female", "Others"] }, 
  maritalStatus: { type: String, required: true, enum: ["Married", "Unmarried"] }, 
  motherTongue: { type: String, required: true },
  isAdventist: { type: String, required: true, enum: ["Yes", "No"] }, 
  phoneNumber: { type: String, required: true },

  // ✅ Optional Fields
  union: { type: String },
  sectionRegionConference: { type: String },
  address: { type: String },

  // ✅ Payment Screenshot (File URL)
  paymentScreenshot: { type: String, required: true }, 

  // ✅ Academic Grades
  grades: {
    RELB151: { type: courseSchema, default: { creditHours: 2 } },
    RELB291: { type: courseSchema, default: { creditHours: 2 } },
    RELB125: { type: courseSchema, default: { creditHours: 3 } },
    RELB238: { type: courseSchema, default: { creditHours: 3 } },
    EDUC131: { type: courseSchema, default: { creditHours: 2 } },
    RELB152: { type: courseSchema, default: { creditHours: 3 } },
    FNCE451: { type: courseSchema, default: { creditHours: 3 } },
    RELB292: { type: courseSchema, default: { creditHours: 2 } },
    RELB151_2: { type: courseSchema, default: { creditHours: 2 } },
    HLED121: { type: courseSchema, default: { creditHours: 2 } },
  },

  // ✅ Cumulative GPA
  cumulativeGPA: { type: Number, default: 0, min: 0, max: 4.0 },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
