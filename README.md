# ReferenceDessin
Application d'entraînement au dessin utilisant des photos Pexels comme références.

## Architecture Back

L'Architecture back est séparée en trois projets :

- Application définit les modèles et contrats nécessaires au cas d'utilisation.
- Infrastructure implémente l'accès à l'API Pexels.
- Api expose les fonctionnalités au client Angular.

La clé Pexels est stockée côté serveur avec .NET User Secrets en développement.