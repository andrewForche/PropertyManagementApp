export interface CreateWorkLogRequest {
  clockInTime: string
  clockOutTime?: string
  gpsLocation?: string
  proofPhotoUrl?: string
  workNotes?: string
}
