#!/bin/bash

# 🚀 Script de déploiement VPS automatisé - ProCyberShield Backend
# Ce script déploie le backend directement sur le VPS

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🚀 ProCyberShield Backend - Déploiement VPS        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
VPS_HOST="vps-c9da2062.vps.ovh.net"
VPS_USER="root"
VPS_DIR="/var/www/api-procybershield"
GITHUB_REPO=""

echo -e "${YELLOW}📝 Configuration du déploiement${NC}"
echo ""

# Demander l'URL GitHub
read -p "$(echo -e ${BLUE}🔗 URL du repo GitHub: ${NC})" GITHUB_REPO

if [ -z "$GITHUB_REPO" ]; then
    echo -e "${RED}❌ URL GitHub requise${NC}"
    exit 1
fi

# Vérifier la connexion SSH
echo -e "\n${YELLOW}🔐 Test de connexion SSH vers $VPS_HOST...${NC}"
if ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo 'SSH OK'" &>/dev/null; then
    echo -e "${GREEN}✅ Connexion SSH réussie${NC}"
else
    echo -e "${RED}❌ Impossible de se connecter au VPS${NC}"
    echo -e "${YELLOW}💡 Vérifiez:${NC}"
    echo -e "  1. Votre connexion Internet"
    echo -e "  2. Vos clés SSH: ssh-add -l"
    echo -e "  3. Testez manuellement: ssh $VPS_USER@$VPS_HOST"
    exit 1
fi

# Demander confirmation
echo ""
echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                  ⚠️  CONFIRMATION                         ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e "${YELLOW}Serveur:${NC} $VPS_HOST"
echo -e "${YELLOW}Répertoire:${NC} $VPS_DIR"
echo -e "${YELLOW}GitHub:${NC} $GITHUB_REPO"
echo ""
read -p "$(echo -e ${YELLOW}❓ Continuer le déploiement? \(y/n\): ${NC})" CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${RED}❌ Déploiement annulé${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              🚀 DÉBUT DU DÉPLOIEMENT                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# Étape 1: Installation Node.js
echo -e "\n${YELLOW}[1/8] 📦 Installation Node.js 20...${NC}"
ssh "$VPS_USER@$VPS_HOST" bash << 'ENDSSH1'
    if ! command -v node &> /dev/null; then
        echo "Installation Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    echo "Node.js version: $(node --version)"
    echo "NPM version: $(npm --version)"
ENDSSH1
echo -e "${GREEN}✅ Node.js installé${NC}"

# Étape 2: Installation PostgreSQL
echo -e "\n${YELLOW}[2/8] 🐘 Installation PostgreSQL...${NC}"
ssh "$VPS_USER@$VPS_HOST" bash << 'ENDSSH2'
    if ! command -v psql &> /dev/null; then
        echo "Installation PostgreSQL..."
        apt-get update
        apt-get install -y postgresql postgresql-contrib
        systemctl start postgresql
        systemctl enable postgresql
    fi
    echo "PostgreSQL version: $(psql --version)"
ENDSSH2
echo -e "${GREEN}✅ PostgreSQL installé${NC}"

# Étape 3: Installation PM2
echo -e "\n${YELLOW}[3/8] ⚙️  Installation PM2...${NC}"
ssh "$VPS_USER@$VPS_HOST" bash << 'ENDSSH3'
    if ! command -v pm2 &> /dev/null; then
        echo "Installation PM2..."
        npm install -g pm2
    fi
    echo "PM2 version: $(pm2 --version)"
ENDSSH3
echo -e "${GREEN}✅ PM2 installé${NC}"

# Étape 4: Cloner le repo
echo -e "\n${YELLOW}[4/8] 📥 Clonage du repository GitHub...${NC}"
ssh "$VPS_USER@$VPS_HOST" bash << ENDSSH4
    if [ -d "$VPS_DIR" ]; then
        echo "Répertoire existe, mise à jour..."
        cd $VPS_DIR
        git pull origin main
    else
        echo "Clonage du repository..."
        mkdir -p /var/www
        cd /var/www
        git clone $GITHUB_REPO api-procybershield
    fi
ENDSSH4
echo -e "${GREEN}✅ Code récupéré${NC}"

# Étape 5: Installation dépendances NPM
echo -e "\n${YELLOW}[5/8] 📦 Installation des dépendances NPM...${NC}"
ssh "$VPS_USER@$VPS_HOST" bash << ENDSSH5
    cd $VPS_DIR
    npm install --production
ENDSSH5
echo -e "${GREEN}✅ Dépendances installées${NC}"

# Étape 6: Configuration PostgreSQL
echo -e "\n${YELLOW}[6/8] 🐘 Configuration PostgreSQL...${NC}"
read -p "$(echo -e ${BLUE}🔑 Mot de passe PostgreSQL pour procybershield_user: ${NC})" -s DB_PASSWORD
echo ""

ssh "$VPS_USER@$VPS_HOST" bash << ENDSSH6
    sudo -u postgres psql << EOSQL
        -- Créer la base de données si elle n'existe pas
        SELECT 'CREATE DATABASE procybershield'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'procybershield')\gexec
        
        -- Créer l'utilisateur si il n'existe pas
        DO \\\$\\\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'procybershield_user') THEN
                CREATE USER procybershield_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
            END IF;
        END
        \\\$\\\$;
        
        -- Accorder les privilèges
        GRANT ALL PRIVILEGES ON DATABASE procybershield TO procybershield_user;
EOSQL
    echo "Base de données configurée"
ENDSSH6
echo -e "${GREEN}✅ PostgreSQL configuré${NC}"

# Étape 7: Configuration .env
echo -e "\n${YELLOW}[7/8] 🔐 Configuration des variables d'environnement...${NC}"
echo -e "${BLUE}Remplissez les informations sensibles:${NC}"

read -p "$(echo -e ${BLUE}JWT Access Secret \(256 bits\): ${NC})" JWT_ACCESS
read -p "$(echo -e ${BLUE}JWT Refresh Secret \(256 bits\): ${NC})" JWT_REFRESH
read -p "$(echo -e ${BLUE}Stripe Secret Key: ${NC})" STRIPE_SECRET
read -p "$(echo -e ${BLUE}Stripe Webhook Secret: ${NC})" STRIPE_WEBHOOK
read -p "$(echo -e ${BLUE}Stripe Price ID: ${NC})" STRIPE_PRICE
read -p "$(echo -e ${BLUE}SMTP Password: ${NC})" -s SMTP_PASS
echo ""

ssh "$VPS_USER@$VPS_HOST" bash << ENDSSH7
    cd $VPS_DIR
    cat > .env << ENVEOF
NODE_ENV=production
PORT=3000
API_URL=https://api.cyonix.eu
FRONTEND_URL=https://cyonix.eu

DATABASE_URL=postgresql://procybershield_user:$DB_PASSWORD@localhost:5432/procybershield
DB_HOST=localhost
DB_PORT=5432
DB_NAME=procybershield
DB_USER=procybershield_user
DB_PASSWORD=$DB_PASSWORD

JWT_ACCESS_SECRET=$JWT_ACCESS
JWT_REFRESH_SECRET=$JWT_REFRESH
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

STRIPE_SECRET_KEY=$STRIPE_SECRET
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK
STRIPE_PRICE_ID=$STRIPE_PRICE

PKI_HOST=vps-97b4c29e.vps.ovh.net
PKI_USER=root
PKI_SSH_KEY=/root/.ssh/pki_backend_key
PKI_CERTIFICATES_PATH=/var/certificates
PKI_EASYRSA_PATH=/etc/openvpn/easy-rsa

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@cyonix.eu
SMTP_PASSWORD=$SMTP_PASS
EMAIL_FROM=ProCyberShield <noreply@cyonix.eu>

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5

CORS_ORIGIN=https://cyonix.eu
LOG_LEVEL=info

CERTIFICATE_EXPIRY_DAYS=365
P12_PASSWORD_LENGTH=16
ENVEOF
    
    chmod 600 .env
    mkdir -p logs
    mkdir -p /var/certificates
    chmod 700 /var/certificates
    echo ".env créé et sécurisé"
ENDSSH7
echo -e "${GREEN}✅ Variables d'environnement configurées${NC}"

# Étape 8: Démarrage avec PM2
echo -e "\n${YELLOW}[8/8] 🚀 Démarrage de l'application avec PM2...${NC}"
ssh "$VPS_USER@$VPS_HOST" bash << ENDSSH8
    cd $VPS_DIR
    
    # Arrêter si déjà en cours
    pm2 stop api-procybershield 2>/dev/null || true
    pm2 delete api-procybershield 2>/dev/null || true
    
    # Démarrer
    pm2 start src/server.js --name api-procybershield
    pm2 save
    
    # Configurer démarrage auto
    pm2 startup systemd -u root --hp /root | tail -1 | bash
    
    echo ""
    echo "Application démarrée !"
    pm2 status
ENDSSH8
echo -e "${GREEN}✅ Application démarrée${NC}"

# Résumé final
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ! 🎉        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Informations du déploiement:${NC}"
echo -e "  ${YELLOW}Serveur:${NC} $VPS_HOST"
echo -e "  ${YELLOW}Répertoire:${NC} $VPS_DIR"
echo -e "  ${YELLOW}Application:${NC} api-procybershield (PM2)"
echo ""
echo -e "${BLUE}🔗 Prochaines étapes:${NC}"
echo -e "  1. ${YELLOW}Configurer Nginx:${NC}"
echo -e "     ${GREEN}ssh $VPS_USER@$VPS_HOST${NC}"
echo -e "     ${GREEN}nano /etc/nginx/sites-available/api.cyonix.eu${NC}"
echo ""
echo -e "  2. ${YELLOW}Obtenir certificat SSL:${NC}"
echo -e "     ${GREEN}certbot --nginx -d api.cyonix.eu${NC}"
echo ""
echo -e "  3. ${YELLOW}Configurer le PKI Server:${NC}"
echo -e "     Voir DEPLOYMENT.md - Section PKI"
echo ""
echo -e "  4. ${YELLOW}Tester l'API:${NC}"
echo -e "     ${GREEN}curl https://api.cyonix.eu/api/health${NC}"
echo ""
echo -e "${BLUE}📝 Commandes utiles:${NC}"
echo -e "  ${GREEN}ssh $VPS_USER@$VPS_HOST 'pm2 logs api-procybershield'${NC}"
echo -e "  ${GREEN}ssh $VPS_USER@$VPS_HOST 'pm2 status'${NC}"
echo -e "  ${GREEN}ssh $VPS_USER@$VPS_HOST 'pm2 restart api-procybershield'${NC}"
echo ""
echo -e "${GREEN}✨ Bon déploiement !${NC}"
