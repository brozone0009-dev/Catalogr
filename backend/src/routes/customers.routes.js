import { Router } from "express";
import Customer from "../models/Customer.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const items = await Customer.find({ ownerId: req.owner._id }).sort({ createdAt: -1 });
  res.json(items);
});

router.patch("/:id/balance", async (req, res) => {
  const { kind, amount } = req.body;
  const customer = await Customer.findOne({ _id: req.params.id, ownerId: req.owner._id });
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  if (kind === "credit") customer.totalCredit += Number(amount) || 0;
  if (kind === "debit") customer.totalDebit += Number(amount) || 0;
  await customer.save();
  res.json(customer);
});

export default router;
