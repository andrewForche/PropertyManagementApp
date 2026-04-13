export interface CreateTenantRequest {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  propertyId: number
  leaseStartDate?: string
  leaseEndDate?: string
  tenantStatus: 'active' | 'past_due' | 'former' | 'applicant'
}
