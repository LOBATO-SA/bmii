import mongoose from 'mongoose';

const FarmerSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome é obrigatório'],
        trim: true,
    },
    bi: {
        type: String,
        required: [true, 'O BI é obrigatório'],
        unique: true,
        trim: true,
    },
    telefone: {
        type: String,
        required: [true, 'O telefone é obrigatório'],
    },
    endereco: {
        type: String,
        required: [true, 'O endereço é obrigatório'],
    },
    fotoUrl: {
        type: String,
        required: [true, 'A foto é obrigatória'],
    },
    agenteResponsavel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true,
    },
    dataRegisto: {
        type: Date,
        default: Date.now,
    },
    saldo: {
        type: Number,
        default: 0,
    },
    estoque: [{
        produto: { type: String, required: true },
        quantidade: { type: Number, required: true }, // em Kg
        qualidade: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
        precoAquisicao: { type: Number }, // Preço por Kg no ato do depósito
        dataEntrada: { type: Date, default: Date.now }
    }]
});

export default mongoose.models.Farmer || mongoose.model('Farmer', FarmerSchema);
