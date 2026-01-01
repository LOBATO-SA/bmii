import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Farmer from '@/models/Farmer';
import Agent from '@/models/Agent';
import cloudinary from '@/lib/cloudinary';

// GET: List farmers (optionally filter by agent)
export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    try {
        const query = agentId ? { agenteResponsavel: agentId } : {};
        // Convert to plain object to allow modification
        const farmersDocs = await Farmer.find(query).sort({ dataRegisto: -1 }).lean();

        // Populate stock prices from Deposits if missing (Backwards Compatibility)
        // Note: For large datasets this should be optimized or done on-demand
        const farmersWithPrices = await Promise.all(farmersDocs.map(async (farmer: any) => {
            if (farmer.estoque && farmer.estoque.length > 0) {
                const updatedEstoque = await Promise.all(farmer.estoque.map(async (item: any) => {
                    // If price exists (new data), use it. Else fetch from history.
                    if (item.precoAquisicao) return item;

                    // Fetch latest deposit for this product/farmer
                    // dynamically import Deposit to avoid circular deps if any (though safe here)
                    const Deposit = (await import('@/models/Deposit')).default;
                    const lastDeposit = await Deposit.findOne({
                        agricultor: farmer._id,
                        'produto.nome': item.produto
                    }).sort({ dataDeposito: -1 });

                    return {
                        ...item,
                        precoAquisicao: lastDeposit ? lastDeposit.precoFinalAplicado : 0
                    };
                }));
                return { ...farmer, estoque: updatedEstoque };
            }
            return farmer;
        }));

        return NextResponse.json({ success: true, data: farmersWithPrices });
    } catch (error: any) {
        console.error('Error in GET /api/farmers:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar agricultores' },
            { status: 400 }
        );
    }
}

// POST: Register new farmer
export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();

        // Validate duplicates (BI)
        const existingFarmer = await Farmer.findOne({ bi: body.bi });
        if (existingFarmer) {
            return NextResponse.json(
                { success: false, error: 'Já existe um agricultor com este BI' },
                { status: 400 }
            );
        }

        // Handle Image Upload (Photo)
        let fotoUrl = '';
        if (body.fotoUrl && body.fotoUrl.startsWith('data:image')) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(body.fotoUrl, {
                    folder: 'bmii_farmers',
                });
                fotoUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                return NextResponse.json({ success: false, error: 'Erro ao carregar foto' }, { status: 500 });
            }
        }

        const farmerData = {
            ...body,
            fotoUrl: fotoUrl || body.fotoUrl
        };

        const farmer = await Farmer.create(farmerData);

        return NextResponse.json({ success: true, data: farmer }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
