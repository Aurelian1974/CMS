export interface DoctorDto {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  specialtyId: string | null;
  specialtyName: string | null;
  medicalCode: string | null;       // parafa medicală
  licenseNumber: string | null;     // număr CMR
  licenseExpiresAt: string | null;  // dată expirare aviz CMR
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface GetDoctorsParams {
  page: number;
  pageSize: number;
  search?: string;
  specialtyId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface DoctorsPagedResult {
  items: DoctorDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type DoctorStatusFilter = 'all' | 'active' | 'inactive';
