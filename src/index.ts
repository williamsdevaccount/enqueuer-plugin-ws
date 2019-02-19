import * as subscription from './ws-subscription';
import * as publisher from './ws-publisher';
import {MainInstance} from 'enqueuer-plugins-template';

export function entryPoint(mainInstance: MainInstance): void {
    subscription.entryPoint(mainInstance);
    publisher.entryPoint(mainInstance);
}
