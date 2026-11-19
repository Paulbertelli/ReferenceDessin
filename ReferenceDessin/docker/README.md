# Configuration Docker et déploiement sur Raspberry Pi

## Environnements Docker

| Fichier | Utilisation |
|---|---|
| `compose.dev.yaml` | Développement local |
| `compose.prod-test.yaml` | Simulation locale de la production |
| `compose.pi.yaml` | Production sur Raspberry Pi |
| `Caddyfile.prod-test` | Configuration HTTPS de simulation |
| `Caddyfile.pi` | Configuration HTTPS de production |
| `certificates/` | Certificats locaux non versionnés |
| `.env.dev` | Développement local |
| `.env.prod-test` | Simulation de production |
| `.env.pi.example` | Modèle versionné pour la production |
| `.env.pi` | Secrets de production sur le Pi |

## Architecture de production

L'application est déployée avec Docker Compose et utilise PostgreSQL, Caddy et Cloudflare Tunnel.

- Accès public : `https://app.reference-dessin.fr`
- Accès local : `https://pi-paul.local:8443`
- Proxy Caddy : `172.30.250.10`
- Proxy cloudflared : `172.30.250.11`

## Configuration des secrets

Le fichier `.env.pi.example` fournit un modèle de configuration pour PostgreSQL, Google OAuth, Pexels, Pinterest et Cloudflare Tunnel.

Chaque conteneur reçoit uniquement les variables nécessaires à son fonctionnement.

Le fichier `.env.pi` ne doit jamais être versionné dans Git. Sur le Raspberry Pi, ses permissions doivent être limitées au propriétaire (`chmod 600`).

## Certificat HTTPS interne

Cloudflare Tunnel communique avec Caddy en HTTPS. Pour vérifier le certificat présenté par Caddy, cloudflared doit disposer de son certificat racine.

Après le premier démarrage de Caddy, exécuter sur le Raspberry Pi :

```bash
cd ~/reference-dessin
mkdir -p certificates

docker cp referencedessin-pi-caddy-1:/data/caddy/pki/authorities/local/root.crt ./certificates/caddy-root.crt

chmod 644 certificates/caddy-root.crt
```

Le certificat est monté en lecture seule dans le conteneur cloudflared, à l'emplacement `/etc/cloudflared/caddy-root.crt`.

Les certificats locaux sont exclus de Git et du contexte de construction Docker.

Ne jamais copier ni versionner la clé privée de l'autorité de certification. Préserver les volumes Caddy pour conserver cette autorité.

En cas de recréation de l'autorité, extraire à nouveau son certificat racine et recréer le conteneur cloudflared.

### Migration d'un déploiement existant

Avant d'appliquer la nouvelle configuration Docker Compose, exécuter sur le Raspberry Pi :

```bash
cd ~/reference-dessin
mkdir -p certificates
cp caddy-root.crt certificates/caddy-root.crt
chmod 644 certificates/caddy-root.crt
```

Conserver l'ancien certificat jusqu'à validation du fonctionnement du tunnel avec le nouveau chemin.

## Premier démarrage

Depuis le dossier `~/reference-dessin` du Raspberry Pi :

1. Démarrer Caddy et les services dont il dépend :

```bash
docker compose --env-file .env.pi -f compose.pi.yaml up -d caddy
```

2. Extraire le certificat racine Caddy selon la procédure précédente.

3. Démarrer cloudflared :

```bash
docker compose --env-file .env.pi -f compose.pi.yaml up -d cloudflared
```

4. Vérifier l'état des conteneurs :

```bash
docker compose --env-file .env.pi -f compose.pi.yaml ps
```

5. Vérifier que le tunnel apparaît comme `Healthy` dans Cloudflare.

Pour les démarrages suivants, lorsque le certificat existe déjà :

```bash
docker compose --env-file .env.pi -f compose.pi.yaml up -d
```

## Mise à jour de la production

### Préparation

- Valider la version en simulation locale avec `compose.prod-test.yaml`.
- Fusionner `dev` dans `main` après validation de la CI.
- Vérifier la publication des deux images Docker sur GHCR.
- Identifier le SHA complet du commit publié.
- Sauvegarder les configurations et la base PostgreSQL.
- Conserver les images précédentes sous le tag `rollback`.

### Sauvegarde préalable

Sur le Raspberry Pi :

