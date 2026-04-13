export interface TenantModel {
  tenantId: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber: string
  propertyId: number
  propertyName: string
  addressLine1: string
  unitNumber?: string
  leaseStartDate?: string
  leaseEndDate?: string
  tenantStatus: 'active' | 'past_due' | 'former' | 'applicant'
  createdAt: string
  updatedAt: string
}
