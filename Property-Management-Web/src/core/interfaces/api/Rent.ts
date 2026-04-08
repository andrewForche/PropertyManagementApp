export interface RentScheduleModel {
  id: number
  tenantId: number
  dueDate: string
  status: 'paid' | 'unpaid' | 'partial' | 'late'
  baseRent: number
  lateFeeAmount?: number
  balanceDue: number
  reminderCount: number
}

export interface RentPaymentModel {
  id: number
  scheduleId: number
  amountPaid: number
  paymentMethod: 'ach' | 'card' | 'cash' | 'check'
  paymentDate: string
  referenceNumber?: string
}
