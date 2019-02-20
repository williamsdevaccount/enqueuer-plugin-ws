import {PublisherProtocol, Publisher, PublisherModel, Logger, MainInstance} from 'enqueuer-plugins-template';
import WebSocket from 'ws';

export class WSPublisher extends Publisher {

    public constructor(publish: PublisherModel) {
        super(publish);
    }

    public publish(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connectClient()
                .then((client: WebSocket) => {
                    Logger.debug(`web socket publishing in ${this.address}: ${this.payload}`
                        .substr(0, 100).concat('...'));
                    const toPublish = typeof this.payload === 'object' ? JSON.stringify(this.payload) : this.payload;
                    client.send(toPublish, (err: any) => {
                        if (err) {
                            Logger.error(`Error sending to web socket at ${this.address}: ${err}`);
                            reject(err);
                        } else {
                            Logger.debug('WS published message successfully');
                        }
                        setTimeout(() => resolve(), this.responseTimeout || 1000);
                        client.on('message', (data: WebSocket.Data)  => {
                            Logger.debug('WebSocket publisher got message');
                            this.messageReceived = {payload: data};
                            client.close();
                            resolve();
                        });
                    });
                });
        });
    }

    private connectClient(): Promise<WebSocket> {
        return new Promise((resolve, reject) => {
            Logger.debug('Publisher : connecting to ws');
            const socket = new WebSocket(this.address);
            socket.on('error', (err: any) => {
                Logger.debug(`Error connecting to publish to web socket ${err}`);
                reject(err);
            });
            if (socket.readyState === 1) {
                Logger.debug('socket connecting resolving.');
                resolve(socket);
            } else {
                socket.on('open', () => {
                    Logger.debug('WebSocket client is connected');
                    resolve(socket);
                });
            }
        });
    }

}

export function entryPoint(mainInstance: MainInstance): void {
    const ws = new PublisherProtocol('ws',
        (publisherModel: PublisherModel) => new WSPublisher(publisherModel))
        .setLibrary('ws');
    mainInstance.protocolManager.addProtocol(ws);
}
