
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Zap, Star, BrainCircuit, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex flex-col items-center text-center p-6 bg-card/50 rounded-lg">
        <div className="p-3 mb-4 text-primary bg-primary/10 rounded-full">
            {icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
    </div>
);

export function PublicHomePage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="text-center py-20 px-4">
         <div className="flex justify-center items-center gap-4 mb-6">
          <BookOpenCheck className="h-12 w-12 text-primary" />
          <h1 className="text-5xl md:text-6xl font-bold">Kolearning</h1>
        </div>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
          La plataforma gamificada que transforma tu manera de estudiar. Domina cualquier tema con IA, planes personalizados y un sistema que te mantiene motivado.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/login">Comenzar a aprender</Link>
          </Button>
          <Button size="lg" variant="outline">
            Ver un demo
          </Button>
        </div>
      </section>

      {/* Main Feature Image */}
      <section className="px-4 mb-20">
        <div className="max-w-5xl mx-auto rounded-xl shadow-2xl shadow-primary/10 overflow-hidden">
             <Image
                src="https://placehold.co/1200x600.png"
                alt="Dashboard de Kolearning"
                width={1200}
                height={600}
                className="w-full"
                data-ai-hint="dashboard learning"
            />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-4xl font-bold">Un sistema diseñado para conquistar exámenes</h2>
            <p className="text-lg text-muted-foreground mt-4">
                No solo te ayudamos a estudiar, te damos las herramientas para que domines la materia.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
           <FeatureCard
                icon={<BrainCircuit className="h-8 w-8" />}
                title="Planes de Estudio con IA"
                description="Koli, nuestro tutor de IA, crea una ruta de aprendizaje optimizada para ti basada en tus metas y tu material de estudio."
            />
             <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title="Gamificación que Motiva"
                description="Gana energía, créditos y sube de rango. Convierte el estudio en un desafío que querrás superar cada día."
            />
             <FeatureCard
                icon={<Star className="h-8 w-8" />}
                title="Mantén tu Racha"
                description="La constancia es clave. Nuestra plataforma te incentiva a mantener tu racha de estudio para construir hábitos sólidos."
            />
             <FeatureCard
                icon={<CheckCircle className="h-8 w-8" />}
                title="Spaced Repetition"
                description="Optimiza tu memoria a largo plazo con nuestro sistema de repetición espaciada que refuerza los conceptos cuando más lo necesitas."
            />
        </div>
      </section>

        {/* Call to Action */}
        <section className="py-20 px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">¿Listo para transformar tu estudio?</h2>
            <p className="text-lg text-muted-foreground mb-8">Crea tu cuenta gratis y empieza a aprender de forma más inteligente hoy mismo.</p>
            <Button size="lg" asChild>
                <Link href="/login">Únete a Kolearning Ahora</Link>
            </Button>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Kolearning. Todos los derechos reservados.</p>
                <div className="flex gap-4 mt-4 sm:mt-0">
                    <Link href="/terminos" className="hover:text-foreground">Términos de Servicio</Link>
                    <Link href="/privacidad" className="hover:text-foreground">Política de Privacidad</Link>
                </div>
            </div>
        </footer>
    </div>
  );
}
