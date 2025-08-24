const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['driver', 'passenger', 'both'], default: 'passenger' },
    profile: {
        age: Number,
        gender: String,
        bio: String,
        preferences: {
        smoking: { type: Boolean, default: false },
        pets: { type: Boolean, default: false },
        music: { type: Boolean, default: true }
        }
    },
    rating: { type: Number, default: 5.0 },
    totalRides: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});