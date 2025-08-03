import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline">
            Kolearning
          </h1>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="#" className="text-sm font-medium hover:text-primary transition-colors">
            Blog
          </Link>
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
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
          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tight">
            Conquista Cualquier <span className="text-primary">Tema.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Kolearning transforma tus apuntes en un plan de estudio interactivo
            y gamificado. Aprende más rápido y retén el conocimiento por más
            tiempo con nuestro sistema inteligente.
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
      <footer className="p-4 md:px-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Kolearning. Todos los derechos reservados.
      </footer>
    </div>
  );
}
