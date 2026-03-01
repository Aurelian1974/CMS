export interface CountyDto {
  id: string
  name: string
  abbreviation: string
  sortOrder: number | null
}

export interface LocalityDto {
  id: string
  name: string
  locationTypeCode: string | null
  locationTypeName: string | null
}
