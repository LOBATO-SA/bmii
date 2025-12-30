'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    PlusCircle,
    Users,
    ArrowUpRight,
    ShoppingBag,
    UserCog,
    Package,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import NextImage from 'next/image';

interface SidebarProps {
    role: 'agent' | 'admin';
}

const Sidebar = ({ role }: SidebarProps) => {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const agentLinks = [
        { name: 'Depósito', href: '/agent/deposito', icon: PlusCircle },
        { name: 'Contas', href: '/agent/conta', icon: Users },
        { name: 'Levantamento', href: '/agent/levantamento', icon: ArrowUpRight },
        { name: 'Venda', href: '/agent/venda', icon: ShoppingBag },
    ];

    const adminLinks = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Agentes', href: '/admin/agentes', icon: UserCog },
        { name: 'Produtos', href: '/admin/produtos', icon: Package },
    ];

    const links = role === 'admin' ? adminLinks : agentLinks;

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
        w-60 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="p-6 flex items-center gap-3">
                    <div className="relative w-12 h-12">
                        <NextImage
                            src="/bmii.png"
                            alt="BMII Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                <nav className="flex-1 px-4 mt-6 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 px-2">
                        Menu {role === 'admin' ? 'Administrador' : 'Agente'}
                    </div>
                    <div className="space-y-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <Link
                        href="/"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold"
                    >
                        <LogOut size={20} />
                        Sair do Sistema
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
