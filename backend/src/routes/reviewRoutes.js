import express from "express";
import { createReview, getMentorReviews } from "../controllers/reviewController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createReview);
router.get("/mentor/:mentorId", getMentorReviews);

export default router;
