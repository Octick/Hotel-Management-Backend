import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  category: string;
  price: number;
  available: boolean;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MenuItem: Model<IMenuItem> = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);






