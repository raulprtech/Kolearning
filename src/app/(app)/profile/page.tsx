
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjects, User } from '@/contexts/ProjectContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, updateUserProfile } = useProjects();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    profession: '',
    company: '',
    age: '',
    additionalInfo: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        profession: currentUser.profession || '',
        company: currentUser.company || '',
        age: currentUser.age || '',
        additionalInfo: currentUser.additionalInfo || '',
      });
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate async operation
    setTimeout(() => {
      const success = updateUserProfile(formData);
      if (success) {
        toast({
          title: '¡Perfil Actualizado!',
          description: 'Tu información ha sido guardada correctamente.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar tu perfil. Inténtalo de nuevo.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }, 500);
  };

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Tu Perfil</h1>
        <p className="text-muted-foreground">
          Mantén tu información actualizada para personalizar tu experiencia de aprendizaje.
        </p>
      </div>
      
      <Card className="max-w-2xl mx-auto w-full bg-card/50">
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Estos datos ayudarán a Koli a entender mejor tu contexto y adaptar el contenido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <Label htmlFor="profession">Profesión / Ocupación</Label>
                <Input id="profession" value={formData.profession} onChange={handleChange} placeholder="Ej: Estudiante, Desarrollador..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa / Escuela</Label>
                <Input id="company" value={formData.company} onChange={handleChange} placeholder="Ej: Universidad de Buenos Aires..." />
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input id="age" type="number" value={formData.age} onChange={handleChange} className="max-w-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Información Adicional</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                placeholder="Ej: 'Me preparo para un examen de certificación en 3 meses', 'Prefiero explicaciones visuales', etc."
                rows={4}
              />
               <p className="text-xs text-muted-foreground">
                Cualquier dato que consideres relevante para que Koli te ayude mejor.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
