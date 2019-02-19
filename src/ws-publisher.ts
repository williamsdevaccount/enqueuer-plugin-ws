// @ts-ignore
import * as WebSocket from 'ws';
import {PublisherProtocol, Publisher, PublisherModel, Logger, MainInstance} from 'enqueuer-plugins-template';

export class WSPublisher extends Publisher {

    public constructor(publish: PublisherModel) {
        super(publish);
        this.options = this.options || {};
    }

    public publish(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connectClient()
                .then(client => {
                    Logger.debug(`web socket publishing in ${this.address}: ${this.payload}`
                        .substr(0, 100).concat('...'));
                    const toPublish = typeof this.payload == 'object' ? JSON.stringify(this.payload) : this.payload;
                    client.send(toPublish, (err: any) => {
                        if (err) {
                            Logger.error(`Error sending to web socket at ${this.address}: ${err}`);
                            reject(err);
                        }
                    });
                    client.terminate();
                    resolve();
                });
        });
    }

    private connectClient(): Promise<any> {
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(this.address);
            if (socket.readyState === 1) {
                resolve(socket);
            } else {
                socket.on('open', () => resolve(socket));
            }
            socket.on('error', (err: any) => {
                Logger.error(`Error connecting to publish to web socket ${err}`);
                reject(err);
            });
        });
    }

}

export function entryPoint(mainInstance: MainInstance): void {
    const ws = new PublisherProtocol('ws',
        (publisherModel: PublisherModel) => new WSPublisher(publisherModel))
        .setLibrary('ws');
    mainInstance.protocolManager.addProtocol(ws);
}
