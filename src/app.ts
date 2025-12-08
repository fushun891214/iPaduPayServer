console.log("=== Starting app ===");
import "dotenv/config";
import express, { Express } from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import friendRoutes from "./routes/friendRoutes";
import groupRoutes from "./routes/groupRoutes";

const app: Express = express();

// Middleware
app.use(cors()); // 允許其他網域的應用程式存取此 API
app.use(express.json()); // 解析 Content-Type: application/json 的請求 body，將 JSON 字串轉換成 req.body 物件
app.use(express.urlencoded({ extended: true })); // 解析 URL-encoded 格式的請求 body（支援巢狀物件）
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/group", groupRoutes);

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Start server
const PORT = process.env.API_SERVER_PORT || 8081;
const startServer = async () => {
  try {
    // Prisma connects lazily, but we can force a connection check
    // Or just start the server.
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
