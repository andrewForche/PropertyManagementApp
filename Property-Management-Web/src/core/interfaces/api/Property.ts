export interface PropertyModel {
  id: number
  propertyName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  unitNumber?: string
  monthlyRent: number
  occupancyStatus: 'occupied' | 'vacant' | 'maintenance'
}
