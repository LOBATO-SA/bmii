import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import cloudinary from '@/lib/cloudinary';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const body = await request.json();
        const product = await Product.findById(id);

        if (!product) {
            return NextResponse.json(
                { success: false, error: 'Produto não encontrado' },
                { status: 404 }
            );
        }

        // Handle Image Update if new image is provided (base64)
        let imagemUrl = product.imagemUrl;
        if (body.imagemUrl && body.imagemUrl.startsWith('data:image')) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(body.imagemUrl, {
                    folder: 'bmii_products',
                });
                imagemUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                // Continue with update even if image upload fails, or return error?
                // Returning error is safer to let user know
                return NextResponse.json({ success: false, error: 'Erro ao atualizar imagem' }, { status: 500 });
            }
        }

        // Update fields
        // Mongoose schema uses: nome, categoria, unidade, quantidade, precoReferencia, imagemUrl, status
        product.nome = body.nome || product.nome;
        product.categoria = body.categoria || product.categoria;
        product.unidade = body.unidade || product.unidade;
        product.quantidade = body.quantidade !== undefined ? body.quantidade : product.quantidade;
        product.precoReferencia = body.precoReferencia !== undefined ? body.precoReferencia : product.precoReferencia;
        product.status = body.status || product.status;
        product.imagemUrl = imagemUrl;

        await product.save();

        return NextResponse.json({
            success: true,
            data: {
                id: product._id.toString(),
                nome: product.nome || product.name,
                categoria: product.categoria || product.category,
                unidade: product.unidade || product.unit,
                quantidade: product.quantidade || 0,
                precoReferencia: product.precoReferencia || product.pricePerUnit || 0,
                imagemUrl: product.imagemUrl,
                status: product.status || 'Ativo',
                dataCriacao: (product.dataCriacao || product.createdAt || new Date()).toISOString().split('T')[0],
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return NextResponse.json(
                { success: false, error: 'Produto não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
