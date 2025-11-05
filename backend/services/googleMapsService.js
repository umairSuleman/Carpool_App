import axios from 'axios';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// load .env from backend folder (one level above services)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

console.log("🧩 .env loaded from:", path.resolve(__dirname, "../.env"));
console.log("🔑 GOOGLE_MAPS_API_KEY:", process.env.GOOGLE_MAPS_API_KEY ? "✅ Exists" : "❌ Missing");

class GoogleMapsService {
  constructor() {
    console.log('🔍 Loading Google Maps API Key...');
    console.log('🔍 process.env.GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? 'EXISTS (length: ' + process.env.GOOGLE_MAPS_API_KEY.length + ')' : 'UNDEFINED');
    
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
    
    if (!this.apiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY is not set!');
    } else {
      console.log('✅ Google Maps API key loaded successfully');
      console.log('🔑 Key starts with:', this.apiKey.substring(0, 10) + '...');
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address) {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          success: true,
          lat: location.lat,
          lng: location.lng,
          formatted_address: response.data.results[0].formatted_address
        };
      }

      return {
        success: false,
        error: 'Address not found'
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        success: false,
        error: 'Failed to geocode address'
      };
    }
  }

  /**
   * Get route details between origin and destination
   * This validates the frontend calculation
   */
  async getRouteDetails(origin, destination, waypoints = []) {
    try {

      // Format origin/destination - handle both string and object formats
      let originParam;
      let destinationParam;

      if (typeof origin === 'string') {
        originParam = origin;
      } else if (origin && typeof origin === 'object') {
        // Ensure we have numbers, not strings
        const lat = parseFloat(origin.lat);
        const lng = parseFloat(origin.lng);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid origin coordinates');
        }
        originParam = `${lat},${lng}`;
      } else {
        throw new Error('Invalid origin format');
      }
      
      if (typeof destination === 'string') {
        destinationParam = destination;
      } else if (destination && typeof destination === 'object') {
        // Ensure we have numbers, not strings
        const lat = parseFloat(destination.lat);
        const lng = parseFloat(destination.lng);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid destination coordinates');
        }
        destinationParam = `${lat},${lng}`;
      } else {
        throw new Error('Invalid destination format');
      }

      const params = {
        origin: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
        destination: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
        key: this.apiKey
      };

      // Add waypoints if provided
      if (waypoints && waypoints.length > 0) {
        params.waypoints = waypoints.map(wp => 
          typeof wp === 'string' ? wp : `${wp.lat},${wp.lng}`
        ).join('|');
      }

      console.log('[Google Maps] Requesting directions with params:', params);

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params
      });

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0]; // For single route

        // Calculate total distance and duration for all legs
        let totalDistance = 0;
        let totalDuration = 0;
        
        route.legs.forEach(leg => {
          totalDistance += leg.distance.value; // in meters
          totalDuration += leg.duration.value; // in seconds
        });

        return {
          success: true,
          distance_km: (totalDistance / 1000).toFixed(2), // Convert to km
          duration_minutes: Math.round(totalDuration / 60), // Convert to minutes
          polyline: route.overview_polyline.points,
          start_address: route.legs[0].start_address,
          end_address: route.legs[route.legs.length - 1].end_address,
          bounds: route.bounds,
          waypoint_order: route.waypoint_order
        };
      }

      return {
        success: false,
        error: 'Route not found'
      };
    } catch (error) {
      console.error('Directions API error:', error);
      return {
        success: false,
        error: 'Failed to calculate route'
      };
    }
  }

  /**
   * Validate that frontend-provided route data matches backend calculation
   * This prevents users from manipulating distance/duration
   */
  async validateRouteData(routeData) {
    const { 
      source_address, 
      destination_address, 
      waypoints,
      distance_km, 
      duration_minutes 
    } = routeData;

    // Get actual route from Google
    const actualRoute = await this.getRouteDetails(
      source_address,
      destination_address,
      waypoints
    );

    if (!actualRoute.success) {
      return {
        valid: false,
        error: 'Could not validate route'
      };
    }

    // Allow 10% tolerance for distance/duration differences
    const distanceTolerance = 0.1; // 10%
    const durationTolerance = 0.15; // 15% (traffic can vary)

    const distanceDiff = Math.abs(actualRoute.distance_km - distance_km) / actualRoute.distance_km;
    const durationDiff = Math.abs(actualRoute.duration_minutes - duration_minutes) / actualRoute.duration_minutes;

    const isValid = distanceDiff <= distanceTolerance && durationDiff <= durationTolerance;

    return {
      valid: isValid,
      actualRoute,
      provided: {
        distance_km,
        duration_minutes
      },
      difference: {
        distance_percent: (distanceDiff * 100).toFixed(2),
        duration_percent: (durationDiff * 100).toFixed(2)
      }
    };
  }

  /**
   * Calculate estimated fare based on distance
   */
  calculateEstimatedFare(distance_km, baseRate = 5, perKmRate = 8) {
    const fare = baseRate + (distance_km * perKmRate);
    return Math.round(fare);
  }

  /**
   * Get nearby places/landmarks for a location
   */
  async getNearbyPlaces(lat, lng, radius = 1000, type = 'point_of_interest') {
    try {
      const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
        params: {
          location: `${lat},${lng}`,
          radius,
          type,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK') {
        return {
          success: true,
          places: response.data.results.slice(0, 5).map(place => ({
            name: place.name,
            address: place.vicinity,
            location: place.geometry.location
          }))
        };
      }

      return { success: false, places: [] };
    } catch (error) {
      console.error('Nearby places error:', error);
      return { success: false, places: [] };
    }
  }
}

export default new GoogleMapsService();