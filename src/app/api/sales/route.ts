import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Sale from '@/models/Sale';
import Farmer from '@/models/Farmer';
import Product from '@/models/Product';

// POST: Process a new sale (Farmer sells to BMII)
export async function POST(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { agricultorId, agenteId, produtoNome, quantidade, precoUnitario } = body;

    // 1. Validate input
    if (!agricultorId || !agenteId || !produtoNome || !quantidade || !precoUnitario) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    if (quantidade <= 0 || precoUnitario < 0) {
      return NextResponse.json(
        { success: false, error: 'Valores inválidos' },
        { status: 400 }
      );
    }

    // 2. Fetch Farmer
    const farmer = await Farmer.findById(agricultorId);
    if (!farmer) {
      return NextResponse.json(
        { success: false, error: 'Agricultor não encontrado' },
        { status: 404 }
      );
    }

    // 3. Verify Farmer Stock Availability
    const stockIndex = farmer.estoque.findIndex((item: any) => item.produto === produtoNome);
    const stockItem = stockIndex >= 0 ? farmer.estoque[stockIndex] : null;

    if (!stockItem || stockItem.quantidade < quantidade) {
      return NextResponse.json(
        {
          success: false,
          error: `Agricultor não possui estoque suficiente de ${produtoNome}. Disponível: ${stockItem ? stockItem.quantidade : 0} Kg.`
        },
        { status: 400 }
      );
    }

    // 4. Calculate Total Value
    const valorTotal = quantidade * precoUnitario;

    // 5. Update Farmer Stock (Decrease)
    farmer.estoque[stockIndex].quantidade -= quantidade;

    if (farmer.estoque[stockIndex].quantidade <= 0) {
      farmer.estoque.splice(stockIndex, 1);
    }

    // 6. Update Farmer Balance (Increase/Credit)
    farmer.saldo = (farmer.saldo || 0) + valorTotal;
    await farmer.save();

    // 7. Update Global Product Stock (Increase BMII Stock)
    let product = await Product.findOne({ nome: produtoNome });
    if (product) {
      product.quantidade = (product.quantidade || 0) + quantidade;
      await product.save();
    } else {
      console.warn(`Product ${produtoNome} sold but not found in global Catalog to update stock.`);
    }

    // 8. Create Sale Record
    const sale = await Sale.create({
      agricultor: agricultorId,
      agente: agenteId,
      produto: {
        nome: produtoNome,
        categoria: product?.categoria || 'Geral',
        imagemUrl: product?.imagemUrl
      },
      quantidade,
      precoUnitario,
      valorTotal
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          sale,
          newBalance: farmer.saldo,
          newStock: farmer.estoque
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Sale Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar venda' },
      { status: 500 }
    );
  }
}

// GET: List sales (optionally filtered by agricultorId)
export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const agricultorId = searchParams.get('agricultorId');

  try {
    const query = agricultorId ? { agricultor: agricultorId } : {};
    const sales = await Sale.find(query).sort({ dataVenda: -1 });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar vendas' },
      { status: 500 }
    );
  }
}