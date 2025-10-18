# 🚀 QUICKSTART - ProCyberShield Backend

## 📋 Vous avez les fichiers, maintenant quoi ?

Vous êtes dans le répertoire `Dev-Backend` avec tous les fichiers `backend_*.js`. Ce guide vous explique comment tout déployer en **3 commandes**.

---

## ⚡ OPTION 1: Déploiement Ultra-Rapide (RECOMMANDÉ)

```bash
# Étape 1: Rendre le script exécutable
chmod +x deploy-all.sh

# Étape 2: Lancer le déploiement complet
./deploy-all.sh
```

**C'est tout !** 🎉

Le script va :
1. ✅ Organiser tous les fichiers dans `procybershield-backend/`
2. ✅ Initialiser Git et pousser sur GitHub
3. ✅ Déployer automatiquement sur le VPS (optionnel)

**Durée estimée**: 10-15 minutes

---

## 🔧 OPTION 2: Déploiement Étape par Étape

### Étape 1: Organisation des fichiers

```bash
chmod +x organize-backend.sh
./organize-backend.sh
```

Résultat : Création de `procybershield-backend/` avec toute la structure.

### Étape 2: Push sur GitHub

```bash
cd procybershield-backend
chmod +x ../deploy-to-github.sh
../deploy-to-github.sh
```

Vous serez invité à entrer :
- URL du repo GitHub
- Nom de la branche (défaut: main)

### Étape 3: Déploiement VPS

```bash
chmod +x ../deploy-to-vps.sh
../deploy-to-vps.sh
```

