import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Producer from '@/models/Producer';

const INITIAL_PRODUCTS = [
    { name: 'Milho Amarelo', category: 'Cereais', unit: 'kg', pricePerUnit: 15, description: 'Milho amarelo de alta qualidade' },
    { name: 'Feijão Manteiga', category: 'Leguminosas', unit: 'kg', pricePerUnit: 45, description: 'Feijão manteiga nacional' },
    { name: 'Arroz Agulha', category: 'Cereais', unit: 'kg', pricePerUnit: 30, description: 'Arroz agulha extra' },
    { name: 'Soja', category: 'Oleaginosas', unit: 'kg', pricePerUnit: 25, description: 'Soja em grão' },
];

export async function GET() {
    await dbConnect();
    try {
        // Limpar e popular produtos
        await Product.deleteMany({});
        const products = await Product.insertMany(INITIAL_PRODUCTS);

        // Criar um produtor de teste se não existir
        let testProducer = await Producer.findOne({ phone: '900000000' });
        if (!testProducer) {
            testProducer = await Producer.create({
                name: 'Produtor Exemplo',
                phone: '900000000',
                address: 'Província de Huambo, Angola',
                balance: 0
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully',
            products,
            testProducer
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
