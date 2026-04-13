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
  propertyName: string
  addressLine1: string
  unitNumber?: string
  assignedVendor?: string
  projectStatus: 'Bid' | 'Approved' | 'Work Order' | 'Invoiced' | 'Closed'
  clockInTime: string
  clockOutTime?: string
  gpsLocation?: string
  proofPhotoUrl?: string
  workNotes?: string
  createdAt: string
}
