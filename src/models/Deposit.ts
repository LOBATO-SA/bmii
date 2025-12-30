import mongoose from 'mongoose';

const DepositSchema = new mongoose.Schema({
    agricultor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true,
    },
    agente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true,
    },
    produto: {
        nome: { type: String, required: true },
        categoria: { type: String },
        imagemUrl: { type: String },
    },
    quantidade: {
        type: Number,
        required: true, // em Kg
    },
    qualidade: {
        type: String,
        enum: ['A', 'B', 'C'],
        required: true,
    },
    precoUnitarioBase: {
        type: Number,
        required: true,
    },
    precoFinalAplicado: {
        type: Number,
        required: true,
    },
    valorTotal: {
        type: Number,
        required: true,
    },
    dataDeposito: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);
