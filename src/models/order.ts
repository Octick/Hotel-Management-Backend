import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type OrderStatus = 'Preparing' | 'Ready' | 'Served' | 'Cancelled';

export interface IOrderItem {
  menuItemId: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  guestId: Types.ObjectId;
  roomId?: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  placedBy: Types.ObjectId; // user id (receptionist or customer)
}

const OrderItemSchema = new Schema<IOrderItem>({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    guestId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Preparing', 'Ready', 'Served', 'Cancelled'], default: 'Preparing', index: true },
    placedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);






