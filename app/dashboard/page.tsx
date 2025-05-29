"use client";

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TruckIcon, MapPin, Users, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch data based on user role
        if (user.role === 'vendor') {
          // Get vendor ID
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
          if (vendorData) {
            // Fetch orders for this vendor
            const { data: ordersData } = await supabase
              .from('orders')
              .select('*')
              .eq('vendor_id', vendorData.id)
              .order('created_at', { ascending: false });
              
            if (ordersData) {
              setOrders(ordersData);
              
              // Calculate stats
              setStats({
                total: ordersData.length,
                pending: ordersData.filter(o => o.status === 'pending').length,
                inTransit: ordersData.filter(o => o.status === 'in_transit').length,
                delivered: ordersData.filter(o => o.status === 'delivered').length
              });
            }
          }
        } else if (user.role === 'delivery') {
          // Get delivery partner ID
          const { data: partnerData } = await supabase
            .from('delivery_partners')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
          if (partnerData) {
            // Fetch orders assigned to this delivery partner
            const { data: ordersData } = await supabase
              .from('orders')
              .select('*')
              .eq('delivery_partner_id', partnerData.id)
              .order('created_at', { ascending: false });
              
            if (ordersData) {
              setOrders(ordersData);
              
              // Calculate stats
              setStats({
                total: ordersData.length,
                pending: ordersData.filter(o => o.status === 'assigned').length,
                inTransit: ordersData.filter(o => o.status === 'in_transit').length,
                delivered: ordersData.filter(o => o.status === 'delivered').length
              });
            }
          }
        } else if (user.role === 'customer') {
          // Fetch orders for this customer
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });
            
          if (ordersData) {
            setOrders(ordersData);
            
            // Calculate stats
            setStats({
              total: ordersData.length,
              pending: ordersData.filter(o => ['pending', 'assigned'].includes(o.status)).length,
              inTransit: ordersData.filter(o => o.status === 'in_transit').length,
              delivered: ordersData.filter(o => o.status === 'delivered').length
            });
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  if (!user) return null;
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-muted-foreground">
            {user.role === 'vendor' 
              ? 'Manage your store orders and delivery partners' 
              : user.role === 'delivery' 
                ? 'View and manage your assigned deliveries'
                : 'Track your orders and deliveries'}
          </p>
        </div>
        
        {user.role === 'vendor' && (
          <div className="mt-4 md:mt-0">
            <Link href="/dashboard/orders/create">
              <Button>
                <Package className="mr-2 h-4 w-4" />
                Create New Order
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h3 className="text-3xl font-bold">{stats.total}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {user.role === 'delivery' ? 'Assigned' : 'Pending'}
                </p>
                <h3 className="text-3xl font-bold">{stats.pending}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                <h3 className="text-3xl font-bold">{stats.inTransit}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TruckIcon className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                <h3 className="text-3xl font-bold">{stats.delivered}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent orders */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            {orders.length > 0 
              ? `Your ${orders.length} most recent orders` 
              : 'You have no orders yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <p>Loading orders...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Order ID</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-left font-medium">Delivery</th>
                    <th className="p-3 text-left font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="p-3 text-sm">{order.id.slice(0, 8)}</td>
                      <td className="p-3">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${order.status === 'delivered' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : order.status === 'in_transit' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                              : order.status === 'pending' || order.status === 'assigned'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm">
                        {order.delivery_partner_id ? (
                          <span className="text-green-600 dark:text-green-400">Assigned</span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                {user.role === 'vendor' 
                  ? 'Create your first order to get started'
                  : user.role === 'delivery'
                    ? 'You have no assigned deliveries yet'
                    : 'Place your first order to get started'}
              </p>
              {user.role === 'vendor' && (
                <Link href="/dashboard/orders/create">
                  <Button>
                    <Package className="mr-2 h-4 w-4" />
                    Create Order
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Role-specific cards */}
      {user.role === 'vendor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Partners</CardTitle>
              <CardDescription>Manage your delivery partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Assign Delivery Partners</h3>
                <p className="text-muted-foreground mb-4">
                  Assign delivery partners to your orders for real-time tracking
                </p>
                <Link href="/dashboard/orders">
                  <Button variant="outline">
                    Manage Orders
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Track Deliveries</CardTitle>
              <CardDescription>Monitor deliveries in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Live Tracking</h3>
                <p className="text-muted-foreground mb-4">
                  View real-time locations of your delivery partners
                </p>
                <Link href="/dashboard/tracking">
                  <Button variant="outline">
                    View Tracking
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {user.role === 'delivery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Deliveries</CardTitle>
              <CardDescription>Manage your assigned deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <TruckIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Start Deliveries</h3>
                <p className="text-muted-foreground mb-4">
                  Begin tracking and update delivery status
                </p>
                <Link href="/dashboard/deliveries">
                  <Button variant="outline">
                    Manage Deliveries
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Update your delivery profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Profile Settings</h3>
                <p className="text-muted-foreground mb-4">
                  Update your vehicle and contact information
                </p>
                <Link href="/dashboard/profile">
                  <Button variant="outline">
                    Update Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {user.role === 'customer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Track Deliveries</CardTitle>
              <CardDescription>Follow your deliveries in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Live Tracking</h3>
                <p className="text-muted-foreground mb-4">
                  Watch as your order makes its way to you
                </p>
                <Link href="/dashboard/my-orders">
                  <Button variant="outline">
                    View Active Orders
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View your past orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Order History</h3>
                <p className="text-muted-foreground mb-4">
                  Check details of your previous orders
                </p>
                <Link href="/dashboard/my-orders">
                  <Button variant="outline">
                    View History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}