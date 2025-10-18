#!/bin/bash

# 🎯 Script maître de déploiement - ProCyberShield Backend
# Ce script orchestre tout le processus : Organisation → GitHub → VPS

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║     🛡️  PROCYBERSHIELD BACKEND - DÉPLOIEMENT COMPLET 🚀          ║
║                                                                    ║
║     Organisation → GitHub → VPS Backend                           ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Fonction pour afficher les étapes
show_step() {
    echo -e "\n${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║  $1${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

# ============================================================
# ÉTAPE 0: Vérifications préliminaires
# ============================================================
show_step "ÉTAPE 0: Vérifications préliminaires 🔍"

# Vérifier les fichiers source
REQUIRED_SOURCE_FILES=(
    "backend_server.js"
    "backend_package.js"
    "backend_database.js"
    "backend_models_user.js"
)

echo -e "${YELLOW}Vérification des fichiers source...${NC}"
MISSING_COUNT=0
for file in "${REQUIRED_SOURCE_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "  ${RED}✗ MANQUANT:${NC} $file"
        MISSING_COUNT=$((MISSING_COUNT + 1))
    else
        echo -e "  ${GREEN}✓${NC} $file"
    fi
done

if [ $MISSING_COUNT -gt 0 ]; then
    echo -e "\n${RED}❌ Erreur: $MISSING_COUNT fichier(s) manquant(s)${NC}"
    echo -e "${YELLOW}💡 Assurez-vous d'être dans le bon répertoire avec tous les fichiers backend_*.js${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tous les fichiers source sont présents${NC}"

# Vérifier Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git n'est pas installé${NC}"
    exit 1
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js n'est pas installé localement${NC}"
    echo -e "${BLUE}Ce n'est pas bloquant, mais recommandé pour tester localement${NC}"
fi

# ============================================================
# ÉTAPE 1: Organisation des fichiers
# ============================================================
show_step "ÉTAPE 1: Organisation des fichiers 📁"

if [ -f "organize-backend.sh" ]; then
    echo -e "${YELLOW}Exécution de organize-backend.sh...${NC}"
    chmod +x organize-backend.sh
    ./organize-backend.sh
    
    if [ ! -d "procybershield-backend" ]; then
        echo -e "${RED}❌ Erreur: Le script d'organisation a échoué${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Fichiers organisés avec succès${NC}"
else
    echo -e "${RED}❌ Script organize-backend.sh introuvable${NC}"
    exit 1
fi

# Aller dans le répertoire du projet
cd procybershield-backend

# ============================================================
# ÉTAPE 2: Initialisation Git et push GitHub
# ============================================================
show_step "ÉTAPE 2: Déploiement sur GitHub 🐙"

echo -e "${BLUE}Configuration du repository GitHub:${NC}"
read -p "$(echo -e ${CYAN}🔗 URL du repo GitHub \(ex: https://github.com/username/procybershield-backend.git\): ${NC})" GITHUB_URL

if [ -z "$GITHUB_URL" ]; then
    echo -e "${RED}❌ URL GitHub requise${NC}"
    exit 1
fi

read -p "$(echo -e ${CYAN}🌿 Nom de la branche \(défaut: main\): ${NC})" BRANCH
BRANCH=${BRANCH:-main}

echo -e "\n${YELLOW}Initialisation du dépôt Git...${NC}"

# Initialiser Git
if [ ! -d ".git" ]; then
    git init
    echo -e "${GREEN}✅ Git initialisé${NC}"
fi

# Ajouter tous les fichiers
git add .

# Créer le commit
echo -e "${YELLOW}Création du commit...${NC}"
git commit -m "🚀 Initial commit - ProCyberShield Backend

- Configuration complète Node.js/Express
- Authentification JWT  
- Intégration Stripe
- Service PKI (Easy-RSA)
- Templates email
- Documentation complète

Stack: Node.js 20 + Express + PostgreSQL + Stripe
" 2>/dev/null || echo -e "${YELLOW}Commit déjà créé${NC}"

# Configurer le remote
if ! git remote | grep -q "origin"; then
    git remote add origin "$GITHUB_URL"
else
    git remote set-url origin "$GITHUB_URL"
fi

# Renommer la branche
git branch -M "$BRANCH"

# Push
echo -e "${YELLOW}Push vers GitHub...${NC}"
if git push -u origin "$BRANCH" 2>&1; then
    echo -e "${GREEN}✅ Code poussé sur GitHub avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du push${NC}"
    echo -e "${YELLOW}💡 Assurez-vous que:${NC}"
    echo -e "  1. Le repo existe sur GitHub"
    echo -e "  2. Vous êtes authentifié (git config --global user.name/email)"
    echo -e "  3. Vous avez les droits d'écriture"
    exit 1
fi

# ============================================================
# ÉTAPE 3: Choix du mode de déploiement VPS
# ============================================================
show_step "ÉTAPE 3: Déploiement sur VPS 🖥️"

echo -e "${BLUE}Comment voulez-vous déployer sur le VPS ?${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Déploiement automatique (recommandé)"
echo -e "     → Le script se connecte au VPS et installe tout"
echo ""
echo -e "  ${CYAN}2.${NC} Instructions manuelles"
echo -e "     → Afficher les commandes à exécuter sur le VPS"
echo ""
echo -e "  ${CYAN}3.${NC} Passer cette étape"
echo -e "     → Déployer manuellement plus tard"
echo ""

read -p "$(echo -e ${YELLOW}Votre choix \(1/2/3\): ${NC})" DEPLOY_CHOICE

case $DEPLOY_CHOICE in
    1)
        # Déploiement automatique
        echo -e "\n${YELLOW}🚀 Déploiement automatique sur VPS...${NC}"
        
        VPS_HOST="vps-c9da2062.vps.ovh.net"
        VPS_USER="root"
        
        echo -e "${BLUE}Test de connexion SSH...${NC}"
        if ! ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo 'SSH OK'" &>/dev/null; then
            echo -e "${RED}❌ Impossible de se connecter au VPS${NC}"
            echo -e "${YELLOW}💡 Configurez d'abord l'accès SSH, puis relancez le script${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}✅ Connexion SSH réussie${NC}"
        echo -e "\n${YELLOW}📝 Le déploiement va:${NC}"
        echo -e "  • Installer Node.js 20"
        echo -e "  • Installer PostgreSQL"
        echo -e "  • Cloner le repo GitHub"
        echo -e "  • Configurer l'environnement"
        echo -e "  • Démarrer l'application avec PM2"
        echo ""
        
        read -p "$(echo -e ${CYAN}Continuer? \(y/n\): ${NC})" CONFIRM
        
        if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
            # Collecter les informations sensibles
            echo -e "\n${BLUE}🔐 Configuration des secrets:${NC}"
            read -p "$(echo -e ${CYAN}Mot de passe PostgreSQL: ${NC})" -s DB_PASS
            echo ""
            read -p "$(echo -e ${CYAN}JWT Access Secret: ${NC})" JWT_ACCESS
            read -p "$(echo -e ${CYAN}JWT Refresh Secret: ${NC})" JWT_REFRESH
            read -p "$(echo -e ${CYAN}Stripe Secret Key: ${NC})" STRIPE_KEY
            read -p "$(echo -e ${CYAN}Stripe Webhook Secret: ${NC})" STRIPE_WEBHOOK
            read -p "$(echo -e ${CYAN}Stripe Price ID: ${NC})" STRIPE_PRICE
            read -p "$(echo -e ${CYAN}SMTP Password: ${NC})" -s SMTP_PASS
            echo ""
            
            # Déploiement
            echo -e "\n${YELLOW}Déploiement en cours...${NC}"
            
            ssh "$VPS_USER@$VPS_HOST" bash << ENDSSH
                set -e
                
                # Installation Node.js
                echo "📦 Installation Node.js..."
                if ! command -v node &> /dev/null; then
                    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
                    apt-get install -y nodejs
                fi
                
                # Installation PostgreSQL
                echo "🐘 Installation PostgreSQL..."
                if ! command -v psql &> /dev/null; then
                    apt-get update
                    apt-get install -y postgresql postgresql-contrib
                    systemctl start postgresql
                    systemctl enable postgresql
                fi
                
                # Installation PM2
                echo "⚙️ Installation PM2..."
                npm install -g pm2 2>/dev/null || true
                
                # Clonage du repo
                echo "📥 Clonage du repository..."
                if [ -d "/var/www/api-procybershield" ]; then
                    cd /var/www/api-procybershield
                    git pull origin $BRANCH
                else
                    cd /var/www
                    git clone $GITHUB_URL api-procybershield
                fi
                
                cd /var/www/api-procybershield
                
                # Installation dépendances
                echo "📦 Installation dépendances..."
                npm install --production
                
                # Configuration PostgreSQL
                echo "🐘 Configuration PostgreSQL..."
                sudo -u postgres psql << EOSQL
                    SELECT 'CREATE DATABASE procybershield' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'procybershield')\gexec
                    DO \\\\\$\\\\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'procybershield_user') THEN CREATE USER procybershield_user WITH ENCRYPTED PASSWORD '$DB_PASS'; END IF; END \\\\\$\\\\\$;
                    GRANT ALL PRIVILEGES ON DATABASE procybershield TO procybershield_user;
