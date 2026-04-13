export interface RentScheduleModel {
  scheduleId: number
  tenantId: number
  tenantName: string
  propertyName: string
  addressLine1: string
  unitNumber?: string
  dueDate: string
  scheduleStatus: 'Paid' | 'Unpaid' | 'Partial' | 'Late'
  baseRent: number
  lateFeeAmount: number
  balanceDue: number
  reminderCount: number
  createdAt: string
  updatedAt: string
}

export interface RentPaymentModel {
  paymentId: number
  scheduleId: number
  tenantName: string
  amountPaid: number
  paymentMethod: 'ACH' | 'Card' | 'Cash' | 'Check'
  paymentDate: string
  referenceNumber?: string
}

export interface CreateRentPaymentRequest {
  scheduleId: number
  amountPaid: number
  paymentMethod: 'ACH' | 'Card' | 'Cash' | 'Check'
  paymentDate: string
  referenceNumber?: string
}

export interface UpdateRentScheduleRequest {
  scheduleStatus: 'Paid' | 'Unpaid' | 'Partial' | 'Late'
  lateFeeAmount: number
  balanceDue: number
  reminderCount: number
}
