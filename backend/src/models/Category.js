import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("Category", CategorySchema);
