/*
  # Initial schema for the DeliveryTrack application

  1. New Tables
    - `users` - Stores all users with their role (vendor, delivery, customer)
    - `vendors` - Additional vendor information
    - `delivery_partners` - Delivery partner information including current location
    - `orders` - Order information with pickup and delivery details
    - `location_updates` - History of location updates for deliveries
  
  2. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vendor', 'delivery', 'customer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  business_name TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create delivery partners table
CREATE TABLE IF NOT EXISTS delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  vehicle_type TEXT,
  license_number TEXT,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  delivery_partner_id UUID REFERENCES delivery_partners(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled')),
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_lat DOUBLE PRECISION NOT NULL,
  delivery_lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create location updates table
CREATE TABLE IF NOT EXISTS location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_partner_id UUID NOT NULL REFERENCES delivery_partners(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" 
  ON users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Add policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policies for vendors table
CREATE POLICY "Vendors can view their own data" 
  ON vendors 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policies for delivery partners table
CREATE POLICY "Delivery partners can view their own data" 
  ON delivery_partners 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Delivery partners can update their own data" 
  ON delivery_partners 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for orders table
-- Vendors can see their own orders
CREATE POLICY "Vendors can view their own orders" 
  ON orders 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = orders.vendor_id AND vendors.user_id = auth.uid()
  ));

-- Delivery partners can see orders assigned to them
CREATE POLICY "Delivery partners can view assigned orders" 
  ON orders 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM delivery_partners WHERE delivery_partners.id = orders.delivery_partner_id AND delivery_partners.user_id = auth.uid()
  ));

-- Customers can see their own orders
CREATE POLICY "Customers can view their own orders" 
  ON orders 
  FOR SELECT 
  USING (customer_id = auth.uid());

-- Vendors can update their own orders
CREATE POLICY "Vendors can update their own orders" 
  ON orders 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = orders.vendor_id AND vendors.user_id = auth.uid()
  ));

-- Create policies for location updates
-- Delivery partners can insert their own location updates
CREATE POLICY "Delivery partners can insert location updates" 
  ON location_updates 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM delivery_partners WHERE delivery_partners.id = location_updates.delivery_partner_id AND delivery_partners.user_id = auth.uid()
  ));

-- Anyone can view location updates (for tracking)
CREATE POLICY "Anyone can view location updates" 
  ON location_updates 
  FOR SELECT 
  TO authenticated 
  USING (true);