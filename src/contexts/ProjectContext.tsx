
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Atom = {
  question: string;
  answer: string;
}

type Source = {
    name: string;
    type: string;
}

type Project = {
  id: string;
  title: string;
  mastery: number;
  icon: string;
  categories: string[];
  atoms: Atom[];
  sessions?: string;
  sources: Source[];
};

type ProjectContextType = {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProjectIcon: (projectId: string, icon: string) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const initialProjects: Project[] = [
  {
    id: "1",
    title: "Física Cuántica",
    mastery: 85,
    icon: "Book",
    categories: ["Ciencia", "Física"],
    atoms: [
        { question: "¿Qué es la dualidad onda-partícula?", answer: "Es el concepto de la mecánica cuántica según el cual cada partícula puede ser descrita en términos no solo de partículas, sino también de ondas." },
        { question: "¿Qué es el principio de incertidumbre de Heisenberg?", answer: "Establece la imposibilidad de que determinados pares de magnitudes físicas observables y complementarias sean conocidas con precisión arbitraria." }
    ],
    sessions: `
        <h3>Sesión de Calibración</h3>
        <p>Evalúa tu conocimiento base con 20 preguntas de opción múltiple.</p>
        <h3>Sesión de Refuerzo de Dominio</h3>
        <p>Combate el olvido con repasos espaciados de los átomos ya aprendidos.</p>
    `,
    sources: [ {name: "Quantum_Physics_for_Dummies.pdf", type: "Documento"} ]
  },
  {
    id: "2",
    title: "Historia de Roma",
    mastery: 62,
    icon: "Landmark",
    categories: ["Humanidades", "Historia"],
    atoms: [
        { question: "¿Quién fue el primer emperador de Roma?", answer: "César Augusto (nacido como Cayo Octavio)." },
        { question: "¿Qué fueron las Guerras Púnicas?", answer: "Una serie de tres guerras libradas entre Roma y Cartago desde el 264 a.C. hasta el 146 a.C." }
    ],
    sessions: `
        <h3>Sesión de Incursión</h3>
        <p>Comienza a aprender sobre los principales emperadores y las grandes batallas a través de flashcards.</p>
    `,
    sources: [ {name: "The_History_of_Rome.pdf", type: "Documento"} ]
  },
  {
    id: "3",
    title: "Química Orgánica",
    mastery: 45,
    icon: "FlaskConical",
    categories: ["Ciencia", "Química"],
    atoms: [
        { question: "¿Qué es un alcano?", answer: "Un hidrocarburo acíclico saturado, lo que significa que consiste en átomos de hidrógeno y carbono dispuestos en una estructura de árbol en la que todos los enlaces carbono-carbono son simples." },
    ],
    sessions: `
        <h3>Sesión de Calibración</h3>
        <p>Vamos a identificar tu conocimiento sobre los grupos funcionales básicos.</p>
    `,
    sources: [ {name: "Organic_Chemistry.pdf", type: "Documento"} ]
  },
];

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const addProject = (newProject: Project) => {
    if (!projects.find(p => p.id === newProject.id)) {
      setProjects(prevProjects => [...prevProjects, newProject]);
    }
  };

  const updateProjectIcon = (projectId: string, icon: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, icon: icon } : p
      )
    );
  };
  
  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProjectIcon }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
