//db/connectdb.js
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing in environment variables");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null,
    };
}

async function connectDB() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => {
            console.log("✅ MongoDB connected successfully");
            return mongoose;
        }).catch((err) => {
            console.error("❌ MongoDB connection error:", err);
            throw err;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default connectDB;