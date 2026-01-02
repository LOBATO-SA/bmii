import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    await dbConnect();

    try {
        const product = await Product.findById(params.id);

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Product not found' },
                { status: 404 }
            );
        }

        // Check if valid for marketplace
        if (product.status !== 'Ativo') {
            return NextResponse.json(
                { success: false, error: 'Product is not active' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: product
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Invalid ID format or Server Error' },
            { status: 500 }
        );
    }
}
