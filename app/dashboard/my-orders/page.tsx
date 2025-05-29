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
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Order } from '@/types';
import { Package, MapPin, TruckIcon, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const supabase = createClient();

  // Fetch customer orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch orders for this customer
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setOrders(data as Order[]);
        setFilteredOrders(data as Order[]);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user]);
  
  // Filter orders when search term or status filter changes
  useEffect(() => {
    if (!orders.length) return;
    
    let filtered = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(search) ||
        order.pickup_address.toLowerCase().includes(search) ||
        order.delivery_address.toLowerCase().includes(search)
      );
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  // Get active orders (in_transit, assigned, pending)
  const activeOrders = filteredOrders.filter(
    order => ['in_transit', 'assigned', 'pending'].includes(order.status)
  );
  
  // Get completed orders (delivered)
  const completedOrders = filteredOrders.filter(
    order => order.status === 'delivered'
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Orders tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" className="flex gap-2">
            <TruckIcon className="h-4 w-4" /> Active Orders
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex gap-2">
            <Package className="h-4 w-4" /> Completed Orders
          </TabsTrigger>
        </TabsList>
        
        {/* Active orders tab */}
        <TabsContent value="active" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
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
          ) : activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${order.status === 'in_transit' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                          : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                          : order.status === 'assigned'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </div>
                    </div>
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
                      
                      <div className="pt-2">
                        <Link href={`/dashboard/tracking/${order.id}`}>
                          <Button className="w-full">
                            {order.status === 'in_transit' ? 'Track Delivery' : 'View Details'}
                          </Button>
                        </Link>
                      </div>
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
                  <h3 className="text-lg font-medium mb-2">No Active Orders</h3>
                  <p className="text-muted-foreground">
                    You don't have any active orders at the moment.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Completed orders tab */}
        <TabsContent value="completed">
          {loading ? (
            <Card>
              <CardContent className="p-0">
                <div className="border-b animate-pulse">
                  <div className="h-12 bg-muted"></div>
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : completedOrders.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="border-b">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Order ID</th>
                        <th className="p-3 text-left font-medium">Date</th>
                        <th className="p-3 text-left font-medium">From</th>
                        <th className="p-3 text-left font-medium">To</th>
                        <th className="p-3 text-right font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="p-3 text-sm">{order.id.slice(0, 8)}</td>
                          <td className="p-3 text-sm">
                            {format(new Date(order.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="p-3 text-sm">
                            <div className="max-w-xs truncate">{order.pickup_address}</div>
                          </td>
                          <td className="p-3 text-sm">
                            <div className="max-w-xs truncate">{order.delivery_address}</div>
                          </td>
                          <td className="p-3 text-right">
                            <Link href={`/dashboard/tracking/${order.id}`}>
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Completed Orders</h3>
                  <p className="text-muted-foreground">
                    You don't have any completed orders yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}