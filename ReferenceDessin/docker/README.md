# Déploiement sur Raspberry Pi

## Architecture

L'application est déployée avec Docker Compose et utilise PostgreSQL, Caddy et Cloudflare Tunnel.

- Accès public : `https://app.reference-dessin.fr`
- Accès local : `https://pi-paul.local:8443`
- Proxy Caddy : `172.30.250.10`
- Proxy cloudflared : `172.30.250.11`

## Configuration des secrets

Le fichier `.env.pi` doit contenir les paramètres nécessaires à PostgreSQL, Google OAuth, Pexels et Cloudflare Tunnel.

Le jeton du tunnel est renseigné dans la variable `CLOUDFLARE_TUNNEL_TOKEN`.

Le fichier `.env.pi` ne doit jamais être versionné dans Git. Sur le Raspberry Pi, ses permissions doivent être limitées au propriétaire (`chmod 600`).

## Certificat HTTPS interne

Cloudflare Tunnel communique avec Caddy en HTTPS. Pour vérifier le certificat présenté par Caddy, cloudflared doit disposer de son certificat racine.

Après le premier démarrage de Caddy, exécuter sur le Raspberry Pi :

```bash
cd ~/reference-dessin

docker cp referencedessin-pi-caddy-1:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt

chmod 644 caddy-root.crt
```

Le certificat est monté en lecture seule dans le conteneur cloudflared, à l'emplacement `/etc/cloudflared/caddy-root.crt`.

Ce certificat doit rester local au déploiement. Ne jamais copier ni versionner la clé privée de l'autorité de certification.

En cas de recréation de l'autorité de certification Caddy, il faudra extraire à nouveau son certificat racine et recréer le conteneur cloudflared.

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

La sauvegarde est réalisée par le script
`scripts/backup-postgres.sh`, planifié par systemd.

- Fréquence : chaque jour à 3 h.
- Format : PostgreSQL custom (.dump).
- Destination : /home/paul/reference-dessin/backups/.
- Conservation locale : 30 jours.
- Permissions restrictives.
- Purge des anciennes sauvegardes après réussite de la nouvelle.
- Vérification du catalogue avec pg_restore --list.

La copie hors Raspberry Pi reste à automatiser.
Un test de restauration est nécessaire pour valider les sauvegardes.

## Copie des sauvegardes sur macOS

- Synchronisation via rsync et SSH.
- Exécution horaire via launchd pendant la session utilisateur.
- Destination : ~/reference-dessin-backups/.
- Conservation : 30 jours.
- Authentification SSH via le trousseau macOS.
- Protection du stockage par FileVault.

La synchronisation nécessite un accès au réseau local.
Les journaux de synchronisation restent à faire tourner.

## Journalisation en production

- EF Core et HttpClient : niveau Warning.
- Pilote Docker : json-file.
- Taille maximale par fichier : 10 Mo.
- Nombre maximal de fichiers par conteneur : 3.
- Rotation automatique par taille.

La durée maximale de conservation n'est pas garantie
par cette configuration.

## Journalisation en production

- EF Core et HttpClient : niveau Warning.
- Pilote Docker : journald.
- Stockage volatil en RAM.
- Plafond global des journaux système : 50 Mo.
- Rétention configurée : 30 jours.
- Rotation temporelle des fichiers : 1 jour.
- Perte des journaux au redémarrage du Raspberry Pi.

La configuration système est disponible dans
journald/90-reference-dessin.conf.

Elle doit être installée dans
/etc/systemd/journald.conf.d/ lors du déploiement.

## Rotation des journaux macOS

Configuration disponible dans newsyslog/reference-dessin.conf.

- Rotation quotidienne ou à partir de 1 Mio.
- Conservation de 29 archives compressées par journal.
- Permissions restrictives (600).
- Installation dans /etc/newsyslog.d/ lors du déploiement.

La durée de conservation visée est d'environ 30 jours,
sans garantie temporelle stricte.
