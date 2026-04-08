export interface TenantModel {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  propertyId: number
  leaseStartDate?: string
  leaseEndDate?: string
  status: 'active' | 'past-due' | 'former' | 'applicant'
}
