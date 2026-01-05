import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  uid: string;          // Firebase UID
  email: string;
  name: string;
  phone?: string;
  roles: string[];      // 'admin', 'receptionist', 'customer'
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String },
    roles: { 
      type: [String], 
      default: ['customer'],
      enum: ['admin', 'manager', 'receptionist', 'customer'] 
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);