import mongoose from 'mongoose';

const AgentSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Por favor adicione um nome'],
    },
    email: {
        type: String,
        required: [true, 'Por favor adicione um email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Por favor adicione uma senha'],
    },
    status: {
        type: String,
        enum: ['Ativo', 'Inativo'],
        default: 'Ativo',
    },
    role: {
        type: String,
        enum: ['Admin', 'Agente'],
        default: 'Agente',
    },
    dataCriacao: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Agent || mongoose.model('Agent', AgentSchema);
