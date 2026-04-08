export interface UpdatePropertyRequest {
  propertyName: string
  addressLine1: string
  unitNumber?: string
  monthlyRent: number
  occupancyStatus: 'occupied' | 'vacant' | 'maintenance'
}
