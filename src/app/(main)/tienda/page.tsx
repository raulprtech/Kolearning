// src/app/(main)/tienda/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Zap, ArrowLeft, ShoppingCart, Gem } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';

const CoinIcon = (props: React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props}>🪙</span>
);

const energyPacks = [
  { name: '5 Pack', amount: 5, price: 75, icon: <Zap className="h-10 w-10 text-primary" /> },
  { name: '10 Pack', amount: 10, price: 125, icon: <Zap className="h-10 w-10 text-primary" /> },
  { name: '25 Pack', amount: 25, price: 250, icon: <Zap className="h-10 w-10 text-primary" /> },
];

export default function ShopPage() {
  const { toast } = useToast();
  const { user, addEnergy, subtractCoins } = useUser();

  const handlePurchase = (pack: typeof energyPacks[number]) => {
    if (!user || user.coins < pack.price) {
        toast({
            variant: 'destructive',
            title: 'Créditos insuficientes',
            description: `No tienes suficientes créditos para comprar el ${pack.name}.`,
        });
        return;
    }

    subtractCoins(pack.price);
    addEnergy(pack.amount);

    toast({
      title: '¡Compra Exitosa!',
      description: `Has comprado un ${pack.name} de energía por ${pack.price} créditos.`,
    });
  };

  return (
    <div className="container mx-auto py-8">
        <div className="relative mb-8 text-center">
            <Link href="/" className="absolute left-0 top-1/2 -translate-y-1/2">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <h1 className="text-3xl font-bold">Tienda</h1>
        </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <CardTitle>Comprar Energía</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {energyPacks.map((pack) => (
              <Card key={pack.name} className={cn("text-center hover:shadow-lg transition-shadow", user && user.coins < pack.price && "bg-muted/50 opacity-60")}>
                <CardContent className="p-6 flex flex-col items-center gap-4">
                  <div className="p-4 bg-muted rounded-full">
                    {pack.icon}
                  </div>
                  <p className="text-lg font-semibold">{pack.name}</p>
                   <div className="flex items-center gap-2 text-lg font-bold text-yellow-500">
                        <CoinIcon />
                        <span>{pack.price}</span>
                   </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handlePurchase(pack)}
                    disabled={!user || user.coins < pack.price}
                  >
                    Comprar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
