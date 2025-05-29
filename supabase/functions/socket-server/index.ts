import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Server } from "npm:socket.io@4.7.2";
import { createClient } from "npm:@supabase/supabase-js@2.33.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Create Socket.IO server
  const io = new Server({
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Connection event
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    // Get auth data from the socket handshake
    const userId = socket.handshake.auth.userId;
    const userRole = socket.handshake.auth.userRole;
    
    console.log(`User connected: ${userId} (${userRole})`);

    // Location update event
    socket.on("location_update", async (data) => {
      try {
        // Validate data
        if (!data.delivery_partner_id || !data.order_id || !data.lat || !data.lng) {
          console.error("Invalid location update data:", data);
          return;
        }
        
        // Insert location update into database
        const { error } = await supabase
          .from("location_updates")
          .insert([{
            delivery_partner_id: data.delivery_partner_id,
            order_id: data.order_id,
            lat: data.lat,
            lng: data.lng
          }]);
          
        if (error) {
          console.error("Error inserting location update:", error);
          return;
        }
        
        // Broadcast location update to all clients
        socket.broadcast.emit("location_update", {
          order_id: data.order_id,
          delivery_partner_id: data.delivery_partner_id,
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error handling location update:", error);
      }
    });

    // Order status update event
    socket.on("order_status_update", async (data) => {
      try {
        // Validate data
        if (!data.order_id || !data.status) {
          console.error("Invalid order status update data:", data);
          return;
        }
        
        // Update order status in database
        const { error } = await supabase
          .from("orders")
          .update({ status: data.status })
          .eq("id", data.order_id);
          
        if (error) {
          console.error("Error updating order status:", error);
          return;
        }
        
        // Broadcast order status update to all clients
        io.emit("order_status_update", {
          order_id: data.order_id,
          status: data.status
        });
      } catch (error) {
        console.error("Error handling order status update:", error);
      }
    });

    // Disconnect event
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Serve Socket.IO
  const response = await io.serve(req);
  
  // Add CORS headers to the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
});