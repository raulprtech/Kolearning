'use client';
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Repeat, Wand2 } from "lucide-react";
import Link from "next/link";

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center md:text-left">
        <div className="flex justify-center md:justify-start mb-4">
             <div className="w-12 h-12 p-2.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {icon}
            </div>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </div>
);

export function LandingPage() {
    return (
        <div className="w-full">
            <main className="container mx-auto px-4 py-16 md:py-32">
                {/* Hero Section */}
                <section className="text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        Transforma Contenido en Conocimiento.
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
                        Kolearning utiliza IA para crear experiencias de estudio personalizadas a partir de cualquier tema. Sube, genera y domina.
                    </p>
                    <Button size="lg" asChild>
                        <Link href="/login">
                            Crear mi primer mazo <ArrowRight className="ml-2" />
                        </Link>
                    </Button>
                </section>

                {/* Features Section */}
                <section className="mt-24 md:mt-40">
                    <div className="text-center mb-12">
                         <h2 className="text-3xl md:text-4xl font-bold mb-3">
                            Aprende más inteligentemente, no más duro.
                        </h2>
                        <p className="max-w-xl mx-auto text-muted-foreground">
                            Las herramientas que necesitas para un estudio efectivo.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<Wand2 className="h-6 w-6" />}
                            title="Generación IA"
                            description="Crea planes de estudio y tarjetas sobre cualquier tema, texto o documento al instante."
                        />
                        <FeatureCard 
                            icon={<Repeat className="h-6 w-6" />}
                            title="Repetición Espaciada"
                            description="Nuestro motor de SRS optimiza tu aprendizaje para una retención a largo plazo."
                        />
                        <FeatureCard 
                            icon={<BookOpen className="h-6 w-6" />}
                            title="Formatos Flexibles"
                            description="Estudia con preguntas abiertas o de selección múltiple generadas dinámicamente."
                        />
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t">
                <div className="container mx-auto px-4 py-6 flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <span className="bg-foreground text-background rounded-md p-1 leading-none">N</span>
                    </div>
                    <span>© {new Date().getFullYear()} Kolearning. Todos los derechos reservados.</span>
                </div>
            </footer>
        </div>
    );
}