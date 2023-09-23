import { Subjects } from "./subjects";
export interface OrderCancelledEvent {
    subject: Subjects.OrderCancelled;
    data: {
        id: string;
        number: number;
        version: number;
        ticket: {
            id: string;
        };
    };
}
