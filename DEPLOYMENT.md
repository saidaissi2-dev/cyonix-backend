# 🚀 GUIDE DE DÉPLOIEMENT BACKEND - ProCyberShield

## 📋 PRÉ-REQUIS

- VPS Backend: `vps-c9da2062.vps.ovh.net`
- VPS PKI: `vps-97b4c29e.vps.ovh.net`
- Accès SSH root aux deux VPS
- Domaine: api.cyonix.eu pointant vers VPS Backend
- Compte Stripe configuré

---

## ÉTAPE 1: CONFIGURATION VPS BACKEND

### 1.1 Connexion SSH
```bash
ssh root@vps-c9da2062.vps.ovh.net
```

### 1.2 Installation Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version  # Vérifier: v20.x
npm --version
```

### 1.3 Installation PostgreSQL 15
```bash
apt-get update
apt-get install -y postgresql postgresql-contrib

# Démarrer PostgreSQL
systemctl start postgresql
systemctl enable postgresql
```

### 1.4 Configuration PostgreSQL
```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Dans psql:
CREATE DATABASE procybershield;
CREATE USER procybershield_user WITH ENCRYPTED PASSWORD 'VOTRE_MOT_DE_PASSE_SECURISE';
GRANT ALL PRIVILEGES ON DATABASE procybershield TO procybershield_user;
\q
```

### 1.5 Installation PM2
```bash
npm install -g pm2
```

### 1.6 Installation Nginx
```bash
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 1.7 Installation Certbot (SSL)
```bash
apt-get install -y certbot python3-certbot-nginx
```

---

## ÉTAPE 2: DÉPLOIEMENT DU CODE

### 2.1 Créer le répertoire
```bash
mkdir -p /var/www/api-procybershield
cd /var/www/api-procybershield
```

### 2.2 Uploader le code
Plusieurs options:

**Option A: Git**
```bash
git clone https://github.com/VOTRE_REPO/backend.git .
```

**Option B: SCP depuis votre machine locale**
```bash
# Sur votre machine locale:
scp -r ./backend/* root@vps-c9da2062.vps.ovh.net:/var/www/api-procybershield/
```

**Option C: Créer les fichiers manuellement**
Créez tous les fichiers fournis dans l'arborescence correcte.

### 2.3 Installer les dépendances
```bash
cd /var/www/api-procybershield
npm install --production
```