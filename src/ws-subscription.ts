// @ts-ignore
import * as WebSocket from 'ws';
import {Logger, MainInstance, Subscription, SubscriptionModel, SubscriptionProtocol} from 'enqueuer-plugins-template';

export class WsSubscription extends Subscription {

    private client: any;
    private messageReceivedResolver?: (value?: (PromiseLike<any> | any)) => void;

    constructor(subscriptionAttributes: SubscriptionModel) {
        super(subscriptionAttributes);
        this.options = subscriptionAttributes.options || {};
        this.options.connectTimeout = this.options.connectTimeout || 10 * 1000;
    }

    public receiveMessage(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.isClientConnected()) {
                reject(`Error trying to receive message. Subscription is not connected yet: ${this.address}`);
            } else {
                Logger.debug('WS message receiver resolver initialized');
                this.messageReceivedResolver = resolve;
            }
        });
    }

    public subscribe(): Promise<void> {
        return new Promise((resolve, reject) => {
            Logger.trace(`WS connecting to web socket server ${this.address}`);
            this.client = new WebSocket(this.address);
            Logger.trace(`WS client created`);
            if (!this.isClientConnected()) {
                this.client.on('connect', () =>  {
                    Logger.debug(`ws client connected to ${this.address}`);
                    this.client.on('message', (payload: string) => this.gotMessage(payload));
                    resolve();
                });
            } else {
                this.client.on('message', (payload: string) => this.gotMessage(payload));
                resolve();
            }
            this.client.on('error', (error: any) => {
                Logger.error(`Error subscribing to ws ${error}`);
                reject(error);
            });
        });
    }

    public async unsubscribe(): Promise<void> {
        if (this.client) {
            this.client.terminate();
        }
        delete this.client;
    }
    private isClientConnected(): boolean {
        return this.client! && this.client!.readyState! === 1;
    }
    private gotMessage(payload: string) {
        Logger.debug('WS got message');
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
