import jwt from "jsonwebtoken";

export function requireSalesman(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "salesman") return res.status(401).json({ error: "Invalid token" });
    req.salesman = payload;
    req.owner = { _id: payload.ownerId };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
