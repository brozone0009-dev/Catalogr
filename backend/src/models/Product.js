import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
  {
    color: String,
    size: String,
    stock: { type: Number, default: 0 },
  },
  { _id: true },
);

const ProductSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    image: String,
    status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
    variants: [VariantSchema],
  },
  { timestamps: true },
);

ProductSchema.index({ name: "text", description: "text" });

export default mongoose.model("Product", ProductSchema);
