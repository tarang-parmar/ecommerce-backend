// /src/controllers/cartController.js

import { db } from "../config/firebase.js";

// ✅ Add product to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.uid; // Authenticated user's ID

    if (!productId || quantity <= 0) {
      return res.status(400).json({ error: "Invalid product or quantity" });
    }

    const cartRef = db.collection("carts").doc(userId);
    const cartSnapshot = await cartRef.get();

    let cartData = cartSnapshot.exists ? cartSnapshot.data() : { items: [] };

    // Check if the product already exists in the cart
    const existingProductIndex = cartData.items.findIndex(
      (item) => item.productId === productId
    );

    if (existingProductIndex !== -1) {
      // Update quantity if product exists
      cartData.items[existingProductIndex].quantity += quantity;
    } else {
      // Add new product
      cartData.items.push({ productId, quantity });
    }

    await cartRef.set(cartData, { merge: true });
    res.status(200).json({ message: "Product added to cart", cart: cartData });
  } catch (error) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

// ✅ Get user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.uid;
    const cartSnapshot = await db.collection("carts").doc(userId).get();

    res
      .status(200)
      .json(cartSnapshot.exists ? cartSnapshot.data() : { items: [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

// ✅ Remove product from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.uid;

    const cartRef = db.collection("carts").doc(userId);
    const cartSnapshot = await cartRef.get();

    if (!cartSnapshot.exists) {
      return res.status(404).json({ error: "Cart not found" });
    }

    let cartData = cartSnapshot.data();

    // Find index of the product to remove
    const itemIndex = cartData.items.findIndex(
      (item) => item.productId === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    // Remove the product at the found index
    cartData.items.splice(itemIndex, 1);

    // Update only the `items` field in Firestore
    await cartRef.update({ items: cartData.items });

    res
      .status(200)
      .json({ message: "Product removed from cart", cart: cartData });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove product from cart" });
  }
};
