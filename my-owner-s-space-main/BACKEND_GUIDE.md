# MERN Backend Guide — Catalogr (Owner API)

This is a complete blueprint to build the JavaScript Express + MongoDB backend
for the Owner frontend in this project. The frontend currently uses a mock
`localStorage` API in `src/lib/api.ts` that mirrors these endpoints 1:1, so
swapping to real HTTP calls is a straightforward replacement.

---

## 1. Stack

- **Node.js** 20+
- **Express** 4
- **MongoDB** + **Mongoose** 8
- **jsonwebtoken** for auth
- **bcryptjs** for password hashing
- **multer** + **Cloudinary** (or AWS S3) for image uploads
- **cors**, **dotenv**, **morgan**

## 2. Project layout

```
backend/
├─ src/
│  ├─ config/db.js
│  ├─ middleware/auth.js
│  ├─ middleware/error.js
│  ├─ models/Owner.js
│  ├─ models/Category.js
│  ├─ models/Company.js
│  ├─ models/Product.js
│  ├─ models/Order.js
│  ├─ models/ShareLink.js
│  ├─ routes/auth.routes.js
│  ├─ routes/categories.routes.js
│  ├─ routes/companies.routes.js
│  ├─ routes/products.routes.js
│  ├─ routes/orders.routes.js
│  ├─ routes/shareLinks.routes.js
│  ├─ routes/public.routes.js
│  └─ server.js
├─ .env
└─ package.json
```

## 3. Setup

```bash
mkdir backend && cd backend
npm init -y
npm i express mongoose bcryptjs jsonwebtoken cors dotenv morgan multer cloudinary
npm i -D nodemon
```

`package.json` scripts:

```json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}
```

`.env`:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/catalogr
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES=7d
CORS_ORIGIN=http://localhost:8080
CLOUDINARY_URL=cloudinary://key:secret@cloud_name
```

## 4. Server bootstrap — `src/server.js`

```js
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
import shareLinkRoutes from "./routes/shareLinks.routes.js";
import publicRoutes from "./routes/public.routes.js";
import { errorHandler } from "./middleware/error.js";

dotenv.config();
await connectDB(process.env.MONGO_URI);

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/share-links", shareLinkRoutes);
app.use("/api/public", publicRoutes); // unauthenticated share-link viewer

app.use(errorHandler);
app.listen(process.env.PORT, () => console.log(`API :${process.env.PORT}`));
```

Add `"type": "module"` in `package.json`.

## 5. DB connection — `src/config/db.js`

```js
import mongoose from "mongoose";
export async function connectDB(uri) {
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
```

## 6. Models

### `Owner`

```js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const OwnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  phone: String,
  companyName: String,
}, { timestamps: true });

OwnerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});
OwnerSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};
export default mongoose.model("Owner", OwnerSchema);
```

### `Category` / `Company`

```js
const schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
  name: { type: String, required: true },
}, { timestamps: true });
```

Export as `Category` and `Company` (same shape).

### `Product`

```js
const VariantSchema = new mongoose.Schema({
  color: String, size: String, stock: { type: Number, default: 0 },
});

const ProductSchema = new mongoose.Schema({
  ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
  companyId:  { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true, min: 0 },
  image: String,
  status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
  variants: [VariantSchema],
}, { timestamps: true });

