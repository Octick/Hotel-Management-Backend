import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInventoryItem extends Document {
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true, unique: true, index: true },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    lowStockThreshold: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const InventoryItem: Model<IInventoryItem> = mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);






