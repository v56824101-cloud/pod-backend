const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 5001;

// ---------- Firebase Admin 初始化（可选）----------
let admin;
try {
  admin = require('firebase-admin');
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin 已初始化');
  } else {
    console.warn('未设置 FIREBASE_SERVICE_ACCOUNT，认证功能将跳过验证');
  }
} catch (e) {
  console.warn('firebase-admin 模块不可用，认证功能关闭');
}

// ---------- 认证中间件 ----------
async function verifyToken(req, res, next) {
  // 如果 admin 未初始化，直接放行（方便测试）
  if (!admin) {
    console.warn('认证未启用，跳过验证');
    return next();
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效令牌' });
  }
}

// ---------- 创建 Express 应用 ----------
const app = express();

// ---------- CORS 配置 ----------
app.use(
  cors({
    origin: 'https://pod-frontend-five.vercel.app',   // 你的前端域名
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.options('*', cors());     // 处理预检请求

app.use(express.json());

// ---------- 健康检查 ----------
app.get('/', (req, res) => res.send('POD Backend is running!'));

// ---------- 模拟产品数据 ----------
const products = [
  {
    id: 1,
    name: '复古脏脏洗T恤',
    category: 'clothing',
    price: 43.0,
    image:
      'https://cdn.jsdelivr.net/gh/v56824101-cloud/POD-picture@main/%E8%84%8F%E6%B4%97T%E6%81%A4-%E7%B2%89.jpg',
  },
  {
    id: 2,
    name: '纯棉脏脏洗短裤',
    category: 'shorts',
    price: 48.0,
    image:
      'https://raw.githubusercontent.com/v56824101-cloud/POD-picture/refs/heads/main/%E8%84%8F%E8%84%8F%E6%B4%97%E7%9F%AD%E8%A3%A4-%E7%B2%89.jpg',
  },
];

// ---------- 产品列表接口 ----------
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  if (category && category !== 'all') {
    const filtered = products.filter((p) => p.category === category);
    return res.json(filtered);
  }
  res.json(products);
});

// ---------- 产品详情接口 ----------
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const product = products.find((p) => p.id === productId);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: '未找到该产品' });
  }
});

// ---------- 下单接口（模拟成功，可启用 token 验证） ----------
app.post('/api/checkout', verifyToken, (req, res) => {
  const { cartItems, shippingAddress } = req.body;
  console.log('收到下单请求:', JSON.stringify(cartItems), JSON.stringify(shippingAddress));
  res.json({
    success: true,
    orderId: 'MOCK_' + Date.now(),
    message: '模拟下单成功',
  });
});

// ---------- 启动服务器 ----------
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
