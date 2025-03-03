// /src/routes/cart.js

import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controllers/cartController.js";

const router = express.Router();

router.post("/", addToCart);
router.get("/", getCart);
router.delete("/", removeFromCart);

export default router;
