
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Atom = {
  question: string;
  answer: string;
}

type Source = {
    name: string;
    type: string;
}

export type Session = {
  session: number;
  type: string;
  questions: string;
  duration: string;
  status: 'Completed' | 'Continue' | 'Locked';
}

export type LearningPathItem = {
    session: number;
    topic: string;
    sessionType: string;
}

export type Project = {
  id: string;
  title: string;
  description: string;
  mastery: number;
  icon: string;
  categories: string[];
  atoms: Atom[];
  sessions: Session[];
  sources: Source[];
  learningPath: LearningPathItem[];
  fullLearningPlanMarkdown?: string;
  author?: string; // Make author optional
  category?: string; // Make category optional
};

type ProjectContextType = {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProjectIcon: (projectId: string, icon: string) => void;
  updateProjectDetails: (projectId: string, title: string, description: string) => void;
  addSessionsToProject: (projectId: string, newSessions: Omit<Session, 'status' | 'session'>[]) => void;
  addAtomsToProject: (projectId: string, newAtoms: Atom[]) => void;
  updateAtom: (projectId: string, atomIndex: number, updatedAtom: Atom) => void;
  deleteAtom: (projectId: string, atomIndex: number) => void;
  completeSession: (projectId: string, sessionIndex: number) => void;
  energy: number;
  sessionStreak: number;
  dailyStreak: number;
  cognitiveCredits: number;
  globalCognitiveCredits: number;
  masteryPoints: number;
  updateEnergy: (amount: number) => void;
  updateStreak: (correct: boolean) => void;
  resetSessionStats: () => void;
  exchangeCreditsForEnergy: (credits: number, energyAmount: number) => boolean;
  nextEnergyIn: number;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const initialProjects: Project[] = [
  {
    id: "1",
    title: "Física Cuántica",
    description: "Un curso introductorio a los principios de la mecánica cuántica.",
    mastery: 85,
    icon: "Book",
    categories: ["Ciencia", "Física"],
    atoms: [
        { question: "¿Qué es la dualidad onda-partícula?", answer: "Es el concepto de la mecánica cuántica según el cual cada partícula puede ser descrita en términos no solo de partículas, sino también de ondas." },
        { question: "¿Qué es el principio de incertidumbre de Heisenberg?", answer: "Establece la imposibilidad de que determinados pares de magnitudes físicas observables y complementarias sean conocidas con precisión arbitraria." }
    ],
    sessions: [
        { session: 1, type: "Calibración", questions: "Flashcards", duration: "20 min", status: "Continue" },
        { session: 2, type: "Refuerzo", questions: "Opción múltiple", duration: "30 min", status: "Locked" },
        { session: 3, type: "Dominio", questions: "Preguntas abiertas", duration: "25 min", status: "Locked" },
    ],
    learningPath: [
        { session: 1, topic: "Fundamentos de la Mecánica Cuántica", sessionType: "Calibración" },
        { session: 2, topic: "Superposición y Entrelazamiento", sessionType: "Incursión" },
        { session: 3, topic: "Repaso de Fundamentos", sessionType: "Refuerzo de Dominio" },
    ],
    sources: [ {name: "Quantum_Physics_for_Dummies.pdf", type: "Documento"} ]
  },
  {
    id: "2",
    title: "Historia de Roma",
    description: "Explora el ascenso y caída del Imperio Romano.",
    mastery: 62,
    icon: "Landmark",
    categories: ["Humanidades", "Historia"],
    atoms: [
        { question: "¿Quién fue el primer emperador de Roma?", answer: "César Augusto (nacido como Cayo Octavio)." },
        { question: "¿Qué fueron las Guerras Púnicas?", answer: "Una serie de tres guerras libradas entre Roma y Cartago desde el 264 a.C. hasta el 146 a.C." }
    ],
    sessions: [
        { session: 1, type: "Incursión", questions: "Flashcards", duration: "25 min", status: "Continue" },
    ],
    learningPath: [
        { session: 1, topic: "La fundación de Roma y la República", sessionType: "Incursión" },
    ],
    sources: [ {name: "The_History_of_Rome.pdf", type: "Documento"} ]
  },
  {
    id: "3",
    title: "Química Orgánica",
    description: "Domina las bases de los compuestos basados en carbono.",
    mastery: 45,
    icon: "FlaskConical",
    categories: ["Ciencia", "Química"],
    atoms: [
        { question: "¿Qué es un alcano?", answer: "Un hidrocarburo acíclico saturado, lo que significa que consiste en átomos de hidrógeno y carbono dispuestos en una estructura de árbol en la que todos los enlaces carbono-carbono son simples." },
    ],
    sessions: [
        { session: 1, type: "Calibración", questions: "Opción múltiple", duration: "15 min", status: "Continue" },
    ],
    learningPath: [
        { session: 1, topic: "Introducción a los hidrocarburos", sessionType: "Calibración" },
    ],
    sources: [ {name: "Organic_Chemistry.pdf", type: "Documento"} ]
  },
];

export const publicProjects: Project[] = [
  {
    id: "4",
    title: "Programación en Python",
    description: "Aprende los fundamentos de Python, uno de los lenguajes más populares.",
    icon: "Code",
    mastery: 0,
    category: "Tecnología",
    author: "Koli Academy",
    categories: ["Tecnología"],
    atoms: [
        { question: "¿Qué es una variable en Python?", answer: "Un contenedor para almacenar valores de datos." },
        { question: "Menciona 3 tipos de datos en Python", answer: "int (entero), str (cadena), bool (booleano)." }
    ],
    sessions: [],
    learningPath: [
        { session: 1, topic: "Variables y Tipos de Datos", sessionType: "Incursión" },
        { session: 2, topic: "Estructuras de Control", sessionType: "Incursión" },
    ],
    sources: [{ name: "python_intro.pdf", type: "Documento" }]
  },
  {
    id: "5",
    title: "Teoría Musical",
    description: "Desde escalas hasta acordes, domina la teoría detrás de la música.",
    icon: "Music",
    mastery: 0,
    category: "Arte",
    author: "Comunidad",
    categories: ["Arte"],
     atoms: [
        { question: "¿Qué es una escala mayor?", answer: "Una escala diatónica con siete notas, caracterizada por su patrón de tonos y semitonos: T-T-S-T-T-T-S." },
        { question: "¿Qué es un acorde?", answer: "Un conjunto de tres o más notas que suenan simultáneamente." }
    ],
    sessions: [],
    learningPath: [
        { session: 1, topic: "Escalas y Tonalidades", sessionType: "Calibración" },
        { session: 2, topic: "Intervalos y Acordes", sessionType: "Incursión" },
    ],
    sources: [{ name: "music_theory_basics.docx", type: "Documento" }]
  },
  {
    id: "6",
    title: "Historia del Arte",
    description: "Un viaje a través de los movimientos artísticos más importantes.",
    icon: "Palette",
    mastery: 0,
    category: "Humanidades",
    author: "Koli Academy",
    categories: ["Humanidades"],
    atoms: [
        { question: "¿Qué caracteriza al Impresionismo?", answer: "Pinceladas visibles, énfasis en la luz y el color, y la captura de un momento en el tiempo." },
        { question: "¿Quién pintó 'La noche estrellada'?", answer: "Vincent van Gogh en 1889." }
    ],
    sessions: [],
    learningPath: [
        { session: 1, topic: "Renacimiento", sessionType: "Incursión" },
        { session: 2, topic: "Impresionismo y Postimpresionismo", sessionType: "Incursión" },
    ],
    sources: [{ name: "art_history_101.pdf", type: "Documento" }]
  },
  {
    id: "7",
    title: "Introducción a React",
    description: "Construye interfaces de usuario modernas y reactivas.",
    icon: "Code",
    mastery: 0,
    category: "Tecnología",
    author: "Comunidad",
    categories: ["Tecnología"],
    atoms: [
        { question: "¿Qué es JSX?", answer: "Una extensión de sintaxis para JavaScript que permite escribir HTML directamente dentro de React." },
        { question: "¿Qué es el 'state' en React?", answer: "Un objeto JavaScript que almacena los datos de un componente y determina cómo se renderiza y se comporta." }
    ],
    sessions: [],
    learningPath: [
        { session: 1, topic: "Componentes y Props", sessionType: "Incursión" },
        { session: 2, topic: "State y Ciclo de Vida", sessionType: "Incursión" },
    ],
    sources: [{ name: "react_docs_summary.txt", type: "Documento" }]
  },
  {
    id: "8",
    title: "Filosofía Griega",
    description: "Explora las ideas de Platón, Aristóteles y Sócrates.",
    icon: "Landmark",
    mastery: 0,
    category: "Humanidades",
    author: "Koli Academy",
    categories: ["Humanidades"],
    atoms: [
        { question: "¿Qué es la 'Alegoría de la caverna' de Platón?", answer: "Una metáfora sobre la naturaleza de la realidad, el conocimiento y la educación filosófica." },
        { question: "¿Cuál es el método socrático?", answer: "Un método de diálogo que utiliza preguntas para estimular el pensamiento crítico y exponer las contradicciones en las creencias de uno." }
    ],
    sessions: [],
    learningPath: [
        { session: 1, topic: "Filósofos Presocráticos", sessionType: "Calibración" },
        { session: 2, topic: "Sócrates y Platón", sessionType: "Incursión" },
    ],
    sources: [{ name: "greek_philosophy.pdf", type: "Documento" }]
  },
];

const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

const isYesterday = (today: Date, otherDate: Date) => {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return isSameDay(yesterday, otherDate);
}

const MAX_NATURAL_ENERGY = 10;
const ENERGY_REGEN_HOURS = 1;

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [energy, setEnergy] = useState(10);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [cognitiveCredits, setCognitiveCredits] = useState(0);
  const [globalCognitiveCredits, setGlobalCognitiveCredits] = useState(500);
  const [masteryPoints, setMasteryPoints] = useState(0);
  const [lastSessionCompletedDate, setLastSessionCompletedDate] = useState<Date | null>(null);
  const [nextEnergyTimestamp, setNextEnergyTimestamp] = useState<number | null>(null);
  const [nextEnergyIn, setNextEnergyIn] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
        if (energy < MAX_NATURAL_ENERGY) {
            const now = Date.now();
            if (!nextEnergyTimestamp) {
                setNextEnergyTimestamp(now + ENERGY_REGEN_HOURS * 60 * 60 * 1000);
            } else if (now >= nextEnergyTimestamp) {
                setEnergy(prev => prev + 1);
                const newTimestamp = nextEnergyTimestamp + ENERGY_REGEN_HOURS * 60 * 60 * 1000;
                setNextEnergyTimestamp(newTimestamp);
            }
            if (nextEnergyTimestamp) {
                setNextEnergyIn(Math.max(0, Math.floor((nextEnergyTimestamp - now) / 1000)));
            }
        } else {
             setNextEnergyIn(0);
             setNextEnergyTimestamp(null);
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [energy, nextEnergyTimestamp]);


  const addProject = (projectToAdd: Project) => {
    if (!projects.find(p => p.id === projectToAdd.id)) {
      const projectWithSessions: Project = {
        ...projectToAdd,
        sessions: projectToAdd.learningPath.map((item, index) => ({
            session: item.session,
            type: item.sessionType,
            questions: 'Flashcards', // Default value
            duration: '20 min', // Default duration
            status: index === 0 ? 'Continue' : 'Locked'
        }))
      };
      setProjects(prevProjects => [...prevProjects, projectWithSessions]);
    }
  };

  const updateProjectIcon = (projectId: string, icon: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, icon: icon } : p
      )
    );
  };
  
  const updateProjectDetails = (projectId: string, title: string, description: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId ? { ...p, title, description } : p
      )
    );
  }

  const addSessionsToProject = (projectId: string, newSessions: Omit<Session, 'status' | 'session'>[]) => {
      setProjects(prevProjects => {
          return prevProjects.map(p => {
              if (p.id === projectId) {
                  const existingSessions = p.sessions;
                  const nextSessionNumber = (existingSessions[existingSessions.length - 1]?.session || 0) + 1;
                  const formattedNewSessions: Session[] = newSessions.map((s, i) => ({
                      ...s,
                      session: nextSessionNumber + i,
                      status: 'Locked',
                  }));
                  return { ...p, sessions: [...existingSessions, ...formattedNewSessions] };
              }
              return p;
          });
      });
  }

  const addAtomsToProject = (projectId: string, newAtoms: Atom[]) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          // Avoid duplicating atoms
          const uniqueNewAtoms = newAtoms.filter(newAtom => 
            !p.atoms.some(existingAtom => existingAtom.question === newAtom.question)
          );
          return { ...p, atoms: [...p.atoms, ...uniqueNewAtoms] };
        }
        return p;
      })
    );
  };


  const updateAtom = (projectId: string, atomIndex: number, updatedAtom: Atom) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newAtoms = [...p.atoms];
          newAtoms[atomIndex] = updatedAtom;
          return { ...p, atoms: newAtoms };
        }
        return p;
      })
    );
  };

  const deleteAtom = (projectId: string, atomIndex: number) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newAtoms = p.atoms.filter((_, index) => index !== atomIndex);
          return { ...p, atoms: newAtoms };
        }
        return p;
      })
    );
  };
  
  const completeSession = (projectId: string, sessionIndex: number) => {
    const today = new Date();
    
    // Only update streak if a session hasn't been completed today
    if (!lastSessionCompletedDate || !isSameDay(today, lastSessionCompletedDate)) {
        if (lastSessionCompletedDate && isYesterday(today, lastSessionCompletedDate)) {
            // It's a consecutive day
            setDailyStreak(prev => prev + 1);
        } else {
            // It's not a consecutive day, reset to 1
            setDailyStreak(1);
        }
        // Update the date of the last completed session
        setLastSessionCompletedDate(today);
    }

    setGlobalCognitiveCredits(prev => prev + cognitiveCredits);


    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newSessions = [...p.sessions];
          // Mark current session as completed
          if (newSessions[sessionIndex]) {
            newSessions[sessionIndex].status = 'Completed';
          }
          // Unlock next session
          if (newSessions[sessionIndex + 1]) {
            newSessions[sessionIndex + 1].status = 'Continue';
          }
          return { ...p, sessions: newSessions };
        }
        return p;
      })
    );
  };

  const updateEnergy = (amount: number) => {
    setEnergy(prev => {
      const newEnergy = Math.max(0, prev + amount);
      if (newEnergy < MAX_NATURAL_ENERGY && energy >= MAX_NATURAL_ENERGY) {
        setNextEnergyTimestamp(Date.now() + ENERGY_REGEN_HOURS * 60 * 60 * 1000);
      }
      return newEnergy;
    });
  };

  const updateStreak = (correct: boolean) => {
    if (correct) {
      setSessionStreak(prev => prev + 1);
      setCognitiveCredits(prev => prev + 5);
      // Assuming 10 points for now, can be adjusted later with question type
      setMasteryPoints(prev => prev + 10);
    } else {
      setSessionStreak(0);
    }
  };

  const resetSessionStats = () => {
    setSessionStreak(0);
    setCognitiveCredits(0);
    setMasteryPoints(0);
  };
  
  const exchangeCreditsForEnergy = (credits: number, energyAmount: number): boolean => {
      if (globalCognitiveCredits >= credits) {
          setGlobalCognitiveCredits(prev => prev - credits);
          setEnergy(prev => prev + energyAmount);
          return true;
      }
      return false;
  }

  return (
    <ProjectContext.Provider value={{ 
        projects, addProject, updateProjectIcon, updateProjectDetails, addSessionsToProject, 
        addAtomsToProject, updateAtom, deleteAtom, completeSession,
        energy, sessionStreak, dailyStreak, cognitiveCredits, globalCognitiveCredits, masteryPoints,
        updateEnergy, updateStreak, resetSessionStats, exchangeCreditsForEnergy, nextEnergyIn
    }}>
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
