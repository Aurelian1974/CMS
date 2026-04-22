export interface ICD10SearchResult {
  icD10_ID: string
  code: string
  fullCode: string
  shortDescriptionRo: string
  shortDescriptionEn?: string
  longDescriptionRo?: string
  longDescriptionEn?: string
  category?: string
  severity?: string
  isCommon: boolean
  isLeafNode: boolean
  isBillable: boolean
  isTranslated: boolean
  chapterNumber?: number
  chapterDescription?: string
  relevanceScore: number
  isFavorite: boolean
}
