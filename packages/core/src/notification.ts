/**
 * Canal de notificação ativa (lembretes de contas a pagar etc.).
 * Fase 1 define só o contrato; a Fase 2 traz a implementação via WAHA
 * (WhatsApp não-oficial). Trocar para a API oficial da Meta = novo adaptador.
 */
export interface NotificationChannel {
  send(recipient: string, message: string): Promise<void>;
}