EOSQL
                
                # Création .env
                echo "🔐 Configuration .env..."
                cat > .env << ENVEOF
NODE_ENV=production
PORT=3000
API_URL=https://api.cyonix.eu
FRONTEND_URL=https://cyonix.eu
DATABASE_URL=postgresql://procybershield_user:$DB_PASS@localhost:5432/procybershield
JWT_ACCESS_SECRET=$JWT_ACCESS
JWT_REFRESH_SECRET=$JWT_REFRESH
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
STRIPE_SECRET_KEY=$STRIPE_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK
STRIPE_PRICE_ID=$STRIPE_PRICE
PKI_HOST=vps-97b4c29e.vps.ovh.net
PKI_USER=root
PKI_SSH_KEY=/root/.ssh/pki_backend_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@cyonix.eu
SMTP_PASSWORD=$SMTP_PASS
CORS_ORIGIN=https://cyonix.eu
LOG_LEVEL=info
ENVEOF
                
                chmod 600 .env
                mkdir -p logs /var/certificates
                chmod 700 /var/certificates
                
                # Démarrage PM2
                echo "🚀 Démarrage application..."
                pm2 stop api-procybershield 2>/dev/null || true
                pm2 delete api-procybershield 2>/dev/null || true
                pm2 start src/server.js --name api-procybershield
                pm2 save
                pm2 startup systemd -u root --hp /root | tail -1 | bash 2>/dev/null || true
                
                echo "✅ Déploiement terminé!"
                pm2 status
