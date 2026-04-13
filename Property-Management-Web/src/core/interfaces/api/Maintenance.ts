export interface MaintenanceProjectModel {
  projectId: number
  propertyId: number
  propertyName: string
  addressLine1: string
  unitNumber?: string
  projectTitle: string
  projectDescription?: string
  bidAmount?: number
  projectStatus: 'Bid' | 'Approved' | 'Work Order' | 'Invoiced' | 'Closed'
  assignedVendor?: string
  createdAt: string
  updatedAt: string
}

export interface WorkLogModel {
  workLogId: number
  projectId: number
  projectTitle: string
  clockInTime: string
  clockOutTime?: string
  gpsLocation?: string
  proofPhotoUrl?: string
  workNotes?: string
  createdAt: string
}