ProductSchema.index({ name: "text", description: "text" });
export default mongoose.model("Product", ProductSchema);
```

### `Order`

```js
const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productName: String, variantLabel: String,
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema({
  ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
  salesmanId: { type: mongoose.Schema.Types.ObjectId, ref: "Salesman" },
  salesmanName: String,
  items: [OrderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  orderDate: { type: Date, default: Date.now },
}, { timestamps: true });
```

### `ShareLink`

```js
const ShareLinkSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true, index: true },
  shareCode: { type: String, required: true, unique: true, index: true },
  shareType: { type: String, enum: ["product", "category", "company", "custom", "search"], required: true },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  label: String,
  expiresAt: Date,
}, { timestamps: true });
```

## 7. Auth middleware — `src/middleware/auth.js`

```js
import jwt from "jsonwebtoken";
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.owner = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: "Invalid token" }); }
}
```

Sign token on login/signup:

```js
const token = jwt.sign({ _id: owner._id, email: owner.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });
```

## 8. Routes — endpoint contract

All routes below (except `/api/auth/*` and `/api/public/*`) require
`Authorization: Bearer <token>`.

### Auth

| Method | Path                  | Body                                             | Returns              |
| ------ | --------------------- | ------------------------------------------------ | -------------------- |
| POST   | `/api/auth/signup`    | `{ name, email, password, phone?, companyName? }` | `{ owner, token }` |
| POST   | `/api/auth/login`     | `{ email, password }`                            | `{ owner, token }`   |
| GET    | `/api/auth/me`        | —                                                | `{ owner }`          |

### Categories / Companies (identical shape)

| Method | Path                           |
| ------ | ------------------------------ |
| GET    | `/api/categories`              |
| POST   | `/api/categories` `{ name }`   |
| DELETE | `/api/categories/:id`          |

### Products

| Method | Path                    | Notes                                                  |
| ------ | ----------------------- | ------------------------------------------------------ |
| GET    | `/api/products`         | Supports `?q=&categoryId=&companyId=&status=&minPrice=&maxPrice=&inStock=1` |
| GET    | `/api/products/:id`     |                                                        |
| POST   | `/api/products`         | Full product body incl. `variants[]`                   |
| PUT    | `/api/products/:id`     |                                                        |
| DELETE | `/api/products/:id`     |                                                        |
| POST   | `/api/products/upload`  | `multipart/form-data` `image` → returns `{ url }`      |

### Orders

| Method | Path                          | Body                                    |
| ------ | ----------------------------- | --------------------------------------- |
| GET    | `/api/orders`                 |                                         |
| PATCH  | `/api/orders/:id/status`      | `{ status: "accepted" \| "rejected" }` |

On `accepted`, atomically decrement stock:

```js
for (const item of order.items) {
  await Product.updateOne(
    { _id: item.productId, "variants._id": item.variantId },
    { $inc: { "variants.$.stock": -item.quantity } }
  );
}
```

### Share links

| Method | Path                       |
| ------ | -------------------------- |
| GET    | `/api/share-links`         |
| POST   | `/api/share-links`         |
| DELETE | `/api/share-links/:id`     |

### Public (no auth)

| Method | Path                          | Returns                                 |
| ------ | ----------------------------- | --------------------------------------- |
| GET    | `/api/public/s/:shareCode`    | `{ link, products }` if not expired     |

Generate `shareCode` with `crypto.randomBytes(6).toString("hex")`.

## 9. Example route file — `src/routes/products.routes.js`

```js
import { Router } from "express";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();
r.use(requireAuth);

r.get("/", async (req, res) => {
  const { q, categoryId, companyId, status, minPrice, maxPrice, inStock } = req.query;
  const filter = { ownerId: req.owner._id };
  if (categoryId) filter.categoryId = categoryId;
  if (companyId) filter.companyId = companyId;
  if (status) filter.status = status;
  if (minPrice || maxPrice) filter.price = {
    ...(minPrice && { $gte: Number(minPrice) }),
    ...(maxPrice && { $lte: Number(maxPrice) }),
  };
  if (q) filter.$text = { $search: q };
  let products = await Product.find(filter).sort("-createdAt");
  if (inStock === "1") products = products.filter(p => p.variants.some(v => v.stock > 0));
  res.json(products);
});

r.post("/", async (req, res) => {
  const p = await Product.create({ ...req.body, ownerId: req.owner._id });
  res.status(201).json(p);
});

r.put("/:id", async (req, res) => {
  const p = await Product.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.owner._id },
    req.body, { new: true }
  );
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

r.delete("/:id", async (req, res) => {
  await Product.deleteOne({ _id: req.params.id, ownerId: req.owner._id });
  res.status(204).end();
});

export default r;
```

## 10. Error handler — `src/middleware/error.js`

```js
export function errorHandler(err, _req, res, _next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
}
```

## 11. Connecting the frontend

1. Create `.env` at project root:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```
2. Add a helper — `src/lib/http.ts`:
   ```ts
   const BASE = import.meta.env.VITE_API_URL;
   export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
     const token = localStorage.getItem("token");
     const res = await fetch(`${BASE}${path}`, {
       ...init,
       headers: {
         "Content-Type": "application/json",
         ...(token && { Authorization: `Bearer ${token}` }),
         ...init.headers,
       },
     });
     if (!res.ok) throw new Error((await res.json()).error || res.statusText);
     return res.status === 204 ? (undefined as T) : res.json();
   }
   ```
3. Replace each function body in `src/lib/api.ts` with the matching call, e.g.:
   ```ts
   export const listProducts = () => http<Product[]>("/products");
   export const upsertProduct = (input: ...) =>
     input._id
       ? http(`/products/${input._id}`, { method: "PUT", body: JSON.stringify(input) })
       : http("/products", { method: "POST", body: JSON.stringify(input) });
   ```
4. Update `login` / `signup` to save the returned token:
   ```ts
   const { owner, token } = await http("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
   localStorage.setItem("token", token);
   ```

## 12. Deploy checklist

- MongoDB Atlas cluster + IP allow list
- Backend on Render / Railway / Fly.io
- Set `CORS_ORIGIN` to your deployed frontend URL
- Rotate `JWT_SECRET`; never commit `.env`
- Enable HTTPS everywhere
- Add rate limiting (`express-rate-limit`) on `/api/auth/*`

## 13. Next steps (not in v1)

- Salesman auth & endpoints — mirror Owner but scoped by `ownerId`
- Realtime order notifications with **Socket.IO** on the Owner side
- Cloudinary/S3 signed uploads instead of base64 images
- Refresh tokens & password reset flow
