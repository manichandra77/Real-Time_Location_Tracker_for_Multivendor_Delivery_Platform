"use client";

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MapPin, LogOut, Package, User, TruckIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          {/* Sidebar skeleton */}
          <div className="hidden md:flex w-64 flex-col bg-card border-r p-4">
            <div className="flex items-center gap-2 mb-8">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
          
          {/* Main content skeleton */}
          <div className="flex-1 flex flex-col">
            <div className="h-16 border-b flex items-center justify-between px-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="p-6 flex-1">
              <Skeleton className="h-8 w-64 mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar - desktop only */}
        <div className="hidden md:flex w-64 flex-col bg-card border-r">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">DeliveryTrack</span>
            </div>
            
            <div className="space-y-1">
              <Link href="/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <Package className="mr-2 h-5 w-5" />
                  Dashboard
                </Button>
              </Link>
              
              {user.role === 'vendor' && (
                <>
                  <Link href="/dashboard/orders">
                    <Button variant="ghost" className="w-full justify-start">
                      <Package className="mr-2 h-5 w-5" />
                      Orders
                    </Button>
                  </Link>
                </>
              )}
              
              {user.role === 'delivery' && (
                <>
                  <Link href="/dashboard/deliveries">
                    <Button variant="ghost" className="w-full justify-start">
                      <TruckIcon className="mr-2 h-5 w-5" />
                      My Deliveries
                    </Button>
                  </Link>
                </>
              )}
              
              {user.role === 'customer' && (
                <>
                  <Link href="/dashboard/my-orders">
                    <Button variant="ghost" className="w-full justify-start">
                      <Package className="mr-2 h-5 w-5" />
                      My Orders
                    </Button>
                  </Link>
                </>
              )}
              
              <Link href="/dashboard/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-5 w-5" />
                  Profile
                </Button>
              </Link>
              
              <Link href="/dashboard/settings">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile header */}
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-card md:bg-background">
            <div className="flex md:hidden items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-bold">DeliveryTrack</span>
            </div>
            
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold">
                {user.role === 'vendor' ? 'Vendor Dashboard' : 
                 user.role === 'delivery' ? 'Delivery Partner Dashboard' : 
                 'Customer Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-sm text-muted-foreground">
                {user.name}
              </div>
              
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden"
                onClick={() => signOut()}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          
          {/* Mobile navigation */}
          <div className="md:hidden h-16 border-t flex items-center justify-around bg-background">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="flex flex-col items-center justify-center h-full">
                <Package className="h-5 w-5" />
                <span className="text-xs mt-1">Home</span>
              </Button>
            </Link>
            
            {user.role === 'vendor' && (
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="icon" className="flex flex-col items-center justify-center h-full">
                  <Package className="h-5 w-5" />
                  <span className="text-xs mt-1">Orders</span>
                </Button>
              </Link>
            )}
            
            {user.role === 'delivery' && (
              <Link href="/dashboard/deliveries">
                <Button variant="ghost" size="icon" className="flex flex-col items-center justify-center h-full">
                  <TruckIcon className="h-5 w-5" />
                  <span className="text-xs mt-1">Deliveries</span>
                </Button>
              </Link>
            )}
            
            {user.role === 'customer' && (
              <Link href="/dashboard/my-orders">
                <Button variant="ghost" size="icon" className="flex flex-col items-center justify-center h-full">
                  <Package className="h-5 w-5" />
                  <span className="text-xs mt-1">Orders</span>
                </Button>
              </Link>
            )}
            
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="icon" className="flex flex-col items-center justify-center h-full">
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}