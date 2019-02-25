import WebSocket from 'ws';
import {Logger, MainInstance, Subscription, SubscriptionModel, SubscriptionProtocol} from 'enqueuer-plugins-template';
import * as utils from './utils';
export class WsSubscription extends Subscription {

    private client?: WebSocket;
    private messageReceivedResolver?: (value?: (PromiseLike<any> | any)) => void;

    constructor(subscriptionAttributes: SubscriptionModel) {
        super(subscriptionAttributes);
        this.testServer = this.testServer || false;
        Logger.debug(`subscriber is in testServer mode : ${this.testServer}`);
    }

    public receiveMessage(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!utils.isSocketConnected(this.client)) {
                reject(`Error trying to receive message. Subscription is not connected yet: ${this.address}`);
            } else {
                Logger.debug('WS message receiver resolver initialized');
                this.messageReceivedResolver = resolve;
            }
        });
    }

    public subscribe(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (this.testServer) {
                this.address = utils.TEST_SERVER_URI;
                Logger.debug('Subscriber: test server property set to true starting up test socket server');
                await utils.createTestServer();
            }
            Logger.debug(`WS connecting to web socket server ${this.address}`);
            utils.getScoketClient(this.address)
                .then((client: WebSocket) => {
                    this.client = client;
                    this.client.on('message', (payload: string) => this.gotMessage(payload));
                    resolve();
                }).catch((err: Error) => reject(err));
        });
    }

    public async unsubscribe(): Promise<void> {
        if (this.client) {
            this.client.close();
        }
        delete this.client;
    }
    private gotMessage(payload: string) {
        Logger.debug('WS subscriber got message');
        if (this.messageReceivedResolver) {
            this.messageReceivedResolver({payload: payload});
        } else {
            Logger.error('WS message receiver resolver is not initialized');
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
