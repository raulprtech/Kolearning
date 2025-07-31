
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function BlogPage() {
  const blogPosts = [
    {
      title: "El Poder de la Repetición Espaciada para un Aprendizaje Duradero",
      excerpt: "Descubre cómo nuestro algoritmo de repetición espaciada se adapta a ti para reforzar el conocimiento justo antes de que lo olvides, asegurando un dominio real del tema.",
      imageUrl: "https://placehold.co/600x400.png",
      aiHint: "brain neurons",
      slug: "/blog/repeticion-espaciada"
    },
    {
      title: "Koli, tu Tutor IA: Cómo la Inteligencia Artificial está Revolucionando el Estudio",
      excerpt: "Koli no solo responde preguntas; te guía para que descubras las respuestas por ti mismo. Aprende a sacar el máximo provecho de tu compañero de estudio personal.",
       imageUrl: "https://placehold.co/600x400.png",
       aiHint: "robot student",
       slug: "/blog/tutor-ia"
    },
    {
      title: "Gamificación y Aprendizaje: Gana Créditos Cognitivos y Sube de Nivel",
      excerpt: "En Kolearning, cada sesión de estudio es una misión. Acumula créditos, sube de rango y convierte el aprendizaje en una aventura emocionante.",
       imageUrl: "https://placehold.co/600x400.png",
       aiHint: "game controller",
       slug: "/blog/gamificacion"
    },
     {
      title: "Crea Mazos de Estudio en Segundos con la Importación Mágica",
      excerpt: "Transforma tus apuntes, PDFs o incluso videos de YouTube en tarjetas interactivas al instante. Maximiza tu tiempo de estudio y minimiza el de preparación.",
      imageUrl: "https://placehold.co/600x400.png",
      aiHint: "magic wand document",
      slug: "/blog/importacion-magica"
    },
    {
      title: "La Ciencia Detrás de los Planes de Estudio de Koli",
      excerpt: "No todos aprendemos igual. Descubre cómo Koli analiza tu material y tus metas para crear una ruta de aprendizaje personalizada y eficiente, basada en principios pedagógicos probados.",
       imageUrl: "https://placehold.co/600x400.png",
       aiHint: "science test tubes",
       slug: "/blog/ciencia-del-aprendizaje"
    },
    {
      title: "Más Allá de la Memorización: El Rol de la Tutoría Socrática en la IA",
      excerpt: "Entender es mejor que memorizar. Te explicamos cómo las conversaciones con Koli están diseñadas para fomentar el pensamiento crítico y un dominio más profundo de los conceptos.",
       imageUrl: "https://placehold.co/600x400.png",
       aiHint: "philosopher statue",
       slug: "/blog/metodo-socratico"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold">Desde Nuestro Blog</h1>
            <p className="text-lg text-muted-foreground mt-2">Consejos y secretos sobre el arte de aprender.</p>
        </header>
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
                <Button variant="link" className="p-0" asChild>
                    <Link href={post.slug}>
                        Leer más <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
            </Card>
        ))}
        </div>
    </div>
  );
}
