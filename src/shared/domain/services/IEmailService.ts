export interface SendTicketData {
  to: string;
  clientName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  ticketQuantity: number;
  totalAmount: number;
  paymentDate: string;
  ticketCode: string;
}

export interface IEmailService {
  sendTicketEmail(data: SendTicketData): Promise<void>;
}