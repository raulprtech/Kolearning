
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold">Ajustes</h1>
                <p className="text-muted-foreground">Gestiona la configuración de tu cuenta y de la aplicación.</p>
            </header>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil</CardTitle>
                        <CardDescription>Esta es tu información personal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Nombre de usuario</Label>
                            <Input id="username" placeholder="Tu nombre de usuario" defaultValue="EstudianteEjemplar" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="Tu correo electrónico" defaultValue="test@example.com" disabled />
                        </div>
                         <Button>Guardar Cambios</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones</CardTitle>
                        <CardDescription>Elige cómo quieres recibir las notificaciones.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label>Notificaciones por correo</Label>
                                <p className="text-sm text-muted-foreground">Recibe un resumen semanal de tu progreso.</p>
                            </div>
                            <Switch defaultChecked/>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label>Recordatorios de estudio</Label>
                                <p className="text-sm text-muted-foreground">Recibe notificaciones para no perder tu racha.</p>
                            </div>
                             <Switch />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Apariencia</CardTitle>
                        <CardDescription>Personaliza el aspecto de la aplicación.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <Label>Modo oscuro</Label>
                                 <p className="text-sm text-muted-foreground">Activa o desactiva el tema oscuro.</p>
                            </div>
                            <Switch
                                checked={theme === 'dark'}
                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                            />
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                        <CardDescription>Estas acciones son permanentes e irreversibles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button variant="destructive">Eliminar Cuenta</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
