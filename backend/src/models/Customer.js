import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
    name: { type: String, required: true },
    phone: String,
    email: String,
    totalCredit: { type: Number, default: 0 },
    totalDebit: { type: Number, default: 0 },
  },
  { timestamps: true },
);

CustomerSchema.index({ ownerId: 1, name: 1 });

export default mongoose.model("Customer", CustomerSchema);
