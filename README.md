# ArtistLinks — Backend

Backend NestJS pour ArtistLinks, le "LinkedIn de l'industrie musicale africaine".

## Stack
- NestJS 10 + TypeScript
- PostgreSQL via Prisma ORM
- Auth JWT (access + refresh tokens)
- Paiements Mobile Money via CinetPay
- Messagerie temps réel via WebSocket (Socket.IO)

## Modules
- `auth` — inscription, connexion, JWT
- `users` — profils utilisateurs, recherche
- `connections` — demandes de connexion (type LinkedIn)
- `messages` — messagerie privée (REST + WebSocket)
- `payments` — intégration CinetPay, abonnements FREE/PRO/PREMIUM
- `admin` — tableau de bord, gestion des utilisateurs

## Démarrage local
\`\`\`bash
npm install
cp .env.example .env
# remplir les variables dans .env
npx prisma migrate dev
npm run start:dev
\`\`\`

## Déploiement sur Railway
1. Connecter ce repo GitHub à un nouveau projet Railway
2. Ajouter un service PostgreSQL (Railway génère `DATABASE_URL` automatiquement)
3. Renseigner les variables d'environnement (voir `.env.example`)
4. Railway détecte automatiquement NestJS et exécute `npm run build` puis `npm run start:prod`
5. Après le premier déploiement, exécuter la migration Prisma une fois connecté (ou via le build command `prisma migrate deploy && npm run build`)
