
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Zap, TrendingUp, Sparkles, Eye, Repeat } from 'lucide-react';
import Link from 'next/link';

export default function AprenderPage() {
  const [answer, setAnswer] = useState('');
  const sessionProgress = 35;
  const masteryProgress = 10;
  const energy = 5;

  return (
    <div className="container mx-auto py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="mb-4">
          <Link href="/" className="text-sm text-primary hover:underline flex items-center mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Salir de la sesión
          </Link>
          <h1 className="text-3xl font-bold">JavaScript Fundamentals</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-6">
              <div className="w-full">
                <p className="text-sm text-muted-foreground mb-1">Progreso de la sesión</p>
                <Progress value={sessionProgress} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="font-bold">{masteryProgress}%</p>
                    <p className="text-xs text-muted-foreground">Dominio</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                   <div>
                    <p className="font-bold">{energy}</p>
                    <p className="text-xs text-muted-foreground">Energía</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-card/70">
          <CardHeader>
            <CardTitle className="text-xl">Pregunta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              ¿Cuál es la diferencia entre `let`, `const` y `var` en JavaScript?
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Textarea
              placeholder="Escribe tu respuesta aquí..."
              className="min-h-[150px] text-base mb-4"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                 <Button variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Pista
                </Button>
                <Button variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Respuesta
                </Button>
                <Button variant="ghost">
                    <Repeat className="mr-2 h-4 w-4" />
                    Reformular
                </Button>
              </div>
              <Button size="lg" disabled={!answer}>
                Enviar Respuesta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
