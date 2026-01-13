
export type UserRole = 'client' | 'provider' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface ClientCompany {
  id: string;
  userId: string;
  name: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
  avatarUrl?: string;
}

export interface Provider {
  id: string;
  userId: string;
  name: string;
  baseCity: string;
  radiusKm: number;
  phone: string;
  description: string;
  services: ServiceType[];
  averageRating?: number;
  totalRatings?: number;
  avatarUrl?: string;
}

export type ServiceType = 'exterior' | 'interior' | 'complete';

export interface Vehicle {
  id: string;
  clientCompanyId: string;
  licensePlate: string;
  brand: string;
  model: string;
  type: string;
  year?: number;
  imageUrl?: string;
}

export type WashRequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface WashRequest {
  id: string;
  clientCompanyId: string;
  providerId?: string;
  address: string;
  dateTime: Date;
  status: WashRequestStatus;
  notes?: string;
  invoiceUrl?: string;
  createdAt: Date;
  vehicles: WashRequestVehicle[];
  clientCompany?: ClientCompany;
  provider?: Provider;
}

export interface WashRequestVehicle {
  id: string;
  washRequestId: string;
  vehicleId: string;
  serviceType: ServiceType;
  vehicle?: Vehicle;
}

export interface Rating {
  id: string;
  washRequestId: string;
  providerId: string;
  clientCompanyId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}
