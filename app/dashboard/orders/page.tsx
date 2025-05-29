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
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Order, Vendor, User, DeliveryPartner } from '@/types';
import { Package, Plus, TruckIcon, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

export default function OrdersPage() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<(DeliveryPartner & { user: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const { toast } = useToast();
  const supabase = createClient();

  // Fetch vendor details and orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get vendor details
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (vendorError) {
          throw vendorError;
        }
        
        setVendor(vendorData as Vendor);
        
        // Fetch orders for this vendor
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false });
          
        if (ordersError) {
          throw ordersError;
        }
        
        setOrders(ordersData as Order[]);
        setFilteredOrders(ordersData as Order[]);
        
        // Fetch available delivery partners
        const { data: partnersData, error: partnersError } = await supabase
          .from('delivery_partners')
          .select(`
            *,
            user:user_id (
              id,
              name,
              email
            )
          `)
          .eq('is_active', true);
          
        if (partnersError) {
          throw partnersError;
        }
        
        setDeliveryPartners(partnersData as any[]);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: 'Error fetching orders',
          description: 'Could not load your orders.',
          variant: 'destructive'
        });
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
  
  // Open assign dialog
  const openAssignDialog = (order: Order) => {
    setSelectedOrder(order);
    setSelectedPartnerId('');
    setIsAssignDialogOpen(true);
  };
  
  // Assign delivery partner to order
  const assignDeliveryPartner = async () => {
    if (!selectedOrder || !selectedPartnerId) return;
    
    try {
      // Update order with delivery partner
      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_partner_id: selectedPartnerId,
          status: 'assigned'
        })
        .eq('id', selectedOrder.id);
        
      if (error) throw error;
      
      // Update local state
      setOrders(prev => 
        prev.map(o => o.id === selectedOrder.id ? { 
          ...o, 
          delivery_partner_id: selectedPartnerId,
          status: 'assigned'
        } : o)
      );
      
      // Close dialog
      setIsAssignDialogOpen(false);
      
      // Show success message
      toast({
        title: 'Delivery partner assigned',
        description: 'The delivery partner has been assigned to this order.',
      });
    } catch (error) {
      console.error('Error assigning delivery partner:', error);
      toast({
        title: 'Error assigning delivery partner',
        description: 'Could not assign the delivery partner to this order.',
        variant: 'destructive'
      });
    }
  };

  if (!vendor) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Orders</h1>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">Vendor Profile Not Found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Your vendor profile is not set up yet. Please complete your profile setup.
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
        <h1 className="text-2xl font-bold">Orders</h1>
        
        <div className="mt-4 md:mt-0">
          <Link href="/dashboard/orders/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Order
            </Button>
          </Link>
        </div>
      </div>
      
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
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Orders list */}
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>
            View and manage your orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="border rounded-md animate-pulse">
              <div className="h-12 bg-muted"></div>
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Order ID</th>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Delivery</th>
                    <th className="p-3 text-left font-medium">Delivery Address</th>
                    <th className="p-3 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="p-3 text-sm">{order.id.slice(0, 8)}</td>
                      <td className="p-3 text-sm">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="p-3">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${order.status === 'delivered' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : order.status === 'in_transit' 
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
                      </td>
                      <td className="p-3 text-sm">
                        {order.delivery_partner_id ? (
                          <span className="text-green-600 dark:text-green-400">Assigned</span>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openAssignDialog(order)}
                            disabled={order.status !== 'pending'}
                          >
                            <TruckIcon className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        )}
                      </td>
                      <td className="p-3 text-sm">
                        <div className="max-w-xs truncate">
                          {order.delivery_address}
                        </div>
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
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Orders Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'No orders match your search criteria'
                  : 'You have not created any orders yet'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/dashboard/orders/create">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Order
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Assign delivery partner dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Partner</DialogTitle>
            <DialogDescription>
              Select a delivery partner to assign to this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedOrder && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Order #{selectedOrder.id.slice(0, 8)}</div>
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm">From: {selectedOrder.pickup_address}</div>
                    <div className="text-sm">To: {selectedOrder.delivery_address}</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Partner</label>
              {deliveryPartners.length > 0 ? (
                <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a delivery partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryPartners.map((partner) => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No active delivery partners available.
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={assignDeliveryPartner} 
                disabled={!selectedPartnerId || deliveryPartners.length === 0}
              >
                Assign Partner
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}