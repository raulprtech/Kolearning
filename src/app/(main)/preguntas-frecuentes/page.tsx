
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQPage() {
    const faqs = [
        {
            question: "¿Qué es Kolearning?",
            answer: "Kolearning es una plataforma de aprendizaje gamificada diseñada para ayudarte a dominar cualquier tema. Utilizamos inteligencia artificial para crear planes de estudio personalizados y sesiones de aprendizaje interactivas que se adaptan a ti."
        },
        {
            question: "¿Cómo funciona la energía?",
            answer: "La energía es necesaria para realizar acciones de aprendizaje, como responder preguntas o pedir ayuda a Koli, nuestro tutor de IA. Comienzas con un número determinado de puntos de energía que se recargan con el tiempo. ¡Gestiona tu energía sabiamente para maximizar tu aprendizaje!"
        },
        {
            question: "¿Qué son los Créditos Cognitivos (CC)?",
            answer: "Los Créditos Cognitivos son la moneda de la plataforma. Los ganas al completar sesiones de estudio y mantener tu racha. Puedes usar los créditos para comprar más energía en la tienda y así poder estudiar por más tiempo."
        },
        {
            question: "¿Para qué sirven los Puntos de Dominio?",
            answer: "Los Puntos de Dominio miden tu progreso general en la plataforma. Cada vez que aprendes y respondes correctamente, ganas puntos que te ayudan a subir de nivel y demuestran tu maestría en los temas que estudias."
        },
        {
            question: "¿Puedo crear mis propios proyectos de estudio?",
            answer: "¡Por supuesto! Puedes crear tus propios proyectos de estudio desde cero, o usar nuestra 'Importación Mágica' para generar tarjetas de estudio automáticamente a partir de tus apuntes, PDFs, videos de YouTube y más."
        },
        {
            question: "¿Cómo funciona el tutor Koli?",
            answer: "Koli es tu tutor personal de IA. Puedes chatear con él en cualquier momento para aclarar dudas, pedir pistas, obtener explicaciones más sencillas o profundizar en un tema. Koli está diseñado para guiarte, no para darte las respuestas directamente, fomentando un aprendizaje más profundo."
        }
    ];

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold">Preguntas Frecuentes</h1>
                <p className="text-muted-foreground">Encuentra respuestas a las dudas más comunes.</p>
            </header>

            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground prose prose-invert max-w-none">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
