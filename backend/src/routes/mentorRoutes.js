import express from "express";
import {
  applyMentor, getMentorProfile, updateMentorProfile,
  addService, updateService, deleteService, getMentorServices,
  setAvailability, getAvailability,
  getMentors, getMentorDetails, getMentorDashboard
} from "../controllers/mentorController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public Routes (Explore & Discover)
router.get("/explore", getMentors);
router.get("/:id", getMentorDetails);
router.get("/:id/services", getMentorServices);
router.get("/:mentorId/availability", getAvailability);

// Protected Routes (Mentor Onboarding & Profile)
router.post("/apply", protect, applyMentor);
router.get("/me/profile", protect, getMentorProfile);
router.put("/me/profile", protect, updateMentorProfile);
router.get("/me/dashboard", protect, getMentorDashboard);

// Protected Routes (Services & Availability)
router.post("/services", protect, addService);
router.put("/services/:serviceId", protect, updateService);
router.delete("/services/:serviceId", protect, deleteService);
router.put("/availability", protect, setAvailability);

export default router;
