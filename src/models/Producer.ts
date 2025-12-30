import mongoose, { Schema, Document } from 'mongoose';

export interface IProducer extends Document {
    name: string;
    phone: string;
    address?: string;
    balance: number; // Valor total estimado em carteira
}

const ProducerSchema: Schema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String },
    balance: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Producer || mongoose.model<IProducer>('Producer', ProducerSchema);
