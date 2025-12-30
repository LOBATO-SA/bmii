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
        const farmers = await Farmer.find(query).sort({ dataRegisto: -1 });

        return NextResponse.json({ success: true, data: farmers });
    } catch (error: any) {
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
