
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useProjects } from '@/contexts/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import { Zap, Brain, ShoppingCart, Loader2 } from 'lucide-react';

type EnergyPack = {
  id: string;
  name: string;
  energy: number;
  cost: number;
};

const energyPacks: EnergyPack[] = [
  { id: 'pack1', name: 'Recarga Pequeña', energy: 10, cost: 50 },
  { id: 'pack2', name: 'Recarga Mediana', energy: 25, cost: 110 },
  { id: 'pack3', name: 'Recarga Grande', energy: 50, cost: 200 },
];

export default function StorePage() {
  const { globalCognitiveCredits, exchangeCreditsForEnergy } = useProjects();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePurchase = (pack: EnergyPack) => {
    setIsLoading(pack.id);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
        const success = exchangeCreditsForEnergy(pack.cost, pack.energy);
        if (success) {
            toast({
                title: '¡Compra exitosa!',
                description: `Has canjeado ${pack.cost} créditos por ${pack.energy} de energía.`,
            });
        } else {
            toast({
                title: 'Créditos insuficientes',
                description: 'No tienes suficientes créditos cognitivos para realizar esta compra.',
                variant: 'destructive',
            });
        }
        setIsLoading(null);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-background">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Tienda de Créditos</h1>
          <p className="text-muted-foreground">
            Invierte tus créditos ganados para potenciar tu aprendizaje.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-card/50 px-4 py-2 rounded-lg">
          <Brain className="h-6 w-6 text-blue-400" />
          <span className="text-2xl font-bold">{globalCognitiveCredits}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {energyPacks.map((pack) => (
          <Card key={pack.id} className="bg-card/50 flex flex-col">
            <CardHeader className="text-center">
                <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <CardTitle className="text-2xl font-headline">{pack.name}</CardTitle>
                <CardDescription>+ {pack.energy} Energía ⚡</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <Button
                className="w-full"
                onClick={() => handlePurchase(pack)}
                disabled={globalCognitiveCredits < pack.cost || isLoading !== null}
              >
                {isLoading === pack.id ? <Loader2 className="animate-spin" /> : (
                    <div className="flex items-center gap-2">
                        <ShoppingCart />
                        <span>Canjear por {pack.cost}</span>
                        <Brain className="h-4 w-4" />
                    </div>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
