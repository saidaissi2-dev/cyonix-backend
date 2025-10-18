require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de sécurité
app.use(helmet());

// CORS avec support multi-origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://cyonix.eu,https://www.cyonix.eu,http://localhost:5173,http://localhost:5000,http://127.0.0.1:5000')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // En développement, autoriser les domaines Replit (.replit.dev)
    if (origin && origin.includes('.replit.dev')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Body parser - IMPORTANT: raw body AVANT json() pour Stripe webhooks
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Puis JSON parser pour le reste
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API ProCyberShield running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 CORS Origins allowed:`, allowedOrigins);
});

module.exports = app;
