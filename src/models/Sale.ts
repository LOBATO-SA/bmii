import mongoose from 'mongoose';

const SaleSchema = new mongoose.Schema({
    agricultor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farmer',
        required: true
    },
    agente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    produto: {
        nome: String,
        categoria: String,
        imagemUrl: String
    },
    quantidade: {
        type: Number,
        required: true
    },
    precoUnitario: {
        type: Number,
        required: true
    },
    valorTotal: {
        type: Number,
        required: true
    },
    dataVenda: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
