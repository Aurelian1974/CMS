/// Tipuri pentru specializări medicale — sincronizate cu DTO-urile backend

/// Specializare flat (din API GetAll)
export interface SpecialtyDto {
  id: string
  parentId: string | null
  name: string
  code: string
  description: string | null
  displayOrder: number
  level: number  // 0=categorie, 1=specialitate, 2=subspecialitate
  isActive: boolean
  parentName: string | null
  createdAt: string
  updatedAt: string | null
}

/// Nod arbore specializare (din API GetTree)
export interface SpecialtyTreeNode {
  id: string
  parentId: string | null
  name: string
  code: string
  description: string | null
  displayOrder: number
  level: number
  isActive: boolean
  children: SpecialtyTreeNode[]
}

/// Payload creare specializare
export interface CreateSpecialtyPayload {
  parentId: string | null
  name: string
  code: string
  description: string | null
  displayOrder: number
  level: number
}

/// Payload actualizare specializare
export interface UpdateSpecialtyPayload extends CreateSpecialtyPayload {
  id: string
}

/// Payload toggle activ/inactiv
export interface ToggleSpecialtyPayload {
  isActive: boolean
}
