#!/bin/bash

# 🚀 Script de déploiement GitHub - ProCyberShield Backend
# Ce script initialise un repo Git et pousse sur GitHub

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      🚀 ProCyberShield Backend - Déploiement GitHub      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier qu'on est dans le bon répertoire
PROJECT_DIR="procybershield-backend"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Erreur: Le répertoire $PROJECT_DIR n'existe pas${NC}"
    echo -e "${YELLOW}💡 Exécutez d'abord: ./organize-backend.sh${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# Vérifier que les fichiers essentiels existent
if [ ! -f "package.json" ] || [ ! -f "src/server.js" ]; then
    echo -e "${RED}❌ Erreur: Fichiers essentiels manquants${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 Configuration du dépôt GitHub${NC}"
echo ""

# Demander l'URL du repo GitHub
read -p "$(echo -e ${BLUE}🔗 URL du repo GitHub \(ex: https://github.com/username/procybershield-backend.git\): ${NC})" GITHUB_URL

if [ -z "$GITHUB_URL" ]; then
    echo -e "${RED}❌ URL requise${NC}"
    exit 1
fi

# Demander la branche
read -p "$(echo -e ${BLUE}🌿 Nom de la branche \(défaut: main\): ${NC})" BRANCH
BRANCH=${BRANCH:-main}

# Initialiser Git si nécessaire
if [ ! -d ".git" ]; then
    echo -e "\n${YELLOW}🔧 Initialisation du dépôt Git...${NC}"
    git init
    echo -e "${GREEN}✅ Git initialisé${NC}"
else
    echo -e "${YELLOW}⚠️  Dépôt Git déjà initialisé${NC}"
fi

# Vérifier que .env n'est pas committé
if [ -f ".env" ]; then
    echo -e "${RED}⚠️  ATTENTION: Le fichier .env existe${NC}"
    echo -e "${YELLOW}🔒 Assurez-vous qu'il est dans .gitignore (déjà fait normalement)${NC}"
fi

# Créer un fichier .env.example s'il n'existe pas
if [ ! -f ".env.example" ]; then
    echo -e "${YELLOW}📝 Création de .env.example...${NC}"
    cat > .env.example << 'ENVEOF'
# Application
NODE_ENV=production
PORT=3000
API_URL=https://api.cyonix.eu
FRONTEND_URL=https://cyonix.eu

# Database PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/procybershield
DB_HOST=localhost
DB_PORT=5432
DB_NAME=procybershield
DB_USER=procybershield_user
DB_PASSWORD=CHANGE_ME

# JWT Secrets (générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_ACCESS_SECRET=GENERATE_RANDOM_256_BIT_KEY
JWT_REFRESH_SECRET=GENERATE_RANDOM_256_BIT_KEY
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
STRIPE_PRICE_ID=price_YOUR_PRICE_ID

# PKI Server SSH
PKI_HOST=vps-97b4c29e.vps.ovh.net
PKI_USER=root
PKI_SSH_KEY=/root/.ssh/pki_backend_key
PKI_CERTIFICATES_PATH=/var/certificates
PKI_EASYRSA_PATH=/etc/openvpn/easy-rsa

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@cyonix.eu
SMTP_PASSWORD=YOUR_APP_PASSWORD
EMAIL_FROM=ProCyberShield <noreply@cyonix.eu>

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5

# CORS
CORS_ORIGIN=https://cyonix.eu

# Logging
LOG_LEVEL=info

# Certificate
CERTIFICATE_EXPIRY_DAYS=365
P12_PASSWORD_LENGTH=16
ENVEOF
    echo -e "${GREEN}✅ .env.example créé${NC}"
fi

# Ajouter tous les fichiers
echo -e "\n${YELLOW}📦 Ajout des fichiers...${NC}"
git add .

# Afficher le statut
echo -e "\n${BLUE}📊 Fichiers à committer:${NC}"
git status --short

# Demander confirmation
echo ""
read -p "$(echo -e ${YELLOW}❓ Voulez-vous committer et pousser ces fichiers? \(y/n\): ${NC})" CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${RED}❌ Déploiement annulé${NC}"
    exit 0
fi

# Commit
echo -e "\n${YELLOW}💾 Création du commit...${NC}"
COMMIT_MSG="🚀 Initial commit - ProCyberShield Backend

- Configuration complète Node.js/Express
- Authentification JWT
- Intégration Stripe
- Service PKI (Easy-RSA)
- Templates email
- Documentation complète

