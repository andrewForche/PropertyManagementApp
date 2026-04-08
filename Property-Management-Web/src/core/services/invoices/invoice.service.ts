import type { InvoiceModel } from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const invoiceService = {
  getAll: () => apiClient.get<InvoiceModel[]>('/invoices'),
  getById: (invoiceId: number) =>
    apiClient.get<InvoiceModel>(`/invoices/${invoiceId}`),
}
