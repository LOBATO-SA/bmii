import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Agent from '@/models/Agent';
import Sale from '@/models/Sale';
import Farmer from '@/models/Farmer'; // Ensure Farmer model is imported

export async function GET() {
    await dbConnect();

    try {
        // 1. Fetch Basic Counts
        const totalAgents = await Agent.countDocuments();
        const activeProducts = await Product.countDocuments({ status: 'Ativo' });
        const totalFarmers = await Farmer.countDocuments();

        // 2. Total Sales Value
        const salesStats = await Sale.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$valorTotal" }
                }
            }
        ]);
        const totalSales = salesStats.length > 0 ? salesStats[0].totalValue : 0;

        // 3. Sales Analysis (Top Products)
        const salesAnalysisRaw = await Sale.aggregate([
            {
                $group: {
                    _id: "$produto.nome",
                    vendas: { $sum: "$quantidade" }, // Total Quantity
                    valor: { $sum: "$valorTotal" }   // Total Revenue
                }
            },
            { $sort: { valor: -1 } }, // Sort by revenue desc
            { $limit: 5 }
        ]);

        const salesAnalysis = salesAnalysisRaw.map(item => ({
            produto: item._id,
            vendas: item.vendas,
            valor: item.valor,
            tendencia: 'N/A' // Placeholder, requires historical data for real trend
        }));

        // 4. Stock Alerts Logic
        // Threshold: less than 100 units (e.g., kg) is considered 'low', 0 is 'critical'
        const products = await Product.find({ status: 'Ativo' }).select('nome quantidade unidade');

        const lowStockProducts = products
            .filter(p => p.quantidade < 100)
            .map(p => ({
                id: p._id.toString(),
                produto: p.nome,
                quantidade: p.quantidade,
                unidade: p.unidade,
                nivel: p.quantidade === 0 ? 'crítico' : 'baixo'
            }))
            .sort((a, b) => a.quantidade - b.quantidade) // Sort by lowest quantity first
            .slice(0, 5); // Top 5 alerts

        return NextResponse.json({
            success: true,
            data: {
                metrics: {
                    totalAgents,
                    activeProducts,
                    totalFarmers,
                    totalSales
                },
                salesAnalysis,
                alerts: lowStockProducts
            }
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
