"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Order, DeliveryPartner } from '@/types';
import { TruckIcon, MapPin, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useSocket } from '@/context/socket-context';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function DeliveriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationInterval, setLocationInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const { sendLocationUpdate } = useSocket();

  // Fetch delivery partner and assigned orders
  useEffect(() => {
    const fetchDeliveries = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get delivery partner details
        const { data: partnerData, error: partnerError } = await supabase
          .from('delivery_partners')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (partnerError) {
          throw partnerError;
        }
        
        setDeliveryPartner(partnerData as DeliveryPartner);
        
        // Fetch assigned orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('delivery_partner_id', partnerData.id)
          .order('created_at', { ascending: false });
          
        if (ordersError) {
          throw ordersError;
        }
        
        setOrders(ordersData as Order[]);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
        toast({
          title: 'Error fetching deliveries',
          description: 'Could not load your assigned deliveries.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeliveries();
  }, [user]);
  
  // Toggle active status
  const toggleActiveStatus = async (status: boolean) => {
    if (!deliveryPartner) return;
    
    try {
      // Update active status in database
      const { error } = await supabase
        .from('delivery_partners')
        .update({ is_active: status })
        .eq('id', deliveryPartner.id);
        
      if (error) throw error;
      
      // Update local state
      setDeliveryPartner(prev => prev ? { ...prev, is_active: status } : null);
      
      toast({
        title: status ? 'You are now active' : 'You are now inactive',
        description: status 
          ? 'You can now receive delivery assignments' 
          : 'You will not receive new delivery assignments',
      });
      
      // If switching to inactive, clear location tracking interval
      if (!status && locationInterval) {
        clearInterval(locationInterval);
        setLocationInterval(null);
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast({
        title: 'Error updating status',
        description: 'Could not update your active status.',
        variant: 'destructive'
      });
    }
  };
  
  // Start delivery tracking
  const startDelivery = async (order: Order) => {
    if (!deliveryPartner) return;
    
    try {
      // Update order status to in_transit
      const { error } = await supabase
        .from('orders')
        .update({ status: 'in_transit' })
        .eq('id', order.id);
        
      if (error) throw error;
      
      // Update local state
      setOrders(prev => 
        prev.map(o => o.id === order.id ? { ...o, status: 'in_transit' } : o)
      );
      
      // Start sending location updates
      if (locationInterval) {
        clearInterval(locationInterval);
      }
      
      // Use geolocation API if available, otherwise simulate location
      if (navigator.geolocation) {
        // Get initial position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Update delivery partner location in database
            updateDeliveryPartnerLocation(latitude, longitude);
            
            // Send initial location update
            sendLocationUpdate({
              delivery_partner_id: deliveryPartner.id,
              order_id: order.id,
              lat: latitude,
              lng: longitude
            });
            
            // Start interval to update location
            const interval = setInterval(() => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  
                  // Update delivery partner location in database
                  updateDeliveryPartnerLocation(latitude, longitude);
                  
                  // Send location update via socket
                  sendLocationUpdate({
                    delivery_partner_id: deliveryPartner.id,
                    order_id: order.id,
                    lat: latitude,
                    lng: longitude
                  });
                },
                (err) => {
                  console.error('Error getting location:', err);
                  simulateLocationUpdates(order, deliveryPartner);
                }
              );
            }, 3000);
            
            setLocationInterval(interval);
          },
          (error) => {
            console.error('Error getting location:', error);
            simulateLocationUpdates(order, deliveryPartner);
          }
        );
      } else {
        // Geolocation not supported, simulate location updates
        simulateLocationUpdates(order, deliveryPartner);
      }
      
      toast({
        title: 'Delivery started',
        description: 'You are now delivering this order. Location tracking is active.',
      });
      
      // Navigate to tracking page
      router.push(`/dashboard/tracking/${order.id}`);
    } catch (error) {
      console.error('Error starting delivery:', error);
      toast({
        title: 'Error starting delivery',
        description: 'Could not start the delivery tracking.',
        variant: 'destructive'
      });
    }
  };
  
  // Simulate location updates if geolocation is not available
  const simulateLocationUpdates = (order: Order, partner: DeliveryPartner) => {
    // Start from pickup location
    let currentLat = order.pickup_lat;
    let currentLng = order.pickup_lng;
    
    // Calculate step sizes to move towards delivery location
    const latDiff = order.delivery_lat - order.pickup_lat;
    const lngDiff = order.delivery_lng - order.pickup_lng;
    const steps = 20; // Number of steps to reach delivery
    const latStep = latDiff / steps;
    const lngStep = lngDiff / steps;
    let step = 0;
    
    // Update delivery partner location in database
    updateDeliveryPartnerLocation(currentLat, currentLng);
    
    // Send initial location update
    sendLocationUpdate({
      delivery_partner_id: partner.id,
      order_id: order.id,
      lat: currentLat,
      lng: currentLng
    });
    
    // Start interval to update location
    const interval = setInterval(() => {
      if (step < steps) {
        step++;
        currentLat += latStep;
        currentLng += lngStep;
        
        // Add small random variation for realism
        const latVariation = (Math.random() - 0.5) * 0.0005;
        const lngVariation = (Math.random() - 0.5) * 0.0005;
        currentLat += latVariation;
        currentLng += lngVariation;
        
        // Update delivery partner location in database
        updateDeliveryPartnerLocation(currentLat, currentLng);
        
        // Send location update via socket
        sendLocationUpdate({
          delivery_partner_id: partner.id,
          order_id: order.id,
          lat: currentLat,
          lng: currentLng
        });
      } else {
        // Reached destination, complete delivery
        completeDelivery(order.id);
        clearInterval(interval);
        setLocationInterval(null);
      }
    }, 3000);
    
    setLocationInterval(interval);
  };
  
  // Update delivery partner location in database
  const updateDeliveryPartnerLocation = async (lat: number, lng: number) => {
    if (!deliveryPartner) return;
    
    try {
      await supabase
        .from('delivery_partners')
        .update({ 
          current_lat: lat,
          current_lng: lng
        })
        .eq('id', deliveryPartner.id);
        
      // Update local state
      setDeliveryPartner(prev => 
        prev ? { ...prev, current_lat: lat, current_lng: lng } : null
      );
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };
  
  // Complete delivery
  const completeDelivery = async (orderId: string) => {
    try {
      // Update order status to delivered
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Update local state
      setOrders(prev => 
        prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o)
      );
      
      // Clear location tracking interval
      if (locationInterval) {
        clearInterval(locationInterval);
        setLocationInterval(null);
      }
      
      toast({
        title: 'Delivery completed',
        description: 'You have successfully completed this delivery.',
      });
    } catch (error) {
      console.error('Error completing delivery:', error);
      toast({
        title: 'Error completing delivery',
        description: 'Could not mark the delivery as completed.',
        variant: 'destructive'
      });
    }
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [locationInterval]);

  if (!deliveryPartner) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Deliveries</h1>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <TruckIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Delivery Partner Profile Not Found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Your delivery partner profile is not set up yet. Please complete your profile setup.
              </p>
              <Link href="/dashboard/profile">
                <Button>
                  Complete Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">My Deliveries</h1>
        
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="active-status" 
              checked={deliveryPartner.is_active}
              onCheckedChange={toggleActiveStatus}
            />
            <Label htmlFor="active-status">
              {deliveryPartner.is_active ? 'Active' : 'Inactive'}
            </Label>
          </div>
        </div>
      </div>
      
      {/* Active deliveries */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Active Deliveries</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.filter(o => ['assigned', 'in_transit'].includes(o.status)).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders
              .filter(o => ['assigned', 'in_transit'].includes(o.status))
              .map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">Pickup</div>
                          <div className="text-sm text-muted-foreground">{order.pickup_address}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium">Delivery</div>
                          <div className="text-sm text-muted-foreground">{order.delivery_address}</div>
                        </div>
                      </div>
                      
                      {order.status === 'assigned' ? (
                        <Button 
                          className="w-full" 
                          onClick={() => startDelivery(order)}
                        >
                          Start Delivery
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Link href={`/dashboard/tracking/${order.id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                              View Map
                            </Button>
                          </Link>
                          <Button 
                            className="flex-1"
                            onClick={() => completeDelivery(order.id)}
                          >
                            Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TruckIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Deliveries</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active deliveries at the moment.
                </p>
                {!deliveryPartner.is_active && (
                  <Button onClick={() => toggleActiveStatus(true)}>
                    Go Active
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Delivery history */}
      <div>
        <h2 className="text-lg font-medium mb-4">Delivery History</h2>
        
        {loading ? (
          <div className="border rounded-md animate-pulse">
            <div className="h-12 bg-muted"></div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ) : orders.filter(o => o.status === 'delivered').length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="border-b">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Order ID</th>
                      <th className="p-3 text-left font-medium">Date</th>
                      <th className="p-3 text-left font-medium">Delivery Address</th>
                      <th className="p-3 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter(o => o.status === 'delivered')
                      .map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="p-3 text-sm">{order.id.slice(0, 8)}</td>
                          <td className="p-3 text-sm">
                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="p-3 text-sm">
                            <div className="max-w-xs truncate">{order.delivery_address}</div>
                          </td>
                          <td className="p-3 text-right">
                            <Link href={`/dashboard/tracking/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Delivery History</h3>
                <p className="text-muted-foreground">
                  You haven't completed any deliveries yet.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}