import { Router } from "express";
import ShareLink from "../models/ShareLink.js";
import { requireAuth } from "../middleware/auth.js";
import { createShareCode } from "../lib/ids.js";

const router = Router();
router.use(requireAuth);

function normalizeExpiresAt(body) {
  if (body.expiresAt) return body.expiresAt;
  const expiresInDays = Number(body.expiresInDays);
  if (!Number.isFinite(expiresInDays) || expiresInDays <= 0) return undefined;
  return new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
}

router.get("/", async (req, res) => {
  const items = await ShareLink.find({ ownerId: req.owner._id }).sort({ createdAt: -1 });
  res.json(items);
});

router.post("/", async (req, res) => {
  const { expiresInDays, expiresAt, ...rest } = req.body;
  const item = await ShareLink.create({
    ...rest,
    ownerId: req.owner._id,
    shareCode: createShareCode(),
    expiresAt: normalizeExpiresAt({ expiresInDays, expiresAt }),
  });
  res.status(201).json(item);
});

router.delete("/:id", async (req, res) => {
  await ShareLink.deleteOne({ _id: req.params.id, ownerId: req.owner._id });
  res.status(204).end();
});

export default router;
