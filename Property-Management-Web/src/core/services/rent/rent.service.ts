import type { RentPaymentModel, RentScheduleModel } from '../../interfaces/api'
import { apiClient } from '../http/api-client.service'

export const rentService = {
  getSchedules: () => apiClient.get<RentScheduleModel[]>('/rent-schedules'),
  getPayments: () => apiClient.get<RentPaymentModel[]>('/rent-payments'),
}
