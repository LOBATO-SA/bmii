import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import mongoose from 'mongoose';

export async function POST(request: Request) {
    await dbConnect();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const body = await request.json();
        const { cliente, itens } = body; // itens: [{ produtoId, quantity }]

        // 1. Basic Validation
        if (!cliente?.nome || !cliente?.telefone || !itens || !Array.isArray(itens) || itens.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields or empty cart' },
                { status: 400 }
            );
        }

        let totalValue = 0;
        const orderItems = [];

        // 2. Process each item (Validation & Stock Check)
        for (const item of itens) {
            const product = await Product.findById(item.produtoId).session(session);

            if (!product) {
                throw new Error(`Product not found: ${item.produtoId}`);
            }

            if (product.quantidade < item.quantidade) {
                throw new Error(`Insufficient stock for ${product.nome}. Only ${product.quantidade} available.`);
            }

            // Add to order items list
            orderItems.push({
                produtoId: product._id,
                nome: product.nome,
                imagemUrl: product.imagemUrl,
                precoUnitario: product.precoReferencia,
                quantidade: item.quantidade
            });

            // Calculate value
            totalValue += product.precoReferencia * item.quantidade;

            // Decrement Stock
            product.quantidade -= item.quantidade;
            await product.save({ session });
        }

        // 3. Create Order
        const newOrder = await Order.create([{
            cliente,
            itens: orderItems,
            valorTotal: totalValue,
            status: 'Pendente'
        }], { session });

        await session.commitTransaction();

        return NextResponse.json({
            success: true,
            data: newOrder[0],
            message: 'Order created successfully'
        });

    } catch (error: any) {
        await session.abortTransaction();
        console.error('Order creation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Error processing order' },
            { status: 500 }
        );
    } finally {
        session.endSession();
    }
}
