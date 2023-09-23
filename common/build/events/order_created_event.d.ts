import { Subjects } from "./subjects";
import { OrderStatus } from "./types/order-status";
export interface OrderCreatedEvent {
    subject: Subjects.OrderCreated;
    data: {
        id: string;
        version: number;
        status: OrderStatus;
        number: number;
        expireAt: string;
        userId: string;
        ticket: {
            id: string;
            price: number;
        };
    };
}
