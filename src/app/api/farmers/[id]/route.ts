import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Farmer from '@/models/Farmer';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const farmer = await Farmer.findById(id);

        if (!farmer) {
            return NextResponse.json(
                { success: false, error: 'Agricultor não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: farmer });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar agricultor' },
            { status: 400 }
        );
    }
}
