import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.MONGO_URI;

if (!MONGODB_URI) {
   throw new Error("Missing MONGODB_URI or MONGO_URI in environment");
}

const MONGODB_URI_SAFE = MONGODB_URI as string;

type MongooseCache = {
   conn: typeof mongoose | null;
   promise: Promise<typeof mongoose> | null;
};

declare global {
   var mongooseCache: MongooseCache | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
   global.mongooseCache = cached;
}

export async function dbConnect() {
   if (cached.conn) {
      return cached.conn;
   }

   if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI_SAFE, {
         bufferCommands: false,
      });
   }

   cached.conn = await cached.promise;
   return cached.conn;
}
