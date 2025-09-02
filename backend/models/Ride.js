// Ride Model
const rideSchema = new mongoose.Schema({
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    origin: {
        address: { type: String, required: true },
        coordinates: { lat: Number, lng: Number }
    },
    destination: {
        address: { type: String, required: true },
        coordinates: { lat: Number, lng: Number }
    },
    departureTime: { type: Date, required: true },
    availableSeats: { type: Number, required: true, min: 1, max: 8 },
    bookedSeats: { type: Number, default: 0 },
    pricePerSeat: { type: Number, required: true },
    carDetails: {
        make: String,
        model: String,
        color: String,
        licensePlate: String
    },
    preferences: {
        smoking: { type: Boolean, default: false },
        pets: { type: Boolean, default: false },
        music: { type: Boolean, default: true }
    },
    status: { 
        type: String, 
        enum: ['active', 'completed', 'cancelled'], 
        default: 'active' 
    },
    createdAt: { type: Date, default: Date.now }
});
