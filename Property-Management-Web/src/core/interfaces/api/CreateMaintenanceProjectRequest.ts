export interface CreateMaintenanceProjectRequest {
  propertyId: number
  projectTitle: string
  projectDescription?: string
  bidAmount?: number
  projectStatus: 'Bid' | 'Approved' | 'Work Order' | 'Invoiced' | 'Closed'
  assignedVendor?: string
}
