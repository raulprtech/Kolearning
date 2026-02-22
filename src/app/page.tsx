"use client";

import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react"; // Added BookOpen import
import Link from "next/link";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    console.log('[LandingPage] Mounted');
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <BookOpen className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold font-headline tracking-tight">
              Learning Box
            </span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
            Blog
          </Link>
          <Link href="/login?redirect=%2Fnew-project" className="text-sm font-medium hover:text-primary transition-colors">
            Iniciar Sesión
          </Link>
          <Link href="/new-project" passHref>
            <Button>Comenzar a aprender</Button>
          </Link>
        </nav>
        <Link href="/new-project" passHref className="md:hidden">
          <Button variant="ghost">Empezar</Button>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center text-center px-4">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-bold font-headline leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Learn Anything, <br /> <span className="text-primary italic">Better & Faster.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Learning Box transforms your notes into an interactive study plan powered by AI and pedagogical cognitive science.
          </p>
          <div className="mt-10">
            <Link href="/new-project" passHref>
              <Button size="lg" className="text-lg px-10 py-6">
                Comenzar a aprender
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <footer className="py-8 px-6 border-t border-border mt-auto">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Learning Box. Made with ❤️ for learners. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
