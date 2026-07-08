import { Router } from "express";
import multer from "multer";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadBufferToCloudinary } from "../lib/cloudinary.js";

const router = Router();

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  const { q, categoryId, companyId, status, minPrice, maxPrice, inStock } = req.query;
  const filter = { ownerId: req.owner._id };
  if (categoryId) filter.categoryId = categoryId;
  if (companyId) filter.companyId = companyId;
  if (status) filter.status = status;
  if (minPrice || maxPrice) {
    filter.price = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
    };
  }
  if (q) filter.$text = { $search: String(q) };
  let products = await Product.find(filter).sort({ createdAt: -1 });
  if (inStock === "1") products = products.filter((product) => product.variants.some((variant) => variant.stock > 0));
  res.json(products);
});

router.get("/:id", async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ownerId: req.owner._id });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

router.post("/", async (req, res) => {
  const body = { ...req.body };
  if (Array.isArray(body.variants)) {
    body.variants = body.variants.map((v) => {
      const copy = { ...v };
      if (copy._id && typeof copy._id === "string") {
        if (/^[0-9a-fA-F]{24}$/.test(copy._id)) copy._id = new mongoose.Types.ObjectId(copy._id);
        else delete copy._id;
      }
      return copy;
    });
  }
  const product = await Product.create({ ...body, ownerId: req.owner._id });
  res.status(201).json(product);
});

router.put("/:id", async (req, res) => {
  const body = { ...req.body };
  if (Array.isArray(body.variants)) {
    body.variants = body.variants.map((v) => {
      const copy = { ...v };
      if (copy._id && typeof copy._id === "string") {
        if (/^[0-9a-fA-F]{24}$/.test(copy._id)) copy._id = new mongoose.Types.ObjectId(copy._id);
        else delete copy._id;
      }
      return copy;
    });
  }
  const product = await Product.findOneAndUpdate({ _id: req.params.id, ownerId: req.owner._id }, body, { new: true });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

router.delete("/:id", async (req, res) => {
  await Product.deleteOne({ _id: req.params.id, ownerId: req.owner._id });
  res.status(204).end();
});

router.post("/upload", upload.single("image"), async (req, res, next) => {
  try {
    console.log("Upload request received");

    if (!req.file) {
      console.error("Upload Error: No file in request. Check if the field name is 'image'");
      return res.status(400).json({ error: "Image file is required" });
    }

    console.log(`Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "catalogr/products",
    });

    console.log("Cloudinary upload successful:", result.secure_url);
    res.status(201).json({ url: result.secure_url });
  } catch (error) {
    console.error("Route Upload Error:", error);
    res.status(500).json({
      error: "Failed to upload image to Cloudinary",
      details: error.message
    });
  }
});

export default router;
