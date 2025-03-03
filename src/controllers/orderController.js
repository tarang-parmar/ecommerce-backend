// /src/controllers/orderController.js

import { db } from "../config/firebase.js";

// ✅ Checkout & place order
export const checkout = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { address, paymentMethod } = req.body;

    if (!address || !paymentMethod) {
      return res
        .status(400)
        .json({ error: "Address and payment method are required" });
    }

    // Fetch user's cart
    const cartRef = db.collection("carts").doc(userId);
    const cartSnapshot = await cartRef.get();

    if (!cartSnapshot.exists || cartSnapshot.data().items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const cartData = cartSnapshot.data();
    const orderData = {
      userId,
      items: cartData.items,
      address,
      paymentMethod,
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    // Store order
    const orderRef = await db.collection("orders").add(orderData);

    // Clear the cart after checkout
    await cartRef.delete();

    res.status(200).json({
      message: "Order placed",
      orderId: orderRef.id,
      order: orderData,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to place order" });
  }
};

// ✅ Get user's order history
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.uid;
    const orderSnapshot = await db
      .collection("orders")
      .where("userId", "==", userId)
      .get();

    if (orderSnapshot.empty) {
      return res.status(200).json({ orders: [] });
    }

    const orders = await Promise.all(
      orderSnapshot.docs.map(async (doc) => {
        let orderData = doc.data();

        // Fetch product details for each item
        const productPromises = orderData.items.map(async (item) => {
          const productRef = db.collection("products").doc(item.productId);
          const productSnapshot = await productRef.get();

          if (!productSnapshot.exists) return null; // Skip if product not found

          return {
            ...productSnapshot.data(), // Include full product details
            quantity: item.quantity, // Keep the ordered quantity
          };
        });

        // Resolve all product fetches and filter out null values
        const itemsWithDetails = (await Promise.all(productPromises)).filter(
          Boolean
        );

        return {
          id: doc.id,
          ...orderData,
          items: itemsWithDetails, // Replace items with full product details
        };
      })
    );

    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// ✅ Update order status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res
        .status(400)
        .json({ error: "Order ID and status are required" });
    }

    const orderRef = db.collection("orders").doc(orderId);
    await orderRef.update({ status });

    res.status(200).json({ message: "Order status updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
};
