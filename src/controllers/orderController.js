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

    const orders = orderSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(orders);
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
