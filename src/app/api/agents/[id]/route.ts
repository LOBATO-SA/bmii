import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Agent from '@/models/Agent';

// Helper to validate ObjectId format if needed, but Mongoose usually handles it.
// For now, we rely on checking if the agent exists.

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Correct type for dynamic route params
) {
    await dbConnect();
    const { id } = await params;

    try {
        const body = await request.json();

        // Check if agent exists
        const agent = await Agent.findById(id);

        if (!agent) {
            return NextResponse.json(
                { success: false, error: 'Agente não encontrado' },
                { status: 404 }
            );
        }

        // Update fields
        if (body.nome) agent.nome = body.nome;
        if (body.email) agent.email = body.email;
        if (body.status) agent.status = body.status;
        if (body.role) agent.role = body.role;

        // Only update password if provided and not empty
        if (body.password && body.password.trim() !== '') {
            agent.password = body.password;
        }

        await agent.save();

        return NextResponse.json({
            success: true,
            data: {
                id: agent._id.toString(),
                nome: agent.nome,
                email: agent.email,
                status: agent.status,
                role: agent.role,
                dataCriacao: agent.dataCriacao.toISOString().split('T')[0],
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await dbConnect();
    const { id } = await params;

    try {
        const deletedAgent = await Agent.findByIdAndDelete(id);

        if (!deletedAgent) {
            return NextResponse.json(
                { success: false, error: 'Agente não encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 400 }
        );
    }
}
