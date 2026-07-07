import { Router } from "express";
import jwt from "jsonwebtoken";
import Salesman from "../models/Salesman.js";
import { requireSalesman } from "../middleware/salesman-auth.js";

const router = Router();

function sign(salesman) {
  return jwt.sign(
    { _id: salesman._id, ownerId: salesman.ownerId, email: salesman.email, type: "salesman" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "30d" },
  );
}

function toPublic(salesman) {
  const obj = salesman.toObject ? salesman.toObject() : { ...salesman };
  delete obj.password;
  return obj;
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const salesman = await Salesman.findOne({ email: String(email || "").toLowerCase() });
  if (!salesman || salesman.status !== "active" || !(await salesman.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  res.json({ salesman: toPublic(salesman), token: sign(salesman) });
});

router.get("/me", requireSalesman, async (req, res) => {
  const salesman = await Salesman.findById(req.salesman._id).select("-password");
  res.json({ salesman: salesman ? salesman.toObject() : null });
});

export default router;
