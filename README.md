# 🛡️ ProCyberShield Backend API

Backend Node.js/Express pour la plateforme VPN ProCyberShield.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Déploiement](#déploiement)
- [Endpoints API](#endpoints-api)
- [Tests](#tests)

---

## 🎯 Vue d'ensemble

ProCyberShield est une plateforme VPN offrant:
- Abonnement 5€/mois via Stripe
- Génération automatique de certificats PKI (.p12)
- 2 connexions simultanées
- Infrastructure distribuée sur 3 VPS

**URLs:**
- Frontend: https://cyonix.eu ✅
- Backend: https://api.cyonix.eu ⚠️ (à déployer)
- PKI Server: vps-97b4c29e.vps.ovh.net (SSH uniquement)

---

## 🛠 Stack technique

- **Runtime**: Node.js 20.x
- **Framework**: Express 4.18
- **Base de données**: PostgreSQL 15
- **ORM**: Sequelize 6.35
- **Paiement**: Stripe
- **PKI**: Easy-RSA (via SSH)
- **Email**: Nodemailer (SMTP)
- **Auth**: JWT (bcrypt + jsonwebtoken)
- **Logging**: Winston
- **Validation**: Joi
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **SSL**: Certbot (Let's Encrypt)

---

## 🏗 Architecture

```
┌─────────────────┐
│  Frontend (SPA) │
│  cyonix.eu      │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Backend API    │
│  api.cyonix.eu  │
│  (Node.js)      │
└────────┬────────┘
         │ SSH
         ▼
┌─────────────────┐
│   PKI Server    │
│   Easy-RSA      │
│   (vps-pki)     │
└─────────────────┘
```

---

## 📂 Structure du projet

```
backend/
├── src/
│   ├── config/
│   │   └── database.js           # Configuration PostgreSQL
│   ├── controllers/
│   │   ├── authController.js     # Authentification
│   │   ├── userController.js     # Gestion utilisateur
│   │   ├── paymentController.js  # Paiements Stripe
│   │   ├── certificateController.js # Certificats PKI
│   │   └── subscriptionController.js # Abonnements
│   ├── middleware/
│   │   ├── auth.js               # Vérification JWT
│   │   ├── rateLimiter.js        # Rate limiting
│   │   ├── validation.js         # Validation Joi
│   │   └── errorHandler.js       # Gestion erreurs
│   ├── models/
│   │   ├── User.js               # Modèle User
│   │   ├── Subscription.js       # Modèle Subscription
│   │   ├── Certificate.js        # Modèle Certificate
│   │   ├── PasswordResetToken.js # Tokens reset password
│   │   ├── Session.js            # Sessions JWT
│   │   └── index.js              # Associations
│   ├── routes/
│   │   ├── auth.js               # Routes auth
│   │   ├── user.js               # Routes user
│   │   ├── payment.js            # Routes payment
│   │   ├── certificate.js        # Routes certificate
│   │   ├── subscription.js       # Routes subscription
│   │   ├── contact.js            # Routes contact
│   │   ├── health.js             # Health check
│   │   └── webhook.js            # Webhooks Stripe
│   ├── services/
│   │   ├── tokenService.js       # Service JWT
│   │   ├── stripeService.js      # Service Stripe
│   │   ├── pkiService.js         # Service PKI (SSH)
│   │   