Plateforme backend: NodeJS
Base de données: MongoDB Atlas

# Principaux Modules

Express
MongoDB/Mongoose : gestion de la DBB mongoDB
Socket.io : implémentation du temps réel
Dotenv : gestion des variables d'environnement
Winston : implémentation du logging
Jwt : implémentation de l'authentification avec jeton
Helmet, cors

## Variables d'environnement

Les variables suivantes sont paramétrées dans le fichier .env :

Pour l'envoi d'email:
    EMAIL_SERVICE=""
    EMAIL_USER=""
    EMAIL_PASS=""
    EMAIL_FROM=""

des options de la session:
    SESSION_NAME=""
    SESSION_SECRET=""
    SESSION_TTL=""

la DBB MongoDb
    DB_URL=""