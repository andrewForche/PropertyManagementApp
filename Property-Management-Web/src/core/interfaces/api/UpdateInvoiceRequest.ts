export interface UpdateInvoiceRequest {
  projectId: number
  totalAmount: number
  invoiceStatus: 'Draft' | 'Sent' | 'Paid' | 'Overdue'
  issuedOn?: string
  paidOn?: string
  isExported: boolean
}
