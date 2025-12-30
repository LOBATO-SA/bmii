import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Agent from '@/models/Agent';

export async function GET() {
    await dbConnect();

    try {
        // 1. Fetch Basic Counts
        const totalAgents = await Agent.countDocuments();
        const activeProducts = await Product.countDocuments({ status: 'Ativo' });

        // 2. Mock Data for Not-Yet-Implemented Features
        const totalFarmers = 0; // To be implemented with Farmer Schema
        const totalSales = 0;   // To be implemented with Sales Schema

        // 3. Stock Alerts Logic
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
