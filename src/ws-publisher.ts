import WebSocket from 'ws';
import {PublisherProtocol, Publisher, PublisherModel, Logger, MainInstance} from 'enqueuer-plugins-template';
import * as utils from './utils';

export class WSPublisher extends Publisher {

    public constructor(publish: PublisherModel) {
        super(publish);
        this.testServer = this.testServer || false;
        Logger.trace(`publisher is in testServer mode : ${this.testServer}`);
    }

    public publish(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (this.testServer) {
                this.address = utils.TEST_SERVER_URI;
                await utils.createTestServer();
            }
            utils.getScoketClient(this.address)
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
                    });
                    setTimeout(() => resolve(), this.responseTimeout || 1000);
                    client.on('message', (data: WebSocket.Data)  => {
                        Logger.debug('WebSocket publisher got message');
                        this.messageReceived = {payload: data};
                        client.close();
                        resolve();
                    });
                }).catch((err: Error) => reject(err));
        });
    }
}

export function entryPoint(mainInstance: MainInstance): void {
    const ws = new PublisherProtocol('ws',
        (publisherModel: PublisherModel) => new WSPublisher(publisherModel))
        .setLibrary('ws');
    mainInstance.protocolManager.addProtocol(ws);
}
