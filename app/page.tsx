import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MapPin, Package, TruckIcon, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 md:px-10 bg-white border-b dark:bg-card dark:border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">DeliveryTrack</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Register</Button>
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-6 md:px-10 py-16 md:py-24 bg-gradient-to-b from-background to-muted">
        <div className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Real-Time Delivery Tracking Solution
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Connect vendors, delivery partners, and customers with live location tracking for a seamless delivery experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register?role=vendor">
              <Button size="lg" className="w-full sm:w-auto">I'm a Vendor</Button>
            </Link>
            <Link href="/register?role=delivery">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">I'm a Delivery Partner</Button>
            </Link>
          </div>
        </div>

        <div className="w-full max-w-md aspect-square bg-card rounded-lg shadow-lg border overflow-hidden relative">
          <div className="absolute inset-0" style={{ 
            backgroundImage: "url('https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15
          }}></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div className="w-full h-full rounded-md bg-background/50 backdrop-blur-sm shadow-md p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Real-Time Tracking</h3>
                <p className="text-muted-foreground">Track your delivery in real-time with live map updates every 2-3 seconds.</p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-4 bg-primary/10 rounded-md">
                  <Users className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xs text-center">Vendor Dashboard</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-primary/10 rounded-md">
                  <TruckIcon className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xs text-center">Delivery Tracking</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-primary/10 rounded-md">
                  <Package className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xs text-center">Order Management</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-primary/10 rounded-md">
                  <MapPin className="h-5 w-5 text-primary mb-2" />
                  <span className="text-xs text-center">Live Map View</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature section */}
      <section className="py-16 px-6 md:px-10 bg-card">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-background p-6 rounded-lg shadow border">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Vendor Dashboard</h3>
            <p className="text-muted-foreground">Manage orders and assign delivery partners with an intuitive vendor dashboard.</p>
          </div>
          <div className="bg-background p-6 rounded-lg shadow border">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <TruckIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Delivery Partner App</h3>
            <p className="text-muted-foreground">Start deliveries and share real-time location updates with customers and vendors.</p>
          </div>
          <div className="bg-background p-6 rounded-lg shadow border">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Customer Tracking</h3>
            <p className="text-muted-foreground">Track delivery progress with a live map showing real-time location updates.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-10 bg-muted border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-bold">DeliveryTrack</span>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DeliveryTrack. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}