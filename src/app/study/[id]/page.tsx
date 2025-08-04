import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KoliAvatar } from "@/components/icons/koli-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Lightbulb, Repeat, BrainCircuit, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function StudySessionPage({
  params,
}: {
  params: { id: string };
}) {
  const question = {
    text: "Explica el principio de superposición en mecánica cuántica.",
    answer:
      "El principio de superposición establece que dos (o más) estados cuánticos pueden ser sumados ('superpuestos') y el resultado será otro estado cuántico válido. A la inversa, cada estado cuántico puede ser representado como una suma de dos o más estados distintos.",
  };

  const ratings = [
      { label: "Muy Difícil", variant: "destructive", description: "Repetir Pronto", fsrs: 1 },
      { label: "Difícil", variant: "outline", description: "Revisar en un día", fsrs: 2 },
      { label: "Bien", variant: "secondary", description: "Revisar en unos días", fsrs: 3 },
      { label: "Fácil", variant: "default", description: "Revisar en una semana", fsrs: 4 },
  ] as const;

  return (
    <div className="flex flex-col flex-1">
       <header className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Física Cuántica</h2>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="text-yellow-400" />
            <span className="font-bold text-lg text-foreground">⚡ 9/10</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-3xl">
                <Card className="bg-card/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-4 right-4">
                    <Badge variant="secondary">Pregunta Abierta</Badge>
                </div>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl text-center">
                    {question.text}
                    </CardTitle>
                    <CardDescription className="text-center">
                    Formula tu respuesta a continuación. El recuerdo activo es clave para el dominio.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                    rows={8}
                    placeholder="Tu respuesta..."
                    className="bg-background text-lg"
                    />

                    <div className="mt-6 flex justify-center">
                    <Button size="lg" className="w-full max-w-xs">
                        Revelar Respuesta
                    </Button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center">
                    <h3 className="font-headline text-muted-foreground mb-4">
                        Soporte Táctico
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" size="icon" aria-label="Pista">
                        <Lightbulb />
                        </Button>
                        <Button variant="outline" size="icon" aria-label="Explicar Respuesta">
                        <BrainCircuit />
                        </Button>
                        <Button variant="outline" size="icon" aria-label="Reformular">
                        <Repeat />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Consultar a Koli">
                        <KoliAvatar className="h-6 w-6" />
                        </Button>
                    </div>
                    </div>
                    
                    {/* This part would be shown after clicking "Reveal Answer" */}
                    <div className="mt-8 pt-6 border-t">
                    <div className="bg-muted/50 p-4 rounded-lg mb-6">
                        <h4 className="font-bold font-headline mb-2 text-primary">
                        Respuesta Correcta
                        </h4>
                        <p>{question.answer}</p>
                    </div>

                    <h3 className="font-headline text-muted-foreground mb-4 text-center">
                        Califica tu rendimiento de recuerdo:
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {ratings.map(rating => (
                           <Link key={rating.label} href={`/study/${params.id}/summary?fsrs=${rating.fsrs}`} passHref>
                                <Button variant={rating.variant} className="h-auto py-3 flex-col w-full">
                                    <span className="text-lg font-bold">{rating.label}</span>
                                    <span className="text-xs opacity-80">{rating.description}</span>
                                </Button>
                            </Link>
                        ))}
                    </div>
                    </div>
                </CardContent>
                </Card>
            </div>
        </main>
    </div>
  );
}
