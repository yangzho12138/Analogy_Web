import { Subjects } from "./subjects";
export interface PaymentCompleteEvent {
    subject: Subjects.PaymentComplete;
    data: {
        id: string;
        orderId: string;
        chargeId: string;
    };
}
