import { Router } from "express";
import Company from "../models/Company.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const items = await Company.find({ ownerId: req.owner._id }).sort({ createdAt: -1 });
  res.json(items);
});

router.post("/", async (req, res) => {
  const item = await Company.create({ ownerId: req.owner._id, name: req.body.name });
  res.status(201).json(item);
});

router.delete("/:id", async (req, res) => {
  await Company.deleteOne({ _id: req.params.id, ownerId: req.owner._id });
  res.status(204).end();
});

export default router;
