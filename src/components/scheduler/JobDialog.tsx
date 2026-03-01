"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface JobDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (job: any) => void;
    job?: any;
}

export function JobDialog({ open, onOpenChange, onSave, job }: JobDialogProps) {
    const [formData, setFormData] = useState({
        id: "",
        schedule: "",
        flowName: "",
        payload: "{}",
        description: "",
    });

    useEffect(() => {
        if (job) {
            setFormData({
                id: job.id || "",
                schedule: job.schedule || "",
                flowName: job.flowName || "",
                payload: job.payload ? JSON.stringify(job.payload, null, 2) : "{}",
                description: job.description || "",
            });
        } else {
            setFormData({
                id: "",
                schedule: "",
                flowName: "",
                payload: "{}",
                description: "",
            });
        }
    }, [job, open]);

    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const parsedPayload = JSON.parse(formData.payload);
            onSave({
                ...formData,
                payload: parsedPayload,
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Error de JSON",
                description: "El payload debe ser un JSON válido.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{job ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="id">ID de la Tarea</Label>
                        <Input
                            id="id"
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            placeholder="ej. resumen-diario"
                            disabled={!!job}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="schedule">Horario (Cron, 'every 5m', o ISO Date)</Label>
                        <Input
                            id="schedule"
                            value={formData.schedule}
                            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                            placeholder="ej. 0 8 * * * o every 1 hour"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="flowName">Nombre del Flujo (Genkit)</Label>
                        <Input
                            id="flowName"
                            value={formData.flowName}
                            onChange={(e) => setFormData({ ...formData, flowName: e.target.value })}
                            placeholder="ej. kolearning-orchestrator"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (Opcional)</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Resumen matutino de tareas"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payload">Payload (JSON)</Label>
                        <Textarea
                            id="payload"
                            value={formData.payload}
                            onChange={(e) => setFormData({ ...formData, payload: e.target.value })}
                            className="font-mono text-sm h-32"
                            placeholder='{ "message": "Tu prompt aquí" }'
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Guardar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
