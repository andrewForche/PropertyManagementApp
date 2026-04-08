export interface InvoiceModel {
  id: number
  projectId: number
  totalAmount: number
  invoiceStatus: 'draft' | 'sent' | 'paid' | 'overdue'
  issuedOn?: string
  paidOn?: string
  isExported: boolean
}
