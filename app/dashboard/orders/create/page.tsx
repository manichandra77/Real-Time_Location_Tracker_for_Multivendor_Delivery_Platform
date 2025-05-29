"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const orderSchema = z.object({
  customerId: z.string().min(1, { message: 'Customer ID is required' }),
  pickupAddress: z.string().min(5, { message: 'Pickup address is required' }),
  pickupLat: z.number(),
  pickupLng: z.number(),
  deliveryAddress: z.string().min(5, { message: 'Delivery address is required' }),
  deliveryLat: z.number(),
  deliveryLng: z.number()
});

export default function CreateOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  
  const [customerId, setCustomerId] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLat, setPickupLat] = useState(0);
  const [pickupLng, setPickupLng] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState(0);
  const [deliveryLng, setDeliveryLng] = useState(0);
  
  const [errors, setErrors] = useState<{ 
    customerId?: string; 
    pickupAddress?: string; 
    deliveryAddress?: string;
    pickupCoords?: string;
    deliveryCoords?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // For demo purposes, simulate geocoding by generating random coordinates
  const simulateGeocode = (address: string) => {
    // Base coordinates (New York City)
    const baseLat = 40.7128;
    const baseLng = -74.0060;
    
    // Add some randomness to simulate different locations
    const lat = baseLat + (Math.random() - 0.5) * 0.1;
    const lng = baseLng + (Math.random() - 0.5) * 0.1;
    
    return { lat, lng };
  };
  
  const handlePickupAddressChange = (address: string) => {
    setPickupAddress(address);
    
    if (address.length > 5) {
      const coords = simulateGeocode(address);
      setPickupLat(coords.lat);
      setPickupLng(coords.lng);
    }
  };
  
  const handleDeliveryAddressChange = (address: string) => {
    setDeliveryAddress(address);
    
    if (address.length > 5) {
      const coords = simulateGeocode(address);
      setDeliveryLat(coords.lat);
      setDeliveryLng(coords.lng);
    }
  };
  
  const validateForm = () => {
    const newErrors: any = {};
    
    if (!customerId) {
      newErrors.customerId = 'Customer ID is required';
    }
    
    if (!pickupAddress) {
      newErrors.pickupAddress = 'Pickup address is required';
    }
    
    if (!pickupLat || !pickupLng) {
      newErrors.pickupCoords = 'Invalid pickup location';
    }
    
    if (!deliveryAddress) {
      newErrors.deliveryAddress = 'Delivery address is required';
    }
    
    if (!deliveryLat || !deliveryLng) {
      newErrors.deliveryCoords = 'Invalid delivery location';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get vendor ID
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user?.id)
        .single();
        
      if (vendorError) {
        throw vendorError;
      }
      
      // Create new order
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            vendor_id: vendorData.id,
            customer_id: customerId,
            status: 'pending',
            pickup_address: pickupAddress,
            pickup_lat: pickupLat,
            pickup_lng: pickupLng,
            delivery_address: deliveryAddress,
            delivery_lat: deliveryLat,
            delivery_lng: deliveryLng
          }
        ])
        .select();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Order created',
        description: 'Your order has been created successfully.',
      });
      
      // Redirect to orders page
      router.push('/dashboard/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error creating order',
        description: 'Could not create the order. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/dashboard/orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create New Order</h1>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Enter the details for the new delivery order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer */}
            <div className="space-y-2">
              <label htmlFor="customerId" className="text-sm font-medium">
                Customer ID
              </label>
              <Input
                id="customerId"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Enter customer ID"
                className={errors.customerId ? 'border-destructive' : ''}
              />
              {errors.customerId && (
                <p className="text-destructive text-sm">{errors.customerId}</p>
              )}
            </div>
            
            {/* Pickup Location */}
            <div className="space-y-2">
              <label htmlFor="pickupAddress" className="text-sm font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-green-600" />
                Pickup Address
              </label>
              <Input
                id="pickupAddress"
                value={pickupAddress}
                onChange={(e) => handlePickupAddressChange(e.target.value)}
                placeholder="Enter pickup address"
                className={errors.pickupAddress ? 'border-destructive' : ''}
              />
              {errors.pickupAddress && (
                <p className="text-destructive text-sm">{errors.pickupAddress}</p>
              )}
              {pickupLat !== 0 && pickupLng !== 0 && (
                <div className="text-xs text-muted-foreground">
                  Coordinates: {pickupLat.toFixed(6)}, {pickupLng.toFixed(6)}
                </div>
              )}
              {errors.pickupCoords && (
                <p className="text-destructive text-sm">{errors.pickupCoords}</p>
              )}
            </div>
            
            {/* Delivery Location */}
            <div className="space-y-2">
              <label htmlFor="deliveryAddress" className="text-sm font-medium flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                Delivery Address
              </label>
              <Input
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => handleDeliveryAddressChange(e.target.value)}
                placeholder="Enter delivery address"
                className={errors.deliveryAddress ? 'border-destructive' : ''}
              />
              {errors.deliveryAddress && (
                <p className="text-destructive text-sm">{errors.deliveryAddress}</p>
              )}
              {deliveryLat !== 0 && deliveryLng !== 0 && (
                <div className="text-xs text-muted-foreground">
                  Coordinates: {deliveryLat.toFixed(6)}, {deliveryLng.toFixed(6)}
                </div>
              )}
              {errors.deliveryCoords && (
                <p className="text-destructive text-sm">{errors.deliveryCoords}</p>
              )}
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Order...' : 'Create Order'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}