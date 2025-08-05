
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProjects } from '@/contexts/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import { ArchiveRestore, Trash2, Inbox } from 'lucide-react';

export default function ArchivePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { archivedProjects, unarchiveProject, deleteProjectPermanently } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const handleRestore = (projectId: string) => {
    unarchiveProject(projectId);
    toast({
      title: '¡Proyecto Restaurado!',
      description: 'El proyecto ha sido movido de vuelta a tu lista principal.',
    });
  };

  const openDeleteDialog = (projectId: string) => {
    setSelectedProjectId(projectId);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedProjectId) {
      deleteProjectPermanently(selectedProjectId);
      toast({
        title: 'Proyecto eliminado',
        description: 'El proyecto ha sido eliminado permanentemente.',
        variant: 'destructive',
      });
    }
    setDialogOpen(false);
    setSelectedProjectId(null);
  };

  return (
    <>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proyecto y todos sus datos asociados se perderán para siempre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1 flex flex-col p-6 bg-background">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline">Proyectos Archivados</h1>
          <p className="text-muted-foreground">
            Aquí puedes restaurar tus proyectos o eliminarlos de forma definitiva.
          </p>
        </div>

        {archivedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedProjects.map((project) => (
              <Card key={project.id} className="bg-card/50 flex flex-col">
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-end justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(project.id)}
                  >
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Restaurar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDeleteDialog(project.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-lg">
            <Inbox className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">Tu archivo está vacío</h2>
            <p className="mt-2 text-muted-foreground">
              Cuando archives un proyecto, aparecerá aquí.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
