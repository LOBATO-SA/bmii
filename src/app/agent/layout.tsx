import Sidebar from '@/components/Sidebar';

export default function AgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar role="agent" />
            <main className="flex-1 lg:ml-60 p-4 lg:p-8">
                {children}
            </main>
        </div>
    );
}
