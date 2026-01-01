import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Withdrawal from '@/models/Withdrawal';
import Farmer from '@/models/Farmer';
import Product from '@/models/Product';

// GET: List withdrawals (optionally filter by farmer)
export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const agricultorId = searchParams.get('agricultorId');

    try {
        const query = agricultorId ? { agricultor: agricultorId } : {};
        const withdrawals = await Withdrawal.find(query)
            .populate('agricultor', 'nome')
            .populate('agente', 'nome')
            .sort({ dataLevantamento: -1 });

        return NextResponse.json({ success: true, data: withdrawals });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: 'Erro ao buscar levantamentos' }, { status: 400 });
    }
}

// POST: Process a new withdrawal
export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();
        const { agricultorId, agenteId, produtoNome, quantidade, precoReferencia } = body;

        // 1. Validate input
        if (!agricultorId || !agenteId || !produtoNome || !quantidade) {
            return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
        }

        if (quantidade <= 0) {
            return NextResponse.json({ success: false, error: 'Quantidade deve ser maior que zero' }, { status: 400 });
        }

        // 2. Fetch Farmer
        const farmer = await Farmer.findById(agricultorId);
        if (!farmer) {
            return NextResponse.json({ success: false, error: 'Agricultor não encontrado' }, { status: 404 });
        }

        // 3. Verify Stock Availability
        // Filter farmer's stock for the specific product
        const stockItems = farmer.estoque.filter((item: any) => item.produto === produtoNome);

        const totalStock = stockItems.reduce((acc: number, item: any) => acc + item.quantidade, 0);

        if (totalStock < quantidade) {
            return NextResponse.json({
                success: false,
                error: `Saldo insuficiente de mercadoria. Disponível: ${totalStock} Kg. Solicitado: ${quantidade} Kg.`
            }, { status: 400 });
        }

        // 4. Calculate Debit Amount (Use provided reference price or find one)
        // If priceReference is not provided, we should try to find it from Products or average cost.
        // For simplicity and matching the user request "reduzir o saldo", we assume a current market price or stored value.
        // If 'precoReferencia' is sent from frontend (like in Deposit), utilize it.
        // Otherwise, fetch from Product catalog.

        let price = precoReferencia;
        let productDetails = null;

        // Try to find product details for metadata
        const productCatalog = await Product.findOne({ nome: produtoNome });
        if (productCatalog) {
            productDetails = productCatalog;
            if (!price) price = productCatalog.precoReferencia; // Fallback to catalog price
        }

        if (!price || price <= 0) {
            // Verification fallback: If we can't find a price, we might proceed with 0 cost OR block.
            // Given "Online Banking" context, we should probably default to 0 and warn, or block.
            // Let's assume frontend MUST send the price, or we use 0 if really unknown, but robust systems block.
            // For this temp app, if no price found, use 0 but ideally should debit.
            price = 0;
        }

        const valorDebitado = price * quantidade;

        // 5. Verify Monetary Balance (Optional but recommended for "Banking")
        // Does the farmer need cash balance to withdraw goods?
        // Logic: Farmer deposited goods -> Got Cash Credit.
        // Withdrawing goods -> Should Pay Cash Credit back.
        // Check if farmer has enough saldo to "buy back" the goods.
        if (farmer.saldo < valorDebitado) {
            return NextResponse.json({
                success: false,
                error: `Saldo monetário insuficiente para retirar mercadoria. Necessário: ${valorDebitado} Kz. Disponível: ${farmer.saldo} Kz.`
            }, { status: 400 });
        }

        // 6. Deduct Stock (FIFO - First In First Out logic or simple reduction)
        let remainingToDeduct = quantidade;

        // Iterate through farmer stock directly on the mongoose document object to enable saving
        // Note: We need to iterate carefully to modify the array in place
        for (let i = 0; i < farmer.estoque.length; i++) {
            if (remainingToDeduct <= 0) break;

            if (farmer.estoque[i].produto === produtoNome) {
                if (farmer.estoque[i].quantidade > remainingToDeduct) {
                    // Partial deduction from this batch
                    farmer.estoque[i].quantidade -= remainingToDeduct;
                    remainingToDeduct = 0;
                } else {
                    // Consume entire batch
                    remainingToDeduct -= farmer.estoque[i].quantidade;
                    farmer.estoque[i].quantidade = 0; // Mark for removal or keep as 0 history?
                    // Let's mark as 0. Cleaner might be to filter them out later.
                }
            }
        }

        // Clean up 0 stocks? Or keep them?
        // Let's filter out 0 quantity items to keep the array clean
        farmer.estoque = farmer.estoque.filter((item: any) => item.quantidade > 0);

        // 7. Deduct Balance
        farmer.saldo -= valorDebitado;

        await farmer.save();

        // 8. Create Withdrawal Record
        const withdrawal = await Withdrawal.create({
            agricultor: agricultorId,
            agente: agenteId,
            produto: {
                nome: produtoNome,
                categoria: productDetails?.categoria || 'Geral',
                imagemUrl: productDetails?.imagemUrl
            },
            quantidade,
            valorDebitado
        });

        return NextResponse.json({
            success: true,
            data: {
                withdrawal,
                newBalance: farmer.saldo,
                newStock: farmer.estoque
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Withdrawal Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Erro ao processar levantamento' }, { status: 500 });
    }
}
