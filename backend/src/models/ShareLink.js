import mongoose from "mongoose";

const ShareLinkSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
    shareCode: { type: String, required: true, unique: true, index: true },
    shareType: { type: String, enum: ["product", "category", "company", "custom", "search"], required: true },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    label: String,
    expiresAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("ShareLink", ShareLinkSchema);
