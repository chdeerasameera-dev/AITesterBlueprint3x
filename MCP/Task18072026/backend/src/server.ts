import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API Routers for both standalone & Vercel serverless multi-service routing
app.use("/api", apiRoutes);
app.use("/_/backend/api", apiRoutes);
app.use("/_/backend", apiRoutes);

// Root healthcheck
app.get(["/health", "/api/health", "/_/backend/health"], (req, res) => {
  res.json({ status: "ok", app: "MCP Inspector Explorer Backend", timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 MCP Inspector Explorer Backend running on http://localhost:${PORT}`);
  });
}

export default app;
