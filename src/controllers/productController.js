// /src/controllers/productController.js

import { db, admin } from "../config/firebase.js";
import { cleanObject } from "../utils/cleanObject.js";

// ✅ Fetch all products (with filtering)
export const getAllProducts = async (req, res) => {
  try {
    let query = db.collection("products");
    const { category, minPrice, maxPrice } = req.query;

    console.log(`💥 > getAllProducts > minPrice:`, minPrice);
    console.log(`💥 > getAllProducts > category:`, category);
    console.log(`💥 > getAllProducts > maxPrice:`, maxPrice);

    // Convert minPrice and maxPrice to numbers
    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;

    if (category) {
      query = query.where("category", "==", category.toLowerCase());
    }
    if (min !== null && max !== null) {
      // Firestore doesn't allow two different range filters unless indexed.
      query = query.where("price", ">=", min).where("price", "<=", max);
    } else if (min !== null) {
      query = query.where("price", ">=", min);
    } else if (max !== null) {
      query = query.where("price", "<=", max);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log("❌ No products found matching the criteria.");
      return res.status(200).json([]);
    }

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Found ${products.length} products`, products);
    res.status(200).json(products);
  } catch (error) {
    console.error("🔥 Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// ✅ Fetch a single product
export const getProductById = async (req, res) => {
  try {
    const product = await db.collection("products").doc(req.params.id).get();
    if (!product.exists)
      return res.status(404).json({ error: "Product not found" });

    res.status(200).json(product.data());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

// ✅ Middleware: Check if user is an Admin
const isAdmin = async (uid) => {
  const user = await admin.auth().getUser(uid);
  return user.customClaims?.role == "admin";
};

// ✅ Add a new product (Admin only)
export const addProduct = async (req, res) => {
  try {
    if (!(await isAdmin(req?.user?.uid || "wJuKgXIcYIQ691eyM8bfLU8UNep2"))) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const productData = cleanObject(req.body); // ✅ Clean input data

    if (Object.keys(productData).length === 0) {
      return res.status(400).json({ error: "No valid product data provided." });
    }

    const newProductRef = db.collection("products").doc();
    await newProductRef.set(productData);

    res
      .status(201)
      .json({ message: "Product added successfully", product: productData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Edit a product (Admin only)
export const editProduct = async (req, res) => {
  try {
    if (!(await isAdmin(req?.user?.uid || "wJuKgXIcYIQ691eyM8bfLU8UNep2"))) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const productId = req.params.id;
    const productRef = db.collection("products").doc(productId);
    const productSnapshot = await productRef.get();

    if (!productSnapshot.exists) {
      return res.status(404).json({ error: "Product not found." });
    }

    const updatedProduct = cleanObject(req.body); // ✅ Clean input data

    if (Object.keys(updatedProduct).length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    await productRef.update(updatedProduct);
    res.json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete a product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    if (!(await isAdmin(req.user.uid))) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    await db.collection("products").doc(req.params.id).delete();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
};
