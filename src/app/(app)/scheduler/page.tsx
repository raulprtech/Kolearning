"use client";

import React, { useState, useEffect } from "react";
import { Plus, Play, Edit2, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobDialog } from "@/components/scheduler/JobDialog";
import { useToast } from "@/hooks/use-toast";

export default function SchedulerPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<any>(null);
    const { toast } = useToast();

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/ai/scheduler");
            const data = await response.json();
            if (response.ok) {
                setJobs(data);
            } else {
                toast({
                    title: "Error",
                    description: data.error || "No se pudieron cargar las tareas",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleSaveJob = async (jobData: any) => {
        try {
            const response = await fetch("/api/ai/scheduler", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "add", ...jobData }),
            });
            if (response.ok) {
                toast({ title: "Éxito", description: `Tarea ${jobData.id} guardada` });
                fetchJobs();
            } else {
                const data = await response.json();
                toast({
                    title: "Error",
                    description: data.error || "No se pudo guardar la tarea",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error saving job:", error);
        }
    };

    const handleDeleteJob = async (id: string) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar la tarea "${id}"?`)) return;

        try {
            const response = await fetch("/api/ai/scheduler", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "remove", id }),
            });
            if (response.ok) {
                toast({ title: "Éxito", description: "Tarea eliminada" });
                fetchJobs();
            }
        } catch (error) {
            console.error("Error deleting job:", error);
        }
    };

    const handleRunJob = async (id: string) => {
        try {
            toast({ title: "Ejecutando", description: `Iniciando tarea ${id}...` });
            const response = await fetch("/api/ai/scheduler", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "run", id }),
            });
            if (response.ok) {
                toast({ title: "Éxito", description: "Tarea completada con éxito" });
            } else {
                const data = await response.json();
                toast({
                    title: "Error",
                    description: data.error || "Error al ejecutar la tarea",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error running job:", error);
        }
    };

    const handleEdit = (job: any) => {
        setEditingJob(job);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingJob(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Planificador de Tareas</h1>
                    <p className="text-muted-foreground">Gestiona tus tareas programadas (estilo OpenClaw)</p>
                </div>
                <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" /> Nueva Tarea
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tareas Configuradas</CardTitle>
                    <CardDescription>
                        Las tareas se ejecutan en el servidor de Genkit según el horario definido.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8 text-muted-foreground">Cargando tareas...</div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            <Clock className="h-12 w-12 mb-4 opacity-20" />
                            <p>No hay tareas programadas aún.</p>
                            <Button variant="link" onClick={handleAdd}>Crea tu primera tarea</Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID / Descripción</TableHead>
                                    <TableHead>Horario</TableHead>
                                    <TableHead>Flujo</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => (
                                    <TableRow key={job.id}>
                                        <TableCell>
                                            <div className="font-medium">{job.id}</div>
                                            {job.description && (
                                                <div className="text-xs text-muted-foreground">{job.description}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono">
                                                {job.schedule}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-xs bg-muted p-1 rounded">
                                                {job.flowName}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRunJob(job.id)}
                                                    title="Ejecutar ahora"
                                                >
                                                    <Play className="h-4 w-4 text-green-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(job)}
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteJob(job.id)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <JobDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSaveJob}
                job={editingJob}
            />
        </div>
    );
}
