import {MainInstance, Subscription, SubscriptionModel, SubscriptionProtocol, Logger} from 'enqueuer-plugins-template';
import WebSocket from 'ws';

export class WsSubscription extends Subscription {

    private wss?: WebSocket.Server;
    private client?: WebSocket;
    private messageReceivedResolver?: (value?: (PromiseLike<any> | any)) => void;

    constructor(subscriptionAttributes: SubscriptionModel) {
        super(subscriptionAttributes);
    }

    public receiveMessage(): Promise<any> {
        return new Promise((resolve) => {
            Logger.debug('WS message receiver resolver initialized');
            this.messageReceivedResolver = resolve;
        });
    }

    public subscribe(): Promise<void> {
        return new Promise((resolve, reject) => {
            const wss = new WebSocket.Server({port: this.port}, () => {
                this.wss = wss;
                Logger.trace(`WebSocket server created`);
                this.wss.on('connection', (client: WebSocket) => {
                    Logger.debug(`WebSocket server got connection`);
                    this.client = client;
                    client.on('message', (data: WebSocket.Data) => this.gotMessage(data));
                });
                this.wss.on('error', (server: WebSocket, error: Error) => {
                    let message = `Error creating webSocket server: ${error}`;
                    Logger.error(message);
                    reject(error);
                });
                resolve();
            });
        });
    }

    public async unsubscribe(): Promise<void> {
        if (this.wss) {
            this.wss.close();
        }
    }

    public async sendResponse(): Promise<void> {
        if (this.client && !!this.response) {
            this.client.send(this.response, (err?: Error) => {
                if (err) {
                    let message = `Error sending response back to the client: ${err}`;
                    Logger.error(message);
                    throw message;
                }
                Logger.debug(`WebSocket server Response sent back to the client`);
            });
        }
    }

    private gotMessage(payload: WebSocket.Data) {
        Logger.trace('WebSocket server got message: ' + payload);
        if (this.messageReceivedResolver) {
            this.messageReceivedResolver({payload: payload});
        } else {
            Logger.warning('WebSocket server message receiver resolver is not initialized');
        }
    }
}

export function entryPoint(mainInstance: MainInstance): void {
    const ws = new SubscriptionProtocol('ws',
        (subscriptionModel: SubscriptionModel) => new WsSubscription(subscriptionModel),
        ['payload'])
        .setLibrary('ws');
    mainInstance.protocolManager.addProtocol(ws);
}
