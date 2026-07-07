import { Router } from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const items = await Order.find({ ownerId: req.owner._id }).sort({ createdAt: -1 });
  res.json(items);
});

router.post("/", async (req, res, next) => {
  try {
    const { customerId, customerName, customerPhone, salesmanName, items, advancePaid } = req.body;
    const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const advance = Number(advancePaid) || 0;
    const remaining = Math.max(0, totalAmount - advance);
    const order = await Order.create({
      ownerId: req.owner._id,
      customerId,
      customerName,
      customerPhone,
      salesmanName,
      items,
      totalAmount,
      advancePaid: advance,
      remainingAmount: remaining,
    });

    const customer = customerId
      ? await Customer.findOne({ _id: customerId, ownerId: req.owner._id })
      : await Customer.findOne({ ownerId: req.owner._id, name: customerName });
    if (customer) {
      // advance reduces immediate debit; customer owes remaining amount
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
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, ownerId: req.owner._id });
  if (!order) return res.status(404).json({ error: "Order not found" });

  order.status = req.body.status;
  await order.save();

  if (req.body.status === "accepted") {
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, ownerId: req.owner._id, "variants._id": item.variantId },
        { $inc: { "variants.$.stock": -Number(item.quantity) } },
      );
    }
  }

  res.json(order);
});

export default router;
