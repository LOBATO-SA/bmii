import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    cliente: {
        nome: { type: String, required: true },
        telefone: { type: String, required: true },
        email: { type: String },
        endereco: { type: String }
    },
    itens: [{
        produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        nome: { type: String, required: true },
        imagemUrl: { type: String },
        precoUnitario: { type: Number, required: true },
        quantidade: { type: Number, required: true }
    }],

    valorTotal: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Pendente', 'Confirmado', 'Entregue', 'Cancelado'],
        default: 'Pendente'
    },
    dataPedido: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
