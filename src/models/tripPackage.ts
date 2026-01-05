import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITripPackage extends Document {
  title: string;
  description: string;
  price: number;
  durationDays: number;
  itinerary: string[];
  isPublic: boolean;
}

const TripPackageSchema = new Schema<ITripPackage>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    itinerary: { type: [String], default: [] },
    isPublic: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const TripPackage: Model<ITripPackage> = mongoose.model<ITripPackage>('TripPackage', TripPackageSchema);