```bash
cd ~/reference-dessin
umask 077

BACKUP_DIR="$HOME/reference-dessin-rollback-$(date +%Y%m%d-%H%M%S)"
mkdir -m 700 "$BACKUP_DIR"

cp -p compose.pi.yaml Caddyfile.pi .env.pi "$BACKUP_DIR/"
cp -pr certificates "$BACKUP_DIR/"

docker exec referencedessin-pi-postgres-1 \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$BACKUP_DIR/database.dump"

docker exec -i referencedessin-pi-postgres-1 \
  pg_restore --list < "$BACKUP_DIR/database.dump"
```

Vérifier le succès des commandes. Copier la sauvegarde PostgreSQL
sur le Mac et comparer les empreintes SHA-256 avant le déploiement.
Si la production a continué à recevoir des écritures, refaire une sauvegarde
juste avant la bascule. Pour éviter toute perte de données en cas de
restauration, interrompre les écritures avant cette dernière sauvegarde.
Les sauvegardes manuelles hors des répertoires automatisés doivent être
supprimées manuellement selon la durée de conservation prévue.

Conserver les images actuellement utilisées :

```bash
docker tag \
  "$(docker inspect -f '{{.Image}}' referencedessin-pi-reference-dessin-app-1)" \
  ghcr.io/paulbertelli/reference-dessin:rollback

docker tag \
  "$(docker inspect -f '{{.Image}}' referencedessin-pi-migrations-1)" \
  ghcr.io/paulbertelli/reference-dessin-migrations:rollback
```

### Téléchargement des images

Sur le Raspberry Pi, remplacer `SHA_DU_COMMIT` par le SHA complet publié :

```bash
RELEASE_SHA="SHA_DU_COMMIT"

docker pull ghcr.io/paulbertelli/reference-dessin:$RELEASE_SHA
docker pull ghcr.io/paulbertelli/reference-dessin-migrations:$RELEASE_SHA
```

### Déploiement

Mettre à jour les références dans `.env.pi` :

```dotenv
APP_IMAGE=ghcr.io/paulbertelli/reference-dessin:<SHA_DU_COMMIT>
MIGRATIONS_IMAGE=ghcr.io/paulbertelli/reference-dessin-migrations:<SHA_DU_COMMIT>
```

Remplacer les deux placeholders par le même SHA complet.
Appliquer les éventuelles modifications des fichiers de configuration,
puis exécuter :

```bash
cd ~/reference-dessin

unset APP_IMAGE MIGRATIONS_IMAGE
docker compose --env-file .env.pi -f compose.pi.yaml config --quiet
docker compose --env-file .env.pi -f compose.pi.yaml config --images

docker compose --env-file .env.pi -f compose.pi.yaml up -d --pull never

docker compose --env-file .env.pi -f compose.pi.yaml ps -a
```

### Vérifications après déploiement

- PostgreSQL healthy.
- Initialisation des clés et migrations terminées avec un code 0.
- Application, Caddy et cloudflared actifs.
- Accès HTTPS public et local.
- Recherche Pexels et limitation HTTP 429.
- Authentification Google et collections Pinterest.
- Sélection et séance de dessin.
- Politique de confidentialité.
- Isolation des secrets et accès aux journaux.

Ne jamais supprimer les volumes persistants pendant une mise à jour.

## Retour arrière

En cas de régression bloquante :

1. Arrêter les conteneurs de la nouvelle version.
2. Restaurer les fichiers de configuration sauvegardés.
3. Redémarrer avec les anciennes images.

```bash
cd ~/reference-dessin
docker compose --env-file .env.pi -f compose.pi.yaml stop
```

Restaurer les configurations depuis le répertoire de sauvegarde choisi :

```bash
cd ~/reference-dessin
BACKUP_DIR="$HOME/reference-dessin-rollback-AAAAMMJJ-HHMMSS"

cp -p "$BACKUP_DIR"/{compose.pi.yaml,Caddyfile.pi,.env.pi} .
if [ -d "$BACKUP_DIR/certificates" ]; then
  cp -pr "$BACKUP_DIR/certificates" .
elif [ -f "$BACKUP_DIR/caddy-root.crt" ]; then
  cp -p "$BACKUP_DIR/caddy-root.crt" .
fi

docker compose --env-file .env.pi -f compose.pi.yaml config --quiet
```

Remplacer le nom du répertoire par celui de la sauvegarde réelle.
Pour une sauvegarde antérieure à la migration des certificats, restaurer
également `caddy-root.crt` à son ancien emplacement si nécessaire.
Ne poursuivre que si la restauration et la validation de la configuration réussissent.

Après restauration des configurations :

```bash
APP_IMAGE=ghcr.io/paulbertelli/reference-dessin:rollback \
MIGRATIONS_IMAGE=ghcr.io/paulbertelli/reference-dessin-migrations:rollback \
docker compose --env-file .env.pi \
  -f compose.pi.yaml up -d --pull never --force-recreate
```

Après validation, enregistrer les références des images restaurées
dans `.env.pi`. Les tags `rollback` sont locaux et peuvent être remplacés
au prochain déploiement : vérifier leur correspondance avec la version
choisie avant de les utiliser.

Vérifier les services et les principaux parcours utilisateurs.

Ne jamais utiliser `docker compose down -v` dans cette procédure.

Une restauration PostgreSQL ne doit être effectuée qu'en cas de
nécessité, après diagnostic des éventuelles incompatibilités de
schéma et du risque de perte de données récentes.

Les modifications des services système, notamment journald,
doivent être restaurées séparément si nécessaire.

Cette procédure de retour arrière est préparée mais n'a pas encore
été exécutée intégralement en production.

## Configuration de la route publique Cloudflare

Dans le tunnel `reference-dessin-pi`, créer une route de type **Published application** avec les paramètres suivants :

| Paramètre | Valeur |
|---|---|
| Subdomain | `app` |
| Domain | `reference-dessin.fr` |
| Path | Vide |
| Service URL | `https://caddy:443` |
| Origin Server Name | `app.reference-dessin.fr` |
| CA Pool | `/etc/cloudflared/caddy-root.crt` |
| No TLS Verify | OFF |

Conserver les autres paramètres par défaut.

La vérification du certificat HTTPS entre cloudflared et Caddy doit rester activée.

Dans Google Cloud, autoriser également l'URI de redirection OAuth suivante :

`https://app.reference-dessin.fr/signin-google`

## Sauvegarde automatique PostgreSQL

La sauvegarde est réalisée par le script `scripts/backup-postgres.sh`, planifié par systemd.

- Fréquence : chaque jour à 3 h.
- Format : PostgreSQL custom (`.dump`).
- Destination : `/home/paul/reference-dessin/backups/`.
- Conservation prévue : 30 jours.
- Permissions restrictives.
- Purge des anciennes sauvegardes après réussite de la nouvelle.
- Vérification du catalogue avec `pg_restore --list`.

Le service et le timer sont disponibles dans le dossier `systemd/`.

Une restauration de test depuis une sauvegarde synchronisée a été validée le 19 novembre 2026. Répéter périodiquement ce test.

### Installation sur le Raspberry Pi

```bash
cd ~/reference-dessin

chmod 700 scripts/backup-postgres.sh

sudo install -m 644 systemd/reference-dessin-backup.service /etc/systemd/system/
sudo install -m 644 systemd/reference-dessin-backup.timer /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl start reference-dessin-backup.service
sudo systemctl enable --now reference-dessin-backup.timer
```

### Vérification

```bash
systemctl list-timers --all reference-dessin-backup.timer
sudo journalctl -u reference-dessin-backup.service -n 20 --no-pager
ls -lah ~/reference-dessin/backups/
```

## Copie des sauvegardes sur macOS

- Synchronisation via rsync et SSH.
- Exécution horaire via launchd pendant la session utilisateur.
- Destination : `~/reference-dessin-backups/`.
- Conservation prévue : 30 jours.
- Authentification SSH via le trousseau macOS.
- Protection du stockage par FileVault.

Le script est disponible dans `scripts/sync-backups-mac.sh` et sa planification dans le dossier `launchd/`.

La synchronisation nécessite un accès au réseau local.

### Installation sur macOS

Depuis le dossier `docker` du dépôt :

```bash
mkdir -p ~/.local/bin ~/Library/LaunchAgents

install -m 700 scripts/sync-backups-mac.sh ~/.local/bin/

install -m 644 launchd/fr.reference-dessin.backup-sync.plist \
  ~/Library/LaunchAgents/

launchctl bootstrap gui/$(id -u) \
  ~/Library/LaunchAgents/fr.reference-dessin.backup-sync.plist
```

### Vérification

```bash
launchctl print gui/$(id -u)/fr.reference-dessin.backup-sync
tail -n 10 ~/Library/Logs/reference-dessin-backup.log
tail -n 10 ~/Library/Logs/reference-dessin-backup-error.log
```