ENDSSH
            
            echo -e "${GREEN}✅ Déploiement VPS terminé avec succès !${NC}"
        fi
        ;;
        
    2)
        # Instructions manuelles
        echo -e "\n${BLUE}📋 Instructions de déploiement manuel:${NC}"
        echo ""
        echo -e "${CYAN}1. Connectez-vous au VPS:${NC}"
        echo -e "   ${GREEN}ssh root@vps-c9da2062.vps.ovh.net${NC}"
        echo ""
        echo -e "${CYAN}2. Clonez le repository:${NC}"
        echo -e "   ${GREEN}cd /var/www${NC}"
        echo -e "   ${GREEN}git clone $GITHUB_URL api-procybershield${NC}"
        echo -e "   ${GREEN}cd api-procybershield${NC}"
        echo ""
        echo -e "${CYAN}3. Suivez le guide DEPLOYMENT.md${NC}"
        echo -e "   ${GREEN}cat DEPLOYMENT.md${NC}"
        ;;
        
    3)
        echo -e "${YELLOW}⏭️  Déploiement VPS ignoré${NC}"
        ;;
        
    *)
        echo -e "${RED}Choix invalide${NC}"
        ;;
esac

# ============================================================
# RÉSUMÉ FINAL
# ============================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║          ✨ DÉPLOIEMENT COMPLET TERMINÉ ! 🎉              ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Récapitulatif:${NC}"
echo -e "  ${GREEN}✅${NC} Fichiers organisés"
echo -e "  ${GREEN}✅${NC} Code sur GitHub: $GITHUB_URL"
if [ "$DEPLOY_CHOICE" = "1" ]; then
    echo -e "  ${GREEN}✅${NC} Application déployée sur VPS"
fi
echo ""
echo -e "${BLUE}🔗 Liens importants:${NC}"
echo -e "  ${CYAN}Frontend:${NC} https://cyonix.eu"
echo -e "  ${CYAN}Backend:${NC} https://api.cyonix.eu (à configurer)"
echo -e "  ${CYAN}GitHub:${NC} $GITHUB_URL"
echo ""

