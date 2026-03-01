export interface CaenCodeDto {
  id: string
  code: string
  name: string
  level: number        // 1=Sectiune, 2=Diviziune, 3=Grupa, 4=Clasa
  isActive: boolean
}

export interface CaenCodeSearchParams {
  search?: string
  classesOnly?: boolean
  topN?: number
}
