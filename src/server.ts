import WebSocket from 'ws';
import {Logger} from 'enqueuer-plugins-template';
export class WebSocketServer {
    private static serverStarted: boolean = false;
    private static readonly port: number = 8080;
    private static server: WebSocket.Server;
    private static readonly LOGID = 'WServer:';
    public static startServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.serverStarted && this.server !== null) {
                Logger.debug(`${this.LOGID} websocket server already started resolving..`);
                resolve();
            } else {
            this.server = new WebSocket.Server({port: this.port}, () => {
                this.serverStarted = true;
                Logger.trace(`${this.LOGID} websocket server created`);
                this.server.on('connection', this.onConnection.bind(this));
                this.server.on('error', (server: WebSocket, error: Error) => {
                    this.serverStarted = false;
                    let message = `${this.LOGID} Error creating webSocket server: ${error}`;
                    Logger.error(message);
                    reject(error);
                });
                resolve();
            });
            }
        });
    }
    public static stopServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            Logger.trace(`${this.LOGID} calling stop server`);
            if (!this.serverStarted || this.server === null) {
                Logger.debug(`${this.LOGID} server is not started so it cannot be stopped`);
                resolve();
            }
            if (!this.clientsConnected()) {
                Logger.debug(`${this.LOGID} no clients currently connected to server so it is safe to suspend`);
                this.server.close((err?: Error) => {
                    if (err) {
                        Logger.error(`${this.LOGID} Error closing web socket server : ${err}`);
                        reject(err);
                    }
                    this.serverStarted = false;
                    delete this.server;
                    Logger.debug(`${this.LOGID} web socket server closed`);
                    resolve();
                });
            }
            Logger.debug('clients are currently connected to web socket server not stopping the server');
        });
    }
    private static clientsConnected(): boolean {
        let connected = false;
        if (this.server !== null) {
            this.server.clients.forEach((client: WebSocket) => {
               if (client.readyState === client.OPEN || client.readyState === client.CONNECTING) {
                   connected = true;
               }
            });
        }
        return connected;
    }
    private static onConnection(client: WebSocket) {
        Logger.debug(`${this.LOGID} web socket server recieved connection`);
        client.on('message', this.onMessage.bind(this));
        client.on('close', this.onClose.bind(this));

    }
    private static async onClose() {
        Logger.debug(`${this.LOGID} onClose called`);
        await this.stopServer();
    }
    private static onMessage(data: any) {
        Logger.debug(`${this.LOGID} server recieved message: ${data}`);
        if (this.serverStarted && this.server != null) {
            Logger.debug(`${this.LOGID} server has been started sending message to clients`);
            this.server.clients.forEach((client: WebSocket) => {
               if (client.readyState === WebSocket.OPEN) {
                   client.send(data);
               }
            });
        } else {
            Logger.warning(`${this.LOGID} onMessage called when server is not started`);
        }
    }
}