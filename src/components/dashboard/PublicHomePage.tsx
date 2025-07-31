
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BrainCircuit, Zap, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function PublicHomePage() {
  const blogPosts = [
    {
      title: "El Poder de la Repetición Espaciada para un Aprendizaje Duradero",
      excerpt: "Descubre cómo nuestro algoritmo de repetición espaciada se adapta a ti para reforzar el conocimiento justo antes de que lo olvides, asegurando un dominio real del tema.",
      imageUrl: "https://placehold.co/600x400.png",
      aiHint: "brain neurons",
    },
    {
      title: "Koli, tu Tutor IA: Cómo la Inteligencia Artificial está Revolucionando el Estudio",
      excerpt: "Koli no solo responde preguntas; te guía para que descubras las respuestas por ti mismo. Aprende a sacar el máximo provecho de tu compañero de estudio personal.",
       imageUrl: "https://placehold.co/600x400.png",
       aiHint: "robot student",
    },
    {
      title: "Gamificación y Aprendizaje: Gana Créditos Cognitivos y Sube de Nivel",
      excerpt: "En Kolearning, cada sesión de estudio es una misión. Acumula créditos, sube de rango y convierte el aprendizaje en una aventura emocionante.",
       imageUrl: "https://placehold.co/600x400.png",
       aiHint: "game controller",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="text-center py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-red-400">
            Conquista Cualquier Tema.
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-foreground/80 mb-8">
            Kolearning transforma tus apuntes en un plan de estudio interactivo y gamificado. Aprende más rápido y retén el conocimiento por más tiempo con nuestro sistema inteligente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/login">
                Empieza a Aprender Gratis <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/crear">
                Prueba una Sesión
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Tu Ecosistema de Aprendizaje Personal</h2>
            <p className="text-lg text-muted-foreground mt-2">Herramientas diseñadas para un dominio real del conocimiento.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Planes de Estudio con IA</h3>
              <p className="text-muted-foreground">
                Koli, nuestra IA, analiza tu material y crea una ruta de aprendizaje óptima y personalizada para ti.
              </p>
            </div>
            <div className="text-center">
               <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Repetición Espaciada</h3>
              <p className="text-muted-foreground">
                Nuestro sistema predice cuándo olvidarás algo y te lo pregunta justo a tiempo para reforzarlo.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Gamificación</h3>
              <p className="text-muted-foreground">
                Gana energía y créditos cognitivos. Sube de nivel y haz del estudio una experiencia motivadora.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Blog Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Desde Nuestro Blog</h2>
            <p className="text-lg text-muted-foreground mt-2">Consejos y secretos sobre el arte de aprender.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card key={index} className="flex flex-col overflow-hidden bg-card/70 hover:bg-card/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                <CardHeader className="p-0">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    width={600}
                    height={400}
                    className="object-cover"
                    data-ai-hint={post.aiHint}
                  />
                </CardHeader>
                <CardContent className="p-6 flex-grow">
                  <CardTitle className="mb-2 text-xl">{post.title}</CardTitle>
                  <CardDescription>{post.excerpt}</CardDescription>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button variant="link" className="p-0">
                    Leer más <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-primary/20">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} Kolearning. Todos los derechos reservados.</p>
          </div>
      </footer>
    </div>
  );
}
