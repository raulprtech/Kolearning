'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Button } from '../ui/button';

export function CreateProjectCard() {
  return (
    <Link href="/crear" passHref>
      <Card className="h-full flex items-center justify-center border-2 border-dashed bg-card/50 hover:border-primary hover:bg-card transition-all duration-300">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <PlusCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-bold text-lg text-foreground">Crear Proyecto</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Importa tu material o empieza desde cero.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
