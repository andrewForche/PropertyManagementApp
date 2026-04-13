export interface InvoiceModel {
  invoiceId: number
  projectId: number
  projectTitle: string
  propertyName: string
  addressLine1: string
  unitNumber?: string
  assignedVendor?: string
  totalAmount: number
  invoiceStatus: 'Draft' | 'Sent' | 'Paid' | 'Overdue'
  issuedOn?: string
  paidOn?: string
  isExported: boolean
  createdAt: string
  updatedAt: string
}

export interface InvoiceProjectOptionModel {
  projectId: number
  projectTitle: string
  propertyName: string
  addressLine1: string
  unitNumber?: string
  assignedVendor?: string
  projectStatus: 'Bid' | 'Approved' | 'Work Order' | 'Invoiced' | 'Closed'
}
