// /src/index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.js";
import productRoutes from "./src/routes/products.js";
import cartRoutes from "./src/routes/cart.js";
import orderRoutes from "./src/routes/orders.js";
import { verifyFirebaseToken } from "./src/middlewares/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Health Check Route (Check if server is running)
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

// Routes
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/cart", verifyFirebaseToken, cartRoutes);
app.use("/orders", verifyFirebaseToken, orderRoutes);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});
