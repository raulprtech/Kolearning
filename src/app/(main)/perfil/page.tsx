'use client';

import { useUser } from '@/context/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Mail, Flame, BrainCircuit, Zap } from 'lucide-react';
import Link from 'next/link';

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-card/70">
        <div className="p-3 rounded-full bg-primary/20 text-primary">
            {icon}
        </div>
        <div>
            <p className="text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
);


export default function ProfilePage() {
    const { user } = useUser();

    if (!user) {
        return (
            <div className="container mx-auto py-8 text-center">
                <p>Cargando perfil...</p>
            </div>
        );
    }
    
    const getInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    }

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">Mi Perfil</h1>
                <p className="text-muted-foreground">Gestiona tu información y visualiza tu progreso.</p>
            </header>

            <Card className="mb-8">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-16 w-16 text-xl">
                        <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{user.email}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center text-muted-foreground gap-2">
                        <Mail className="h-5 w-5" />
                        <span>{user.email}</span>
                    </div>
                    <Button asChild>
                        <Link href="/perfil/editar">
                            Editar Perfil
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mis Estadísticas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatCard icon={<Flame className="h-6 w-6" />} label="Racha Actual" value={`${user.currentStreak} días`} />
                    <StatCard icon={<BrainCircuit className="h-6 w-6" />} label="Créditos Cognitivos" value={user.coins} />
                    <StatCard icon={<Zap className="h-6 w-6" />} label="Energía" value={user.energy} />
                </CardContent>
            </Card>
        </div>
    );
}
