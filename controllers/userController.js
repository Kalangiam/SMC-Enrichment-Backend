import User from "../models/User.js";
import pkg from "json2csv";
const { Parser } = pkg;

export const exportUsersToCSV = async (req, res) => {
  try {
    const users = await User.find({});

    const plainUsers = users.map((user) => ({
      registrationNumber: user.registrationNumber,
      registrationType: user.registrationType,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      maritalStatus: user.maritalStatus,
      motherTongue: user.motherTongue,
      isAdventist: user.isAdventist,
      dateOfBirth: user.dateOfBirth,
      basisOfAdmission: user.basisOfAdmission,
      collegeAttended: user.collegeAttended,
      union: user.union,
      sectionRegionConference: user.sectionRegionConference,
      address: user.address,
      cumulativeGPA: user.cumulativeGPA,
    }));

    const parser = new Parser();
    const csv = parser.parse(plainUsers);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=students.csv");
    res.status(200).end(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to export users to CSV." });
  }
};
