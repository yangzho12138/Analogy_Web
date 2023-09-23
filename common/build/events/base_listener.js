"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
class Listener {
    constructor(client) {
        this.ackWait = 5 * 1000;
        this.subscriptionOptions = () => {
            return this.client.subscriptionOptions()
                .setManualAckMode(true)
                .setAckWait(this.ackWait)
                .setDeliverAllAvailable() // when the microservice first be online --> send all the events (subscribed) to it
                // have an area named the parameter string in NATS Streaming server -> save the events and tag them if they are handled
                .setDurableName(this.queueGroupName); // when the microservice offline -> online --> send unhandled events to it
        };
        this.listen = () => {
            const subscription = this.client.subscribe(this.subject, this.queueGroupName, this.subscriptionOptions());
            subscription.on('message', (msg) => {
                console.log(`Received Message ${this.subject} / ${this.queueGroupName}`);
                const parseData = this.parseMessage(msg);
                this.onMessage(parseData, msg);
            });
        };
        this.parseMessage = (msg) => {
            const data = msg.getData(); // String | Buffer
            return typeof data === 'string'
                ? JSON.parse(data) // String
                : JSON.parse(data.toString('utf8')); // Buffer
        };
        this.client = client;
    }
}
exports.Listener = Listener;
