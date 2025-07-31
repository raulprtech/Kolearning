
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Globe,
  Star,
  Award,
  TrendingUp,
  Trash2,
  Book,
  FileText,
  Link as LinkIcon,
  Pencil,
  Info,
  Trophy,
} from 'lucide-react';
import type { Project } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '../ui/skeleton';


export function ProjectDetailsView({ project: initialProject, isGuest = false }: { project: Project | null, isGuest: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, addDominionPoints, addCoins } = useUser();

  const [project, setProject] = useState<Project | null>(initialProject);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const [dominionPoints, setDominionPoints] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [planUpdateInfo, setPlanUpdateInfo] = useState<{updated: boolean, reason: string | null}>({updated: false, reason: null});


  useEffect(() => {
    if (isGuest && !initialProject) {
        const guestProjectJson = localStorage.getItem('guestProject');
        if (guestProjectJson) {
            const guestProject = JSON.parse(guestProjectJson);
            setProject(guestProject);
        } else {
            // No guest project found, maybe redirect to create page
            router.push('/crear');
        }
    }

    const sessionCompleted = searchParams.get('sessionCompleted');
    if (isGuest && sessionCompleted === 'true') {
        setShowSignupModal(true);
    }
    
    const masteryParam = searchParams.get('mastery');
    const creditsParam = searchParams.get('credits');
    const streakParam = searchParams.get('streak');
    const planUpdatedParam = searchParams.get('planUpdated');
    const reasoningParam = searchParams.get('reasoning');
    
    if (masteryParam) {
      const masteryPoints = parseInt(masteryParam, 10);
      setDominionPoints(masteryPoints);
      if (user) addDominionPoints(masteryPoints);
    }
    if (creditsParam) {
      const creditPoints = parseInt(creditsParam, 10);
      setEarnedCoins(creditPoints);
      if (user) addCoins(creditPoints);
    }
    if (streakParam) {
      const streakPoints = parseInt(streakParam, 10);
      setBestStreak(streakPoints);
    }
    if (planUpdatedParam === 'true') {
        setPlanUpdateInfo({ updated: true, reason: reasoningParam ? decodeURIComponent(reasoningParam) : 'Koli ha optimizado tu siguiente sesión.' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isGuest, initialProject, user, router]);

  if (!project) {
     return <Skeleton className="h-96 w-full" />;
  }

  const knowledgeAtoms = project.flashcards || [];
  const knowledgeAtomsPreview = knowledgeAtoms.slice(0, 5);
  const studyPlan = project.studyPlan?.plan || [];
  const completedSessions = project.completedSessions || 0;

  return (
    <div className="bg-card/50 p-6 sm:p-8 rounded-xl shadow-lg border">
       <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex justify-center">
                        <Trophy className="h-16 w-16 text-yellow-400 mb-4" />
                    </div>
                    <DialogTitle className="text-center text-2xl">¡Felicidades, has completado tu primera sesión!</DialogTitle>
                    <DialogDescription className="text-center">
                        Para guardar tu progreso, tu plan de estudios y seguir aprendiendo, crea una cuenta.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center">
                    <Button type="button" size="lg" asChild>
                       <Link href="/login">Crear Cuenta y Guardar Progreso</Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-8 w-8 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold">{project.title}</h1>
        </div>
        <Badge variant="outline" className="border-dashed">{project.category}</Badge>
      </header>
       
      {planUpdateInfo.updated && (
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/20 text-blue-300">
            <Info className="h-4 w-4 !text-blue-300" />
            <AlertTitle>¡Plan de Estudio Actualizado!</AlertTitle>
            <AlertDescription>
                {planUpdateInfo.reason}
            </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Card className="bg-card/70">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-2 text-sm">Mejor Racha</p>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <p className="text-2xl font-bold">{bestStreak}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/70">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-2 text-sm">CC ganados</p>
              <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-400" />
              <p className="text-2xl font-bold">{earnedCoins}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/70">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-muted-foreground mb-2 text-sm">Dominio del tema</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              <p className="text-2xl font-bold">{dominionPoints}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Plan de Estudios</h2>
        </div>
        <Card className="bg-card/70">
          {studyPlan.length > 0 ? (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sesión</TableHead>
                  <TableHead>¿Qué aprenderás en esta sesión?</TableHead>
                  <TableHead>Tipo de Sesión</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studyPlan.map((session, index) => {
                  const isCompleted = index < completedSessions;
                  const isNext = index === completedSessions;
                  let sessionUrl = `/aprender?project=${project.slug}&session=${index}`;
                  if (isGuest) {
                    sessionUrl += `&guest=true`;
                  }
                  
                  const canStart = isNext && (!isGuest || (isGuest && completedSessions === 0));


                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{session.topic}</TableCell>
                      <TableCell>{session.sessionType}</TableCell>
                      <TableCell className="text-right">
                        {isCompleted ? (
                          <Button variant="outline" size="sm" disabled>
                            Completado
                          </Button>
                        ) : canStart ? (
                          <Button asChild variant='default' size="sm">
                            <Link href={sessionUrl}>
                                Empezar
                            </Link>
                          </Button>
                        ) : (
                          <Button variant='secondary' size="sm" disabled>
                            Bloqueado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <CardContent className="p-6 text-center text-muted-foreground">
              Este proyecto aún no tiene un plan de estudios.
            </CardContent>
          )}
        </Card>
      </section>

      {/* Knowledge Atoms */}
      <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Átomos de conocimiento</h2>
              <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isGuest}>Ver todos ({knowledgeAtoms.length})</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Todos los Átomos de Conocimiento</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <Table>
                    <TableBody>
                      {knowledgeAtoms.map(atom => (
                        <TableRow key={atom.id}>
                          <TableCell className="font-medium w-1/3 align-top">{atom.question}</TableCell>
                          <TableCell className="text-muted-foreground w-2/3 align-top">{atom.answer}</TableCell>
                          <TableCell className="w-auto align-top">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                          <TableCell className="w-auto align-top">
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="bg-card/70">
          <Table>
              <TableBody>
                  {knowledgeAtomsPreview.map(atom => (
                      <TableRow key={atom.id}>
                          <TableCell className="font-medium w-1/3">{atom.question}</TableCell>
                          <TableCell className="text-muted-foreground w-2/3">{atom.answer}</TableCell>
                          <TableCell>
                              <Button variant="ghost" size="icon" disabled={isGuest}>
                                  <Pencil className="h-4 w-4" />
                              </Button>
                          </TableCell>
                          <TableCell>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isGuest}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
          </Card>
      </section>
    </div>
  );
}
