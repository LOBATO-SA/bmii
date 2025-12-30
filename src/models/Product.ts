import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Por favor adicione um nome'],
    },
    categoria: {
        type: String,
        required: [true, 'Por favor adicione uma categoria'],
    },
    unidade: {
        type: String,
        default: 'kg',
    },
    quantidade: {
        type: Number,
        default: 0,
    },
    precoReferencia: {
        type: Number,
        required: [true, 'Por favor adicione um preço de referência'],
    },
    imagemUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: ['Ativo', 'Inativo'],
        default: 'Ativo',
    },
    dataCriacao: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
