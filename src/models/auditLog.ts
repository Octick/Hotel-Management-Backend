import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  source: string;
  payload: any;
  status: string;
  receivedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    source: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, required: true },
    receivedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);






