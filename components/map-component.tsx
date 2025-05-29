"use client";

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationUpdate, Order } from '@/types';
import { useSocket } from '@/context/socket-context';

// Fix the marker icon issue in Leaflet with Next.js
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// This component will automatically update map view when location changes
function MapUpdater({ 
  center, 
  zoom = 13 
}: { 
  center: [number, number]; 
  zoom?: number;
}) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

interface MapComponentProps {
  order: Order;
  initialLocation?: [number, number];
  trackingEnabled?: boolean;
}

export default function MapComponent({ 
  order,
  initialLocation,
  trackingEnabled = false
}: MapComponentProps) {
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(
    initialLocation || [order.pickup_lat, order.pickup_lng]
  );
  const { socket } = useSocket();
  const [mapReady, setMapReady] = useState(false);

  // Listen for real-time location updates
  useEffect(() => {
    if (!socket || !trackingEnabled || !order.delivery_partner_id) return;
    
    // Subscribe to location updates for this order
    socket.on('location_update', (data: LocationUpdate) => {
      if (data.order_id === order.id) {
        setCurrentLocation([data.lat, data.lng]);
      }
    });
    
    return () => {
      socket.off('location_update');
    };
  }, [socket, order.id, order.delivery_partner_id, trackingEnabled]);
  
  // Set map as ready after mount to avoid SSR issues
  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="w-full h-96 bg-muted rounded-md flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  return (
    <div className="h-96 rounded-md overflow-hidden border">
      <MapContainer
        center={currentLocation}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Pickup location marker */}
        <Marker 
          position={[order.pickup_lat, order.pickup_lng]} 
          icon={pickupIcon}
        >
          <Popup>
            <div className="p-2">
              <p className="font-semibold mb-1">Pickup Location</p>
              <p className="text-sm">{order.pickup_address}</p>
            </div>
          </Popup>
        </Marker>
        
        {/* Delivery location marker */}
        <Marker 
          position={[order.delivery_lat, order.delivery_lng]} 
          icon={deliveryIcon}
        >
          <Popup>
            <div className="p-2">
              <p className="font-semibold mb-1">Delivery Location</p>
              <p className="text-sm">{order.delivery_address}</p>
            </div>
          </Popup>
        </Marker>
        
        {/* Current location marker (only when tracking is enabled) */}
        {trackingEnabled && order.status === 'in_transit' && (
          <Marker 
            position={currentLocation} 
            icon={currentLocationIcon}
          >
            <Popup>
              <div className="p-2">
                <p className="font-semibold mb-1">Delivery Partner</p>
                <p className="text-sm">Currently en route to delivery location</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* This component will update the map view when location changes */}
        <MapUpdater 
          center={trackingEnabled ? currentLocation : [order.pickup_lat, order.pickup_lng]} 
        />
      </MapContainer>
    </div>
  );
}