// /src/controllers/cartController.js

import { db } from "../config/firebase.js";

// ✅ Add product to cart (ensures stock availability)
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.uid;

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "Invalid product or quantity" });
    }

    // Fetch product details
    const productRef = db.collection("products").doc(productId);
    const productSnapshot = await productRef.get();

    if (!productSnapshot.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = productSnapshot.data();
    const availableQuantity = productData.quantity || 0; // Default to 0 if missing

    if (availableQuantity < quantity) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    // Fetch user's cart
    const cartRef = db.collection("carts").doc(userId);
    const cartSnapshot = await cartRef.get();
    let cartData = cartSnapshot.exists ? cartSnapshot.data() : { items: [] };

    const existingProduct = cartData.items.find(
      (item) => item.productId === productId
    );

    if (existingProduct) {
      const newQuantity = existingProduct.quantity + quantity;
      if (newQuantity > availableQuantity) {
        return res.status(400).json({ error: "Exceeds available stock" });
      }
      existingProduct.quantity = newQuantity;
    } else {
      cartData.items.push({ productId, quantity });
    }

    await cartRef.set(cartData, { merge: true });

    res.status(200).json({ message: "Product added to cart", cart: cartData });
  } catch (error) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
};

// ✅ Get user's cart (filters invalid items)
export const getCart = async (req, res) => {
  try {
    const userId = req.user.uid;
    const cartRef = db.collection("carts").doc(userId);
    const cartSnapshot = await cartRef.get();

    if (!cartSnapshot.exists) {
      return res.status(200).json({ items: [] });
    }

    let cartData = cartSnapshot.data();

    // Remove invalid items (NaN or quantity <= 0)
    cartData.items = cartData.items.filter(
      (item) => Number.isFinite(item.quantity) && item.quantity > 0
    );

    // Fetch product details for each item
    const productPromises = cartData.items.map(async (item) => {
      const productRef = db.collection("products").doc(item.productId);
      const productSnapshot = await productRef.get();

      if (!productSnapshot.exists) return null; // Skip if product not found

      return {
        id: productSnapshot.id, // ✅ Add product ID here
        ...productSnapshot.data(), // Include product details
        quantity: item.quantity, // Keep user's selected quantity
      };
    });

    // Resolve all product fetches
    const cartWithDetails = (await Promise.all(productPromises)).filter(
      Boolean
    );

    res.status(200).json({ items: cartWithDetails });
  } catch (error) {
    console.error("🔥 Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
};

// ✅ Remove product from cart (decrements quantity or removes item)
export const removeFromCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.uid;

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "Invalid product or quantity" });
    }

    const cartRef = db.collection("carts").doc(userId);
    const cartSnapshot = await cartRef.get();

    if (!cartSnapshot.exists) {
      return res.status(404).json({ error: "Cart not found" });
    }

    let cartData = cartSnapshot.data();

    // Find product in cart
    const itemIndex = cartData.items.findIndex(
      (item) => item.productId === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Product not found in cart" });
    }

    // Decrease the quantity or remove if it's 0
    cartData.items[itemIndex].quantity -= quantity;

    if (cartData.items[itemIndex].quantity <= 0) {
      cartData.items.splice(itemIndex, 1);
    }

    await cartRef.update({ items: cartData.items });

    res
      .status(200)
      .json({ message: "Product updated in cart", cart: cartData });
  } catch (error) {
    res.status(500).json({ error: "Failed to update cart" });
  }
};

// ✅ Clear cart (removes all items)
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.uid;
    const cartRef = db.collection("carts").doc(userId);

    await cartRef.delete();

    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear cart" });
  }
};
