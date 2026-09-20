const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_key_amazon_clone_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'development_jwt_refresh_secret_key_amazon_clone_2026';

// Resilient fallback memory store for auth when PostgreSQL is not running locally
const mockUsers = [
  {
    id: 1,
    name: 'Demo Customer',
    email: 'customer@example.com',
    password_hash: bcrypt.hashSync('password123', 10),
    role: 'customer',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Demo Seller',
    email: 'seller@example.com',
    password_hash: bcrypt.hashSync('password123', 10),
    role: 'seller',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Demo Admin',
    email: 'admin@example.com',
    password_hash: bcrypt.hashSync('password123', 10),
    role: 'admin',
    created_at: new Date().toISOString(),
  },
];

// Helper: generate token pair
function generateTokens(user) {
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { token, accessToken: token, refreshToken };
}

// 1. Register a new user
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['customer', 'seller']).withMessage('Role must be customer or seller'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    const { name, email, password, role = 'customer' } = req.body;

    try {
      const hash = await bcrypt.hash(password, 10);
      try {
        const result = await pool.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
          [name, email, hash, role]
        );
        const user = result.rows[0];
        const { token, refreshToken, accessToken } = generateTokens(user);

        return res.status(201).json({
          message: 'Account created successfully',
          user,
          token,
          accessToken,
          refreshToken,
        });
      } catch (dbErr) {
        if (dbErr.code === '23505') {
          return res.status(409).json({ message: 'An account with this email already exists' });
        }
        // Fallback to in-memory store
        const existing = mockUsers.find((u) => u.email === email);
        if (existing) {
          return res.status(409).json({ message: 'An account with this email already exists' });
        }
        const newUser = {
          id: mockUsers.length + 1,
          name,
          email,
          password_hash: hash,
          role,
          created_at: new Date().toISOString(),
        };
        mockUsers.push(newUser);
        const safeUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, created_at: newUser.created_at };
        const { token, refreshToken, accessToken } = generateTokens(safeUser);
        return res.status(201).json({
          message: 'Account created successfully (local store)',
          user: safeUser,
          token,
          accessToken,
          refreshToken,
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// 2. Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      let user;
      try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        user = result.rows[0];
      } catch (dbErr) {
        user = mockUsers.find((u) => u.email === email);
      }

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at };
      const { token, refreshToken, accessToken } = generateTokens(safeUser);

      res.json({
        message: 'Logged in successfully',
        token,
        accessToken,
        refreshToken,
        user: safeUser,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// 3. Current User Profile (/me)
router.get('/me', authenticate, async (req, res) => {
  try {
    let user;
    try {
      const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
      user = result.rows[0];
    } catch (dbErr) {
      user = mockUsers.find((u) => u.id === req.user.id) || req.user;
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Fetch /me error:', err);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// 4. Refresh Access Token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    let user;
    try {
      const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
      user = result.rows[0];
    } catch (dbErr) {
      user = mockUsers.find((u) => u.id === decoded.id) || decoded;
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid token: user does not exist' });
    }

    const newToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token: newToken, accessToken: newToken });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

module.exports = router;

