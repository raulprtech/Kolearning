export interface IMessagingService {
    /**
     * Sends a message to a user through the implemented channel (Telegram, etc.)
     */
    sendMessage(userId: string, message: string): Promise<void>;

    /**
     * Optional callback for when a message is received from the external channel
     */
    onMessageReceived?(callback: (userId: string, message: string) => void): void;

    /**
     * Returns true if the service is properly configured and active
     */
    isActive(): Promise<boolean>;
}