## Journalisation en production

- EF Core et HttpClient : niveau Warning.
- Pilote Docker : journald.
- Stockage volatil en RAM.
- Budget de stockage global configuré : 50 Mo.
- Rétention configurée : 30 jours.
- Rotation temporelle des fichiers : 1 jour.
- Perte des journaux au redémarrage du Raspberry Pi.

La configuration `journald/zz-reference-dessin.conf` doit être installée dans `/etc/systemd/journald.conf.d/` lors du déploiement.

Le préfixe `zz-` permet, dans la configuration système actuelle, de charger ce fichier après le fichier `syslog.conf` fourni par le système.

La rétention s'applique par fichiers journaux et ne constitue pas une garantie temporelle stricte pour chaque entrée.

### Installation sur le Raspberry Pi

Transférer préalablement le fichier versionné dans le dossier `journald/` du déploiement.

```bash
cd ~/reference-dessin
sudo mkdir -p /etc/systemd/journald.conf.d

sudo install -m 644 journald/zz-reference-dessin.conf \
  /etc/systemd/journald.conf.d/

sudo systemctl restart systemd-journald
```

### Vérification

```bash
systemctl is-active systemd-journald
sudo systemd-analyze cat-config systemd/journald.conf
sudo journalctl --disk-usage
```

Vérifier que `zz-reference-dessin.conf` est chargé en dernier.

## Rotation des journaux macOS

Configuration disponible dans `newsyslog/reference-dessin.conf`.

- Rotation quotidienne ou à partir de 1 Mio.
- Conservation de 29 archives compressées par journal.
- Permissions restrictives (`600`).
- Installation dans `/etc/newsyslog.d/` lors du déploiement.

La durée de conservation visée est d'environ 30 jours, sans garantie temporelle stricte.

### Installation sur macOS

Depuis le dossier `docker` du dépôt :

```bash
chmod 600 ~/Library/Logs/reference-dessin-backup*.log

sudo mkdir -p /etc/newsyslog.d

sudo install -o root -g wheel -m 644 \
  newsyslog/reference-dessin.conf \
  /etc/newsyslog.d/reference-dessin.conf
```

### Vérification sans modification

```bash
sudo newsyslog -n -v -f /etc/newsyslog.d/reference-dessin.conf
```

## État du déploiement

Dernière validation : 19 novembre 2026.

- Déploiement par SHA : validé.
- Isolation des secrets Docker : validée.
- Migration du certificat Caddy : validée.
- Sauvegarde PostgreSQL via systemd : validée manuellement.
- Synchronisation macOS via launchd : validée.
- Restauration depuis une sauvegarde synchronisée : validée.
- Purge des sauvegardes sur Pi et Mac : validée.
- Configuration journald : installée.
- Rotation des journaux macOS : testée manuellement.

### Vérifications restantes

- Première sauvegarde quotidienne déclenchée par le timer.
- Fiabilité des synchronisations dans la durée.
- Diagnostic des erreurs intermittentes de connexion SSH entre le Mac et le Raspberry Pi.
- Rotation et rétention automatiques des journaux.
- Suppression des sauvegardes manuelles de pré-déploiement.
- Procédure complète de retour arrière.
- Reconstruction complète du serveur après sinistre.

## Test de restauration PostgreSQL

Depuis le Mac, utiliser le conteneur PostgreSQL de simulation locale.

```bash
docker exec referencedessin-prod-test-postgres-1 \
  sh -c 'createdb -U "$POSTGRES_USER" reference_dessin_restore_test'
```

Définir `BACKUP_FILE` avec le chemin absolu du dump choisi, puis restaurer dans cette base temporaire :

```bash
BACKUP_FILE="$HOME/reference-dessin-backups/NOM_DU_FICHIER.dump"
docker exec -i referencedessin-prod-test-postgres-1 \
  sh -c 'pg_restore --exit-on-error -U "$POSTGRES_USER" -d reference_dessin_restore_test' \
  < "$BACKUP_FILE"
```

Vérifier les migrations et les données restaurées avant de supprimer
la base temporaire.

```bash
docker exec referencedessin-prod-test-postgres-1 \
  sh -c 'dropdb -U "$POSTGRES_USER" reference_dessin_restore_test'
```

Ne jamais effectuer ce test dans la base de production.
