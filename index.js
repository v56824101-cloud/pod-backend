const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5001;
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

async function verifyToken(req, res, next) {
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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 允许跨域
// 处理跨域，必须放在所有路由之前
app.use(cors({
  origin: 'https://pod-frontend-five.vercel.app',  // 替换成你的 Vercel 域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 显式处理预检请求（OPTIONS）
app.options('*', cors());
app.use(express.json());

app.get('/', (req, res) => res.send('POD Backend is running!'));

app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

// 模拟产品数据
const products = [
  { id: 1, name: "复古脏脏洗T恤", category: "clothing", price: 43.00, image: "https://cdn.jsdelivr.net/gh/v56824101-cloud/POD-picture@main/%E8%84%8F%E6%B4%97T%E6%81%A4-%E7%B2%89.jpg" },
  { id: 2, name: "纯棉脏脏洗短裤", category: "shorts", price: 48.00, image: "https://raw.githubusercontent.com/v56824101-cloud/POD-picture/refs/heads/main/%E8%84%8F%E8%84%8F%E6%B4%97%E7%9F%AD%E8%A3%A4-%E7%B2%89.jpg" }
];

// 获取产品列表
app.get('/api/products', (req, res) => {
  const { category } = req.query;
  if (category && category !== 'all') {
    const filtered = products.filter(p => p.category === category);
    return res.json(filtered);
  }
  res.json(products);
});

// 获取单个产品详情
app.get('/api/products/:id', (req, res) => {
  console.log('收到请求，参数 id:', req.params.id);
  const productId = parseInt(req.params.id, 10);
  const product = products.find(p => p.id === productId);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: "未找到该产品" });
  }
});

// 模拟下单接口（必定成功）
app.post('/api/checkout', verifyToken, (req, res) => {
  const { cartItems, shippingAddress } = req.body;
  console.log('收到下单请求:', JSON.stringify(cartItems), JSON.stringify(shippingAddress));
  res.json({
    success: true,
    orderId: 'MOCK_' + Date.now(),
    message: '模拟下单成功'
  });
});

// 启动服务器（必须放在所有路由定义之后）
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
