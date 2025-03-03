// /src/controllers/authController.js

import admin from "firebase-admin";
import { db } from "../config/firebase.js";

export const authenticateUser = async (req, res) => {
  try {
    const { token, role = "user", name = "New User" } = req.body;
    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Token required" });
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log(`💥 > authenticateUser > decodedToken--->`, decodedToken);
    const userId = decodedToken.uid;

    // Check if user exists in Firestore
    const userDoc = await db.collection("users").doc(userId).get();
    console.log(`💥 > authenticateUser > userDoc--->`, userDoc);

    if (!userDoc.exists) {
      const newUser = {
        name,
        email: decodedToken.email,
        role,
      };

      await admin.auth().setCustomUserClaims(userId, { role });
      await db.collection("users").doc(userId).set(newUser);

      return res.status(201).json({
        success: true,
        message: "User registered",
        userId,
        role,
        // token, // Return same Firebase token
      });
    }

    // Existing user (Login case)
    const userData = userDoc.data();
    return res.status(200).json({
      success: true,
      message: "Login successful",
      userId,
      role,
      // token,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user: userDoc.data() });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    await db.collection("users").doc(req.user.uid).update({ name });

    res.status(200).json({ success: true, message: "Profile updated" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};
