import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Por favor adicione um nome'],
        unique: true,
    },
    descricao: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
