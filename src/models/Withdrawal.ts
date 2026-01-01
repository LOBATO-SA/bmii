import mongoose from 'mongoose';

const WithdrawalSchema = new mongoose.Schema({
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
        type: String, // Qualidade retirada (pode ser mixed, ou especificar a melhor disponível) - Simplificação: Apenas registo informativo ou 'Diversa'
        default: 'Padrão'
    },
    valorDebitado: { // Valor monetário descontado do saldo
        type: Number,
        required: true,
    },
    dataLevantamento: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.models.Withdrawal || mongoose.model('Withdrawal', WithdrawalSchema);