Stack: Node.js 20 + Express + PostgreSQL + Stripe
"

git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✅ Commit créé${NC}"

# Ajouter le remote s'il n'existe pas
if ! git remote | grep -q "origin"; then
    echo -e "\n${YELLOW}🔗 Ajout du remote origin...${NC}"
    git remote add origin "$GITHUB_URL"
    echo -e "${GREEN}✅ Remote ajouté${NC}"
else
    echo -e "${YELLOW}⚠️  Remote origin existe déjà${NC}"
    git remote set-url origin "$GITHUB_URL"
    echo -e "${GREEN}✅ Remote URL mise à jour${NC}"
fi

# Renommer la branche en main/master si nécessaire
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo -e "\n${YELLOW}🌿 Renommage de la branche $CURRENT_BRANCH → $BRANCH${NC}"
    git branch -M "$BRANCH"
fi

# Pousser vers GitHub
echo -e "\n${YELLOW}🚀 Push vers GitHub...${NC}"
echo -e "${BLUE}📤 git push -u origin $BRANCH${NC}"

if git push -u origin "$BRANCH" 2>&1 | tee /tmp/git-push.log; then
    echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            ✅ DÉPLOIEMENT GITHUB RÉUSSI ! 🎉              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}🔗 Votre repo:${NC} $GITHUB_URL"
    echo -e "${BLUE}🌿 Branche:${NC} $BRANCH"
    echo ""
    echo -e "${YELLOW}📋 Prochaines étapes pour le déploiement VPS:${NC}"
    echo ""
    echo -e "  ${BLUE}1. SSH vers VPS Backend:${NC}"
    echo -e "     ${GREEN}ssh root@vps-c9da2062.vps.ovh.net${NC}"
    echo ""
    echo -e "  ${BLUE}2. Cloner le repo:${NC}"
    echo -e "     ${GREEN}cd /var/www${NC}"
    echo -e "     ${GREEN}git clone $GITHUB_URL api-procybershield${NC}"
    echo -e "     ${GREEN}cd api-procybershield${NC}"
    echo ""
    echo -e "  ${BLUE}3. Installer les dépendances:${NC}"
    echo -e "     ${GREEN}npm install --production${NC}"
    echo ""
    echo -e "  ${BLUE}4. Configurer l'environnement:${NC}"
    echo -e "     ${GREEN}cp .env.example .env${NC}"
    echo -e "     ${GREEN}nano .env${NC} ${YELLOW}# Remplir les valeurs${NC}"
    echo ""
    echo -e "  ${BLUE}5. Configurer PostgreSQL:${NC}"
    echo -e "     ${GREEN}sudo -u postgres psql${NC}"
    echo -e "     ${YELLOW}CREATE DATABASE procybershield;${NC}"
    echo -e "     ${YELLOW}CREATE USER procybershield_user WITH PASSWORD 'xxx';${NC}"
    echo -e "     ${YELLOW}GRANT ALL ON DATABASE procybershield TO procybershield_user;${NC}"
    echo ""
    echo -e "  ${BLUE}6. Démarrer avec PM2:${NC}"
    echo -e "     ${GREEN}pm2 start src/server.js --name api-procybershield${NC}"
    echo -e "     ${GREEN}pm2 save${NC}"
    echo -e "     ${GREEN}pm2 startup${NC}"
    echo ""
    echo -e "  ${BLUE}7. Configurer Nginx + SSL:${NC}"
    echo -e "     ${YELLOW}Voir DEPLOYMENT.md pour les détails complets${NC}"
    echo ""
    echo -e "${GREEN}✨ Bon déploiement !${NC}"
else
    echo -e "\n${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ❌ ERREUR LORS DU PUSH                       ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}💡 Causes possibles:${NC}"
    echo -e "  1. ${BLUE}Repo GitHub n'existe pas${NC}"
    echo -e "     → Créez le repo sur https://github.com/new"
    echo ""
    echo -e "  2. ${BLUE}Problème d'authentification${NC}"
    echo -e "     → Vérifiez vos credentials Git"
    echo -e "     → Ou utilisez SSH: git remote set-url origin git@github.com:username/repo.git"
    echo ""
    echo -e "  3. ${BLUE}Branche protégée${NC}"
    echo -e "     → Désactivez la protection de branche temporairement"
    echo ""
    echo -e "${YELLOW}📝 Logs complets:${NC} /tmp/git-push.log"
    exit 1
fi