Vous serez invité à entrer :
- URL GitHub (du repo créé à l'étape 2)
- Secrets (JWT, Stripe, SMTP, etc.)

---

## 📂 Structure finale

```
Dev-Backend/
├── backend_*.js              # Fichiers source (peuvent être supprimés après)
├── organize-backend.sh       # Script d'organisation
├── deploy-to-github.sh       # Script GitHub
├── deploy-to-vps.sh         # Script VPS
├── deploy-all.sh            # Script maître ⭐
├── QUICKSTART.md            # Ce fichier
└── procybershield-backend/  # 🎯 Projet organisé
    ├── src/
    │   ├── server.js
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   └── utils/
    ├── logs/
    ├── package.json
    ├── .env.example
    ├── .gitignore
    ├── README.md
    └── DEPLOYMENT.md
```

---

## 🔑 Informations à préparer

Avant de lancer les scripts, préparez :

### Pour GitHub
- [ ] URL du repo GitHub (ex: `https://github.com/username/procybershield-backend.git`)
- [ ] Accès Git configuré (`git config --global user.name` et `user.email`)

### Pour le VPS
- [ ] Accès SSH au VPS Backend (`vps-c9da2062.vps.ovh.net`)
- [ ] Mot de passe PostgreSQL (à choisir)
- [ ] JWT Access Secret (256 bits) - Générer avec : `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] JWT Refresh Secret (256 bits) - Idem
- [ ] Stripe Secret Key (depuis dashboard.stripe.com)
- [ ] Stripe Webhook Secret (après configuration webhook)
- [ ] Stripe Price ID (produit 5€/mois)
- [ ] SMTP Password (app password Gmail)

### Pour le serveur PKI
- [ ] Accès SSH au VPS PKI (`vps-97b4c29e.vps.ovh.net`)

---

## 🎯 Scripts disponibles

| Script | Description | Quand l'utiliser |
|--------|-------------|------------------|
| `deploy-all.sh` | **Tout-en-un** | Première fois |
| `organize-backend.sh` | Organisation uniquement | Réorganiser les fichiers |
| `deploy-to-github.sh` | GitHub uniquement | Pousser sur un nouveau repo |
| `deploy-to-vps.sh` | VPS uniquement | Déployer/mettre à jour VPS |

---

## ✅ Vérification post-déploiement

### 1. Vérifier l'organisation locale

```bash
cd procybershield-backend
ls -la src/

# Devrait afficher :
# config/ controllers/ middleware/ models/ routes/ services/ utils/
```

### 2. Vérifier GitHub

```bash
git remote -v
# Devrait afficher votre repo GitHub
```

### 3. Vérifier le VPS

```bash
ssh root@vps-c9da2062.vps.ovh.net 'pm2 status'
# Devrait afficher : api-procybershield | online
```

### 4. Tester l'API

```bash
curl https://api.cyonix.eu/api/health
# Devrait retourner : {"success":true,"status":"healthy",...}
```

---

## 🐛 Dépannage

### Problème : "Permission denied" sur les scripts

```bash
chmod +x *.sh
```

### Problème : Git push échoue

```bash
# Vérifier authentification Git
git config --global user.name
git config --global user.email

# Ou utiliser SSH au lieu de HTTPS
git remote set-url origin git@github.com:username/repo.git
```

### Problème : SSH vers VPS échoue

```bash
# Tester la connexion
ssh -v root@vps-c9da2062.vps.ovh.net

# Vérifier les clés SSH
ssh-add -l
```

### Problème : PM2 n'a pas démarré l'app

```bash
ssh root@vps-c9da2062.vps.ovh.net

# Voir les logs
pm2 logs api-procybershield

# Redémarrer manuellement
cd /var/www/api-procybershield
pm2 start src/server.js --name api-procybershield
```

---

## 📞 Étapes critiques après déploiement

### 1. Configurer Nginx (OBLIGATOIRE)

Le backend tourne sur le port 3000, mais il faut Nginx pour HTTPS.

```bash
ssh root@vps-c9da2062.vps.ovh.net

# Créer la config Nginx
nano /etc/nginx/sites-available/api.cyonix.eu
# Copier la config depuis DEPLOYMENT.md

# Activer
ln -s /etc/nginx/sites-available/api.cyonix.eu /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# SSL
certbot --nginx -d api.cyonix.eu
```

### 2. Configurer le serveur PKI (OBLIGATOIRE)

```bash
ssh root@vps-97b4c29e.vps.ovh.net

# Installer Easy-RSA
apt-get install -y easy-rsa openvpn
make-cadir /etc/openvpn/easy-rsa
cd /etc/openvpn/easy-rsa

# Initialiser PKI
./easyrsa init-pki
./easyrsa build-ca nopass

# Créer le dossier certificats
mkdir -p /var/certificates
chmod 700 /var/certificates
```

### 3. Configurer SSH Backend → PKI (OBLIGATOIRE)

```bash
# Sur VPS Backend
ssh root@vps-c9da2062.vps.ovh.net
ssh-keygen -t rsa -b 4096 -f /root/.ssh/pki_backend_key -N ""
cat /root/.ssh/pki_backend_key.pub

# Copier la clé publique dans authorized_keys du VPS PKI
```

### 4. Configurer Stripe Webhook (OBLIGATOIRE)

1. Aller sur https://dashboard.stripe.com/webhooks
2. Créer un endpoint : `https://api.cyonix.eu/api/webhooks/stripe`
3. Sélectionner les events :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copier le webhook secret
5. Mettre à jour `.env` sur le VPS

### 5. Tester le flux complet

```bash
# Test 1: Health check
curl https://api.cyonix.eu/api/health

# Test 2: Signup
curl -X POST https://api.cyonix.eu/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstname": "John",
    "lastname": "Doe"
  }'

# Test 3: Login
curl -X POST https://api.cyonix.eu/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

---

## 🎓 Ressources

- **README.md** : Documentation complète du backend
- **DEPLOYMENT.md** : Guide de déploiement détaillé
- **Documentation Stripe** : https://stripe.com/docs
- **Documentation Easy-RSA** : https://easy-rsa.readthedocs.io
- **PM2 Guide** : https://pm2.keymetrics.io/docs

---

## ✨ Vous avez terminé !

Si tout fonctionne :
- ✅ Backend sur `https://api.cyonix.eu`
- ✅ Frontend sur `https://cyonix.eu`
- ✅ PKI opérationnel
- ✅ Paiements Stripe fonctionnels
- ✅ Génération certificats automatique

**Félicitations ! 🎉**

Le système est prêt à accepter des utilisateurs et générer des certificats PKI automatiquement après paiement.

---

## 🆘 Besoin d'aide ?

- Consultez les logs : `ssh root@vps-c9da2062.vps.ovh.net 'pm2 logs api-procybershield'`
- Vérifiez la documentation : `cat procybershield-backend/DEPLOYMENT.md`
- Contactez le support : support@cyonix.eu

**Bon courage ! 🚀**
