import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import companyRoutes from "./routes/companies.routes.js";
import productRoutes from "./routes/products.routes.js";
import orderRoutes from "./routes/orders.routes.js";
import customerRoutes from "./routes/customers.routes.js";
import shareLinkRoutes from "./routes/share-links.routes.js";
import publicRoutes from "./routes/public.routes.js";
import { errorHandler } from "./middleware/error.js";

dotenv.config();
await connectDB(process.env.MONGO_URI);

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true, allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/share-links", shareLinkRoutes);
app.use("/api/public", publicRoutes);
app.use(errorHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on :${port}`));
