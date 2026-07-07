import { Router } from "express";
import ShareLink from "../models/ShareLink.js";
import Product from "../models/Product.js";

const router = Router();

router.get("/s/:shareCode", async (req, res) => {
  const link = await ShareLink.findOne({ shareCode: req.params.shareCode });
  if (!link) return res.status(404).json({ error: "Not found" });
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) return res.status(410).json({ error: "Expired" });
  const products = await Product.find({ _id: { $in: link.productIds }, ownerId: link.ownerId });
  res.json({ link, products });
});

router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
