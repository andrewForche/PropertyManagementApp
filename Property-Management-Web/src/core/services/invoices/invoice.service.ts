import type {
  CreateInvoiceRequest,
  InvoiceModel,
  InvoiceProjectOptionModel,
  UpdateInvoiceRequest,
} from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const invoiceService = {
  getAll: () => apiClient.get<InvoiceModel[]>('/invoices'),
  getById: (invoiceId: number) =>
    apiClient.get<InvoiceModel>(`/invoices/${invoiceId}`),
  getProjectOptions: () =>
    apiClient.get<InvoiceProjectOptionModel[]>('/invoices/project-options'),
  create: (payload: CreateInvoiceRequest) =>
    apiClient.post<CreateInvoiceRequest, InvoiceModel>('/invoices', payload),
  update: (invoiceId: number, payload: UpdateInvoiceRequest) =>
    apiClient.put<UpdateInvoiceRequest, InvoiceModel>(`/invoices/${invoiceId}`, payload),
  delete: (invoiceId: number) => apiClient.delete(`/invoices/${invoiceId}`),
}
