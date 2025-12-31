import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Deposit from '@/models/Deposit';
import Farmer from '@/models/Farmer';
import Product from '@/models/Product';

// GET: List deposits (optionally filter by farmer)
export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const agricultorId = searchParams.get('agricultorId');

    try {
        const query = agricultorId ? { agricultor: agricultorId } : {};
        const deposits = await Deposit.find(query)
            .populate('agricultor', 'nome')
            .populate('agente', 'nome')
            .sort({ dataDeposito: -1 });

        return NextResponse.json({ success: true, data: deposits });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Erro ao buscar depósitos' }, { status: 400 });
    }
}

// POST: Register a new deposit
export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { agricultorId, agenteId, produtoId, produtoNome, quantidade, qualidade, precoBase } = body;

        // 1. Validate input
        if (!agricultorId || !agenteId || (!produtoId && !produtoNome) || !quantidade || !qualidade || !precoBase) {
            return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
        }

        // 2. Calculate Final Price based on Quality
        // A = 100%, B = 90%, C = 80%
        let qualityMultiplier = 1.0;
        if (qualidade === 'B') qualityMultiplier = 0.9;
        if (qualidade === 'C') qualityMultiplier = 0.8;

        const precoFinalAplicado = precoBase * qualityMultiplier;
        const valorTotal = precoFinalAplicado * quantidade;

        // 3. Fetch or Create Product Details
        let productDetails;
        if (produtoId) {
            productDetails = await Product.findById(produtoId);
        } else if (produtoNome) {
            // Find by name or create
            productDetails = await Product.findOne({ nome: produtoNome });
            if (!productDetails) {
                productDetails = await Product.create({
                    nome: produtoNome,
                    categoria: 'Grão', // Default category for these commodities
                    precoReferencia: precoBase,
                    descricao: `Produto gerado automaticamente: ${produtoNome}`
                });
            }
        }

        if (!productDetails) {
            return NextResponse.json({ success: false, error: 'Erro ao identificar produto' }, { status: 404 });
        }

        // 4. Create Deposit Record
        const deposit = await Deposit.create({
            agricultor: agricultorId,
            agente: agenteId,
            produto: {
                nome: productDetails.nome,
                categoria: productDetails.categoria,
                imagemUrl: productDetails.imagemUrl
            },
            quantidade,
            qualidade,
            precoUnitarioBase: precoBase,
            precoFinalAplicado,
            valorTotal,
        });

        // 5. Update Farmer Balance and Stock
        const farmer = await Farmer.findById(agricultorId);
        if (!farmer) {
            return NextResponse.json({ success: false, error: 'Agricultor não encontrado' }, { status: 404 });
        }

        farmer.saldo = (farmer.saldo || 0) + valorTotal;
        farmer.estoque.push({
            produto: productDetails.nome,
            quantidade,
            qualidade,
            dataEntrada: new Date()
        });

        await farmer.save();

        return NextResponse.json({
            success: true,
            data: {
                deposit,
                newBalance: farmer.saldo
            }
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
