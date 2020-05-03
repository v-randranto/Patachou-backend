# Framework

Node/Express, MongoDB/Mongoose

## Config JSON files

Le dossier 'config' contient les fichiers default.json et production.json qui spécifient les variables dépendantes de l'environnement.
L'application utilise un fichier en fonction de la variable d'environnement NODE_ENV=development ou NODE_ENV=production.

Variables contenues dans les fichiers :

{
    "email": {
        "service": "",
        "user": "",
        "pass": "",
        "from": ""
    },
    "db": {
        "url": ""
    },
    "session": {
        "name": "",
        "secret": "",
        "ttl": 0
    }
}
