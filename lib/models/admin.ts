import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAdmin extends Document {
   name: string;
   email: string;
   password: string;
   role: "admin";
}

const AdminSchema = new Schema<IAdmin>(
   {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, required: true },
      role: { type: String, enum: ["admin"], default: "admin" },
   },
   { timestamps: true }
);

export const Admin: Model<IAdmin> =
   mongoose.models.Admin || mongoose.model<IAdmin>("Admin", AdminSchema);
