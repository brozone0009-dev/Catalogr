import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SalesmanSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, index: true },
    password: { type: String, required: true },
    phone: String,
    status: { type: String, enum: ["active", "disabled"], default: "active" },
  },
  { timestamps: true },
);

SalesmanSchema.index({ ownerId: 1, email: 1 }, { unique: true });

SalesmanSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

SalesmanSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model("Salesman", SalesmanSchema);
