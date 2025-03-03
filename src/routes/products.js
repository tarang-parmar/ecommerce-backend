// /src/routes/products.js

import express from "express";
import {
  getAllProducts,
  getProductById,
  addProduct,
  editProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getAllProducts); // Public: Get all products (with filtering)
router.get("/:id", getProductById); // Public: Get a single product

// router.post("/", addProduct); // Admin only: Add a product
// router.put("/:id", editProduct); // Admin only: Edit a product
// router.delete("/:id", deleteProduct); // Admin only: Delete a product
router.post("/", verifyFirebaseToken, addProduct); // Admin only: Add a product
router.put("/:id", verifyFirebaseToken, editProduct); // Admin only: Edit a product
router.delete("/:id", verifyFirebaseToken, deleteProduct); // Admin only: Delete a product

export default router;
