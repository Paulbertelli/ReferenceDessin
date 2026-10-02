import { CompteUtilisateur } from './compte-utilisateur.model';

export type EtatAuthentification =
    | { statut: 'chargement'; }
    | { statut: 'deconnecte'; }
    | { statut: 'connecte'; compte: CompteUtilisateur; }
    | { statut: 'deconnexion'; }
    | { statut: 'erreur'; };