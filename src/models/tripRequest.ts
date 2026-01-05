import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TripRequestStatus = 'Requested' | 'Reviewed' | 'Approved' | 'Rejected';

export interface ITripRequest extends Document {
  requestedBy: Types.ObjectId;
  details: string;
  status: TripRequestStatus;
  responseNotes?: string;
}

const TripRequestSchema = new Schema<ITripRequest>(
  {
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    details: { type: String, required: true },
    status: { type: String, enum: ['Requested', 'Reviewed', 'Approved', 'Rejected'], default: 'Requested', index: true },
    responseNotes: { type: String },
  },
  { timestamps: true }
);

export const TripRequest: Model<ITripRequest> = mongoose.model<ITripRequest>('TripRequest', TripRequestSchema);






