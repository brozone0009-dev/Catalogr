import { Router } from "express";
import Salesman from "../models/Salesman.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function toPublic(s) {
  const obj = s.toObject ? s.toObject() : { ...s };
  delete obj.password;
  return obj;
}

router.get("/", async (req, res) => {
  const list = await Salesman.find({ ownerId: req.owner._id }).select("-password").sort({ createdAt: -1 });
  res.json(list);
});

router.post("/", async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
    const salesman = await Salesman.create({
      ownerId: req.owner._id,
      name,
      email: String(email).toLowerCase(),
      password,
      phone,
    });
    res.status(201).json(toPublic(salesman));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Email already used for this owner" });
    next(err);
  }
});

router.patch("/:id", async (req, res) => {
  const salesman = await Salesman.findOne({ _id: req.params.id, ownerId: req.owner._id });
  if (!salesman) return res.status(404).json({ error: "Not found" });
  const { name, phone, status, password } = req.body;
  if (name !== undefined) salesman.name = name;
  if (phone !== undefined) salesman.phone = phone;
  if (status !== undefined) salesman.status = status;
  if (password) salesman.password = password;
  await salesman.save();
  res.json(toPublic(salesman));
});

router.delete("/:id", async (req, res) => {
  await Salesman.deleteOne({ _id: req.params.id, ownerId: req.owner._id });
  res.status(204).end();
});

export default router;
