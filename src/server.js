const express = require("express"); // Import Express để tạo API server.
const mongoose = require("mongoose"); // Import Mongoose để kết nối và thao tác MongoDB.
const cors = require("cors"); // Import CORS để cho phép service khác gọi API.
require("dotenv").config(); // Đọc biến môi trường từ file .env nếu có.

const app = express(); // Tạo ứng dụng Express.
const PORT = process.env.PORT || 3001; // Lấy port từ biến môi trường, nếu không có thì dùng 3001.
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/microshop_auth"; // Chuỗi kết nối MongoDB.

app.use(cors()); // Bật CORS cho API.
app.use(express.json()); // Cho phép Express đọc request body dạng JSON.

const userSchema = new mongoose.Schema({ // Khai báo cấu trúc dữ liệu user.
  username: { type: String, required: true, unique: true }, // Username là chuỗi, bắt buộc và không được trùng.
  password: { type: String, required: true }, // Password là chuỗi và bắt buộc.
  role: { type: String, default: "user" } // Role mặc định là user.
}); // Kết thúc schema user.

const User = mongoose.model("User", userSchema); // Tạo model User để thao tác với collection users.

app.get("/health", (req, res) => { // API kiểm tra auth-service còn sống không.
  res.json({ // Trả dữ liệu JSON.
    service: "auth-service", // Tên service.
    status: "ok", // Trạng thái service.
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" // Kiểm tra MongoDB đã kết nối chưa.
  }); // Kết thúc response.
}); // Kết thúc route /health.

app.post("/login", async (req, res, next) => { // API đăng nhập.
  try { // Bắt đầu khối xử lý lỗi.
    const { username, password } = req.body; // Lấy username và password từ request body.

    const user = await User.findOne({ username, password }); // Tìm user trong MongoDB theo username và password.

    if (!user) { // Nếu không tìm thấy user.
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" }); // Trả lỗi 401.
    } // Kết thúc if.

    res.json({ // Trả kết quả đăng nhập thành công.
      message: "Login success", // Thông báo thành công.
      token: "demo-token", // Token demo để học, chưa phải JWT thật.
      user: { id: user._id, username: user.username, role: user.role } // Trả thông tin user, không trả password.
    }); // Kết thúc response.
  } catch (error) { // Nếu có lỗi.
    next(error); // Chuyển lỗi sang middleware lỗi.
  } // Kết thúc try/catch.
}); // Kết thúc route /login.

app.get("/error", (req, res) => { // API cố tình tạo lỗi để học debug.
  throw new Error("Demo error from auth-service"); // Ném lỗi giả lập.
}); // Kết thúc route /error.

app.use((error, req, res, next) => { // Middleware xử lý lỗi toàn cục.
  console.error("[AUTH ERROR]", error.message); // In lỗi ra log container.
  res.status(500).json({ // Trả status 500.
    service: "auth-service", // Cho biết lỗi từ auth-service.
    error: error.message // Nội dung lỗi.
  }); // Kết thúc response.
}); // Kết thúc middleware lỗi.

async function startServer() { // Hàm khởi động service.
  await mongoose.connect(MONGO_URI); // Kết nối tới MongoDB.
  console.log("Auth service connected to MongoDB"); // In log kết nối thành công.

  const admin = await User.findOne({ username: "admin" }); // Kiểm tra user admin đã tồn tại chưa.

  if (!admin) { // Nếu chưa có admin.
    await User.create({ username: "admin", password: "Admin@123", role: "admin" }); // Tạo admin mặc định.
    console.log("Default admin created"); // In log đã tạo admin.
  } // Kết thúc if.

  app.listen(PORT, () => { // Cho service lắng nghe port.
    console.log(`Auth service running on port ${PORT}`); // In log service đang chạy.
  }); // Kết thúc listen.
} // Kết thúc hàm startServer.

startServer().catch((error) => { // Gọi hàm startServer và bắt lỗi khởi động.
  console.error("Auth service failed:", error.message); // In lỗi khởi động.
  process.exit(1); // Thoát chương trình nếu lỗi.
}); // Kết thúc catch.
