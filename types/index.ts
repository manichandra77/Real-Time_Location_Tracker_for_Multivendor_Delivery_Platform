export interface User {
  id: string;
  email: string;
  name: string;
  role: 'vendor' | 'delivery' | 'customer';
  created_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  address: string;
  created_at: string;
}

export interface DeliveryPartner {
  id: string;
  user_id: string;
  vehicle_type: string;
  license_number: string;
  current_lat?: number;
  current_lng?: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  vendor_id: string;
  customer_id: string;
  delivery_partner_id?: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  created_at: string;
}

export interface LocationUpdate {
  id: string;
  delivery_partner_id: string;
  order_id: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface DeliveryStatus {
  order_id: string;
  status: Order['status'];
  delivery_partner_id?: string;
  current_lat?: number;
  current_lng?: number;
  updated_at: string;
}