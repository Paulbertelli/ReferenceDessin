export interface NotificationApplication {
    type: TypeNotification;
    message: string;
}

export type TypeNotification =
    | 'information'
    | 'erreur'
    | 'succes';