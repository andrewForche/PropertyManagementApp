export interface PropertyModel {
  propertyId: number
  propertyName: string
  addressLine1: string
  unitNumber?: string
  monthlyRent: number
  occupancyStatus: 'occupied' | 'vacant' | 'maintenance'
  createdAt: string
  updatedAt: string
}