if [ "$DEPLOY_CHOICE" = "1" ]; then
    echo -e "${BLUE}🎯 Prochaines étapes critiques:${NC}"
    echo ""
    echo -e "${YELLOW}1. Configurer Nginx + SSL:${NC}"
    echo -e "   ${GREEN}ssh root@vps-c9da2062.vps.ovh.net${NC}"
    echo -e "   ${GREEN}nano /etc/nginx/sites-available/api.cyonix.eu${NC}"
    echo -e "   ${BLUE}# Copier la config depuis DEPLOYMENT.md${NC}"
    echo -e "   ${GREEN}ln -s /etc/nginx/sites-available/api.cyonix.eu /etc/nginx/sites-enabled/${NC}"
    echo -e "   ${GREEN}nginx -t && systemctl reload nginx${NC}"
    echo -e "   ${GREEN}certbot --nginx -d api.cyonix.eu${NC}"
    echo ""
    echo -e "${YELLOW}2. Configurer le serveur PKI:${NC}"
    echo -e "   ${GREEN}ssh root@vps-97b4c29e.vps.ovh.net${NC}"
    echo -e "   ${GREEN}apt-get install -y easy-rsa openvpn${NC}"
    echo -e "   ${GREEN}make-cadir /etc/openvpn/easy-rsa${NC}"
    echo -e "   ${GREEN}cd /etc/openvpn/easy-rsa${NC}"
    echo -e "   ${GREEN}./easyrsa init-pki${NC}"
    echo -e "   ${GREEN}./easyrsa build-ca nopass${NC}"
    echo ""
    echo -e "${YELLOW}3. Configurer SSH entre Backend et PKI:${NC}"
    echo -e "   ${BLUE}# Sur VPS Backend:${NC}"
    echo -e "   ${GREEN}ssh-keygen -t rsa -b 4096 -f /root/.ssh/pki_backend_key -N \"\"${NC}"
    echo -e "   ${GREEN}cat /root/.ssh/pki_backend_key.pub${NC}"
    echo -e "   ${BLUE}# Copier la clé dans authorized_keys du VPS PKI${NC}"
    echo ""
    echo -e "${YELLOW}4. Configurer Stripe Webhook:${NC}"
    echo -e "   ${CYAN}https://dashboard.stripe.com/webhooks${NC}"
    echo -e "   ${BLUE}URL:${NC} https://api.cyonix.eu/api/webhooks/stripe"
    echo -e "   ${BLUE}Events:${NC} checkout.session.completed, customer.subscription.*"
    echo ""
    echo -e "${YELLOW}5. Tester l'API:${NC}"
    echo -e "   ${GREEN}curl https://api.cyonix.eu/api/health${NC}"
    echo ""
else
    echo -e "${BLUE}🎯 Prochaines étapes:${NC}"
    echo -e "  1. Déployer sur le VPS (voir DEPLOYMENT.md)"
    echo -e "  2. Configurer Nginx + SSL"
    echo -e "  3. Configurer le serveur PKI"
    echo -e "  4. Configurer les webhooks Stripe"
    echo -e "  5. Tester l'API"
fi

echo ""
echo -e "${BLUE}📝 Commandes utiles:${NC}"
echo -e "  ${GREEN}# Voir les logs${NC}"
echo -e "  ssh root@vps-c9da2062.vps.ovh.net 'pm2 logs api-procybershield'"
echo ""
echo -e "  ${GREEN}# Redémarrer${NC}"
echo -e "  ssh root@vps-c9da2062.vps.ovh.net 'pm2 restart api-procybershield'"
echo ""
echo -e "  ${GREEN}# Status${NC}"
echo -e "  ssh root@vps-c9da2062.vps.ovh.net 'pm2 status'"
echo ""
echo -e "  ${GREEN}# Monitoring${NC}"
echo -e "  ssh root@vps-c9da2062.vps.ovh.net 'pm2 monit'"
echo ""
echo -e "${BLUE}📚 Documentation complète:${NC}"
echo -e "  ${CYAN}cd procybershield-backend${NC}"
echo -e "  ${CYAN}cat README.md${NC}"
echo -e "  ${CYAN}cat DEPLOYMENT.md${NC}"
echo ""
echo -e "${GREEN}✨ Félicitations ! Le backend est prêt à être utilisé ! 🚀${NC}"
echo ""
