import { Router } from "express";
import jwt from "jsonwebtoken";
import Owner from "../models/Owner.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function sign(owner) {
  return jwt.sign({ _id: owner._id, email: owner.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || "7d" });
}

function toPublicOwner(owner) {
  const publicOwner = owner.toObject ? owner.toObject() : { ...owner };
  delete publicOwner.password;
  return publicOwner;
}

router.post("/signup", async (req, res, next) => {
  try {
    const owner = await Owner.create(req.body);
    res.status(201).json({ owner: toPublicOwner(owner), token: sign(owner) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const owner = await Owner.findOne({ email: String(email).toLowerCase() });
  if (!owner || !(await owner.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  res.json({ owner: toPublicOwner(owner), token: sign(owner) });
});

router.get("/me", requireAuth, async (req, res) => {
  const owner = await Owner.findById(req.owner._id).select("-password");
  res.json({ owner: owner ? owner.toObject() : null });
});

export default router;
