import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IInvoiceLineItem {
  description: string;
  qty: number;
  amount: number;
}

export interface IInvoice extends Document {
  bookingId: Types.ObjectId;
  lineItems: IInvoiceLineItem[];
  subtotal: number;
  total: number;
}

const InvoiceLineItemSchema = new Schema<IInvoiceLineItem>({
  description: { type: String, required: true },
  qty: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const InvoiceSchema = new Schema<IInvoice>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    lineItems: { type: [InvoiceLineItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Invoice: Model<IInvoice> = mongoose.model<IInvoice>('Invoice', InvoiceSchema);






