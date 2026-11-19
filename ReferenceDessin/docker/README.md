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

Un test de restauration reste nécessaire pour valider les sauvegardes.

## Copie des sauvegardes sur macOS

- Synchronisation via rsync et SSH.
- Exécution horaire via launchd pendant la session utilisateur.
- Destination : `~/reference-dessin-backups/`.
- Conservation prévue : 30 jours.
- Authentification SSH via le trousseau macOS.
- Protection du stockage par FileVault.

Le script est disponible dans `scripts/sync-backups-mac.sh` et sa planification dans le dossier `launchd/`.

La synchronisation nécessite un accès au réseau local.

## Journalisation en production

- EF Core et HttpClient : niveau Warning.
- Pilote Docker : journald.
- Stockage volatil en RAM.
- Plafond global configuré : 50 Mo.
- Rétention configurée : 30 jours.
- Rotation temporelle des fichiers : 1 jour.
- Perte des journaux au redémarrage du Raspberry Pi.

La configuration `journald/zz-reference-dessin.conf` doit être installée dans `/etc/systemd/journald.conf.d/` lors du déploiement.

Le préfixe `zz-` garantit que cette configuration est chargée après le fichier `syslog.conf` fourni par le système.

La rétention s'applique par fichiers journaux et ne constitue pas une garantie temporelle stricte pour chaque entrée.

## Rotation des journaux macOS

Configuration disponible dans `newsyslog/reference-dessin.conf`.

- Rotation quotidienne ou à partir de 1 Mio.
- Conservation de 29 archives compressées par journal.
- Permissions restrictives (`600`).
- Installation dans `/etc/newsyslog.d/` lors du déploiement.

La durée de conservation visée est d'environ 30 jours, sans garantie temporelle stricte.

## État du déploiement

Les évolutions relatives à l'isolation des secrets, aux sauvegardes automatiques, à la synchronisation macOS et à la journalisation restent à déployer et à valider en conditions réelles.

La nouvelle organisation des certificats doit également être appliquée lors du prochain déploiement.
