import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Agent from '@/models/Agent';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const { email, password } = await request.json();

        // 1. Check Hardcoded Super Admin Fallback
        if (email === 'admin@bmii.com' && password === 'Admin123#') {
            return NextResponse.json({
                success: true,
                data: {
                    id: 'super-admin-001',
                    nome: 'Super Admin',
                    email: 'admin@bmii.com',
                    role: 'Admin',
                    status: 'Ativo'
                }
            });
        }

        // 2. Database Check
        const agent = await Agent.findOne({ email });

        if (!agent) {
            return NextResponse.json(
                { success: false, error: 'Credenciais inválidas' },
                { status: 401 }
            );
        }

        if (agent.status !== 'Ativo') {
            return NextResponse.json(
                { success: false, error: 'Conta inativa. Contacte o administrador.' },
                { status: 403 }
            );
        }

        // Simple string comparison for now as requested (hashing planned for later)
        // In real prod, use bcrypt.compare(password, agent.password)
        if (agent.password !== password) {
            return NextResponse.json(
                { success: false, error: 'Credenciais inválidas' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: agent._id.toString(),
                nome: agent.nome,
                email: agent.email,
                role: agent.role || 'Agente',
                status: agent.status
            }
        });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: 'Erro no servidor' },
            { status: 500 }
        );
    }
}
