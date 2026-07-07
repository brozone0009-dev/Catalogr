import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    productName: String,
    variantLabel: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true },
    customerPhone: String,
    salesmanName: String,
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true },
    advancePaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Order", OrderSchema);
