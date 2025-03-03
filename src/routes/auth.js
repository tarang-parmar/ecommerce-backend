// /src/routes/auth.js

import express from "express";
import {
  authenticateUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/authController.js";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Single route for signup & login (handles Google and Email/Password login)
router.post("/", authenticateUser);

// User profile routes
router.get("/profile", verifyFirebaseToken, getUserProfile);
router.put("/profile", verifyFirebaseToken, updateUserProfile);

export default router;
