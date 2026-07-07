import { Router } from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Company from "../models/Company.js";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";
import Salesman from "../models/Salesman.js";
import { requireSalesman } from "../middleware/salesman-auth.js";

const router = Router();
router.use(requireSalesman);

router.get("/products", async (req, res) => {
  const products = await Product.find({ ownerId: req.owner._id, status: "active" }).sort({ createdAt: -1 });
  res.json(products);
});

router.get("/products/:id", async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ownerId: req.owner._id });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

router.get("/categories", async (req, res) => {
  res.json(await Category.find({ ownerId: req.owner._id }).sort({ name: 1 }));
});

router.get("/companies", async (req, res) => {
  res.json(await Company.find({ ownerId: req.owner._id }).sort({ name: 1 }));
});

router.get("/orders", async (req, res) => {
  const orders = await Order.find({ ownerId: req.owner._id, salesmanId: req.salesman._id }).sort({ createdAt: -1 });
  res.json(orders);
});

router.post("/orders", async (req, res, next) => {
  try {
    const { customerName, customerPhone, items, advancePaid } = req.body;
    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "customerName and items are required" });
    }

    const salesman = await Salesman.findById(req.salesman._id);
    if (!salesman || salesman.status !== "active") {
      return res.status(403).json({ error: "Salesman account is not active" });
    }

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, ownerId: req.owner._id });
      const variant = product?.variants.id(item.variantId);
      if (!product || !variant) return res.status(400).json({ error: `Unknown product/variant` });
      if (variant.stock < Number(item.quantity)) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const advance = Number(advancePaid) || 0;
    const remaining = Math.max(0, totalAmount - advance);

    const order = await Order.create({
      ownerId: req.owner._id,
      salesmanId: req.salesman._id,
      customerName,
      customerPhone,
      salesmanName: salesman.name,
      items,
      totalAmount,
      advancePaid: advance,
      remainingAmount: remaining,
      status: "accepted",
    });

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, ownerId: req.owner._id, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": -Number(item.quantity) } },
      );
    }

    const customer = await Customer.findOne({ ownerId: req.owner._id, name: customerName });
    if (customer) {
      customer.totalDebit += remaining;
      customer.totalCredit = (customer.totalCredit || 0) + advance;
      customer.phone = customer.phone || customerPhone;
      await customer.save();
    } else {
      await Customer.create({
        ownerId: req.owner._id,
        name: customerName,
        phone: customerPhone,
        totalCredit: advance,
        totalDebit: remaining,
      });
    }

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
