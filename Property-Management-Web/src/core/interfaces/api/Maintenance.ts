export interface MaintenanceProjectModel {
  id: number
  propertyId: number
  projectTitle: string
  description?: string
  bidAmount?: number
  status: 'bid' | 'approved' | 'work-order' | 'invoiced' | 'closed'
  assignedVendor?: string
}

export interface WorkLogModel {
  id: number
  projectId: number
  clockInTime: string
  clockOutTime?: string
  gpsLocation?: string
  proofPhotoUrl?: string
  notes?: string
}
