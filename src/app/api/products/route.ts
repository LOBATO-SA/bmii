import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
    await dbConnect();
    try {
        const products = await Product.find({}).sort({ dataCriacao: -1 }).lean();
        const formattedProducts = products.map((product: any) => ({
            id: product._id.toString(),
            nome: product.nome || product.name,
            categoria: product.categoria || product.category,
            unidade: product.unidade || product.unit,
            quantidade: product.quantidade || 0,
            precoReferencia: product.precoReferencia || product.pricePerUnit || 0,
            imagemUrl: product.imagemUrl,
            status: product.status || 'Ativo',
            dataCriacao: (product.dataCriacao || product.createdAt || new Date()).toISOString().split('T')[0],
        }));
        return NextResponse.json({ success: true, data: formattedProducts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    try {
        const body = await request.json();

        // Handle Image Upload
        let imagemUrl = '';
        if (body.imagemUrl && body.imagemUrl.startsWith('data:image')) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(body.imagemUrl, {
                    folder: 'bmii_products',
                });
                imagemUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                return NextResponse.json({ success: false, error: 'Erro ao carregar imagem' }, { status: 500 });
            }
        }

        const productData = {
            ...body,
            imagemUrl: imagemUrl || body.imagemUrl // Fallback if regular URL or upload failed/skipped
        };

        const product: any = await Product.create(productData);

        return NextResponse.json({
            success: true,
            data: {
                id: product._id.toString(),
                nome: product.nome,
                categoria: product.categoria,
                unidade: product.unidade,
                quantidade: product.quantidade,
                precoReferencia: product.precoReferencia,
                imagemUrl: product.imagemUrl,
                status: product.status,
                dataCriacao: product.dataCriacao.toISOString().split('T')[0],
            }
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
