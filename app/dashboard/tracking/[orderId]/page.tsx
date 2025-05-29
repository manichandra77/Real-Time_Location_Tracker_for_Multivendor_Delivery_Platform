"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ArrowLeft, Package, TruckIcon, MapPin, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Order, DeliveryPartner, User } from '@/types';
import MapComponent from '@/components/map-component';
import { format } from 'date-fns';
import { useSocket } from '@/context/socket-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function TrackingPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const { socket, connected } = useSocket();
  const [order, setOrder] = useState<Order | null>(null);
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartner | null>(null);
  const [partnerUser, setPartnerUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const supabase = createClient();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', params.orderId)
          .single();
          
        if (orderError) {
          throw orderError;
        }
        
        setOrder(orderData as Order);
        
        // If order has a delivery partner, fetch their details
        if (orderData.delivery_partner_id) {
          const { data: partnerData, error: partnerError } = await supabase
            .from('delivery_partners')
            .select('*')
            .eq('id', orderData.delivery_partner_id)
            .single();
            
          if (!partnerError && partnerData) {
            setDeliveryPartner(partnerData as DeliveryPartner);
            
            // Fetch partner user details
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', partnerData.user_id)
              .single();
              
            if (!userError && userData) {
              setPartnerUser(userData as User);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [params.orderId]);
  
  // Listen for real-time updates to the order status
  useEffect(() => {
    if (!socket || !params.orderId) return;
    
    socket.on('order_status_update', (data: { order_id: string; status: string }) => {
      if (data.order_id === params.orderId) {
        setOrder((prev) => prev ? { ...prev, status: data.status as any } : null);
        setLastUpdated(new Date());
      }
    });
    
    socket.on('location_update', () => {
      setLastUpdated(new Date());
    });
    
    return () => {
      socket.off('order_status_update');
      socket.off('location_update');
    };
  }, [socket, params.orderId]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost\" size="icon\" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 col-span-2" />
          
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Order Not Found</h1>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Order Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The order you're looking for couldn't be found.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'pending':
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Track Order #{order.id.slice(0, 8)}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Tracking</CardTitle>
              <CardDescription>
                Follow your delivery in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapComponent 
                order={order} 
                initialLocation={
                  deliveryPartner?.current_lat && deliveryPartner?.current_lng
                    ? [deliveryPartner.current_lat, deliveryPartner.current_lng]
                    : undefined
                }
                trackingEnabled={order.status === 'in_transit'}
              />
              
              <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    Last updated: {format(lastUpdated, 'h:mm:ss a')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Pickup</span>
                  <div className="h-2 w-2 rounded-full bg-blue-500 ml-2"></div>
                  <span>Delivery</span>
                  {order.status === 'in_transit' && (
                    <>
                      <div className="h-2 w-2 rounded-full bg-red-500 ml-2"></div>
                      <span>Current Location</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Order Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>
                Current status and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 text-sm font-medium">Status</div>
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </div>
              </div>
              
              <div>
                <div className="mb-2 text-sm font-medium">Order Date</div>
                <div className="text-sm">
                  {format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="mb-2 text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Pickup Location
                </div>
                <div className="text-sm">{order.pickup_address}</div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="mb-2 text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Delivery Location
                </div>
                <div className="text-sm">{order.delivery_address}</div>
              </div>
            </CardContent>
          </Card>
          
          {deliveryPartner && partnerUser && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Partner</CardTitle>
                <CardDescription>
                  Your delivery is being handled by
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TruckIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{partnerUser.name}</div>
                    <div className="text-sm text-muted-foreground">Delivery Partner</div>
                  </div>
                </div>
                
                {deliveryPartner.vehicle_type && (
                  <div>
                    <div className="mb-1 text-sm font-medium">Vehicle</div>
                    <div className="text-sm">{deliveryPartner.vehicle_type}</div>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <div className="mb-2 text-sm font-medium">Delivery Status</div>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status === 'pending' ? 'Waiting for pickup' :
                     order.status === 'assigned' ? 'Ready for pickup' :
                     order.status === 'in_transit' ? 'On the way' :
                     order.status === 'delivered' ? 'Delivered' : order.status}
                  </div>
                </div>
                
                {order.status === 'in_transit' && connected ? (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm">Live tracking active</span>
                    </div>
                  </div>
                ) : order.status === 'in_transit' && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Connecting to tracking...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}