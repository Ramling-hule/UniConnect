import express from "express";
import {
  applyMentor, getMentorProfile, updateMentorProfile,
  createService, updateService, deleteService, getMentorServices,
  updateAvailability, getAvailability,
  getMentors, getMentorDetails, getMentorDashboard
} from "../controllers/mentorController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public Routes (Explore & Discover)
router.get("/explore", getMentors);
router.get("/:id", getMentorDetails);
router.get("/:id/services", getMentorServices);
router.get("/:id/availability", getAvailability);

// Protected Routes (Mentor Onboarding & Profile)
router.post("/apply", protect, applyMentor);
router.get("/me/profile", protect, getMentorProfile);
router.put("/me/profile", protect, updateMentorProfile);
router.get("/me/dashboard", protect, getMentorDashboard);

// Protected Routes (Services & Availability)
router.post("/services", protect, createService);
router.put("/services/:id", protect, updateService);
router.delete("/services/:id", protect, deleteService);
router.put("/availability", protect, updateAvailability);

export default router;
