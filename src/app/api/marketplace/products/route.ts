import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET() {
    await dbConnect();

    try {
        // Fetch products that are 'Ativo' and have stock > 0
        // Selecting fields relevant for the marketplace catalog
        const products = await Product.find({
            status: 'Ativo',
            quantidade: { $gt: 0 }
        }).select('nome categoria quantidade precoReferencia imagemUrl unidade');

        return NextResponse.json({
            success: true,
            data: products
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
