// /src/routes/orders.js

import express from "express";
import {
  checkout,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/checkout", checkout);
router.get("/", getOrders);
router.put("/update-status", updateOrderStatus);

export default router;
