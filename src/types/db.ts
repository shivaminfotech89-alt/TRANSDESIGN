export interface Supplier {
  id?: string;
  userId: string;
  name: string;
  gstNumber: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  paymentTerms: string;
  leadTime: number; // days
  rating: number; // 1-5
  notes: string;
  createdAt: number;
  updatedAt: number;
}

export interface Material {
  id?: string;
  userId: string;
  name: string;
  category: string;
  unit: string;
  createdAt: number;
  updatedAt: number;
}

export interface MaterialPrice {
  id?: string;
  userId: string;
  materialId: string;
  supplierId: string;
  basePrice: number;
  transportation: number;
  loading: number;
  unloading: number;
  packing: number;
  insurance: number;
  taxes: number; // %
  discount: number; // %
  wastage: number; // %
  scrap: number; // %
  moq: number;
  currency: string;
  effectiveDate: string;
  expiryDate: string;
  source: 'Manual' | 'Live' | 'Supplier' | 'Default';
  reason: string;
  version: number;
  createdAt: number;
  createdBy: string; // user email
}
