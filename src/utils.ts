import {WebSocketServer} from './server';
import WebSocket from 'ws';
import {Logger} from 'enqueuer-plugins-template';

export const createTestServer = async (): Promise<void> => {
    return await WebSocketServer.startServer();
};
export const TEST_SERVER_URI = 'ws://localhost:8080';
export const getScoketClient = (address: string): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
        Logger.trace(`Connecting to web socket at address : ${address}`);
        const socket = new WebSocket(address);
        socket.on('error', (err: any) => {
            Logger.error(`Error connecting to to web socket ${err}`);
            reject(err);
        });
        if (socket.readyState === WebSocket.OPEN) {
             resolve(socket);
        } else {
            Logger.debug('socket not connected waiting until it is connected');
            socket.on('open', () => resolve(socket));
        }
    });
};

export const isSocketConnected = (socket?: WebSocket): boolean => {
  return socket! && socket!.readyState! === WebSocket.OPEN;
};