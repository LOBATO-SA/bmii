import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Agent from '@/models/Agent';

export async function GET() {
    await dbConnect();

    try {
        const agents = await Agent.find({}).sort({ dataCriacao: -1 });
        // Transform _id to id for frontend compatibility
        const formattedAgents = agents.map(agent => ({
            id: agent._id.toString(),
            nome: agent.nome,
            email: agent.email,
            status: agent.status,
            role: agent.role || 'Agente',
            dataCriacao: agent.dataCriacao.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        }));

        return NextResponse.json({ success: true, data: formattedAgents });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    await dbConnect();

    try {
        const body = await request.json();

        // Basic server-side validation
        if (!body.nome || !body.email || !body.password) {
            return NextResponse.json(
                { success: false, error: 'Por favor preencha todos os campos obrigatórios' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const userExists = await Agent.findOne({ email: body.email });
        if (userExists) {
            return NextResponse.json(
                { success: false, error: 'Este email já está registado' },
                { status: 400 }
            );
        }

        const agent = await Agent.create(body);

        return NextResponse.json({
            success: true,
            data: {
                id: agent._id.toString(),
                nome: agent.nome,
                email: agent.email,
                status: agent.status,
                role: agent.role,
                dataCriacao: agent.dataCriacao.toISOString().split('T')[0]
            }
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
