
export enum PaymentStatus {
  PAID = 'Paid',
  WAITING = 'Waiting',
  CANCELLED = 'Cancelled',
}

export interface Session {
  id: string;
  patientName: string;
  sessionDate: string; // ISO string format
  paymentStatus: PaymentStatus;
  sessionFee: number;
  commission: number;
  paymentDueDate?: string; // ISO string format
  paymentDate?: string; // ISO string format
}
