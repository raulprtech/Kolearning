
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CalibratePlanOutput } from '@/ai/flows/koli-calibrate-plan';

export type Atom = {
  question: string;
  answer: string;
  retrievability?: number; // FSRS score from 1 to 4
  incorrectAnswers?: string[]; // For multiple choice questions
}

export type Source = {
    name: string;
    type: string;
    content: string;
}

export type Session = {
  session: number;
  type: string;
  questions: string;
  duration: string;
  status: 'Completed' | 'Continue' | 'Locked';
  atoms: Atom[];
}

export type LearningPathItem = {
    session: number;
    topic: string;
    sessionType: string;
    questions: string; // Added from CalibratePlanOutput
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
  author?: string; 
  category?: string;
  isPublic?: boolean;
  bestStreak?: number;
  totalAnswers?: number;
  correctAnswers?: number;
};

type User = {
    name: string;
    email: string;
    password?: string; // Should not be stored long-term in a real app
}

type LearnerRankInfo = {
    rankName: string;
    nextRankName: string;
    progress: number;
    pointsToNext: number;
}

type ProjectContextType = {
  projects: Project[];
  completedProjects: Project[];
  archivedProjects: Project[];
  addProject: (project: Project) => void;
  updateProjectIcon: (projectId: string, icon: string) => void;
  updateProjectDetails: (projectId: string, title: string, description: string) => void;
  updateProjectPlan: (projectId: string, plan: CalibratePlanOutput) => void;
  addSessionsToProject: (projectId: string, newSessions: Omit<Session, 'status' | 'session' | 'atoms'>[]) => void;
  addAtomsToProject: (projectId: string, newAtoms: Atom[]) => void;
  updateAtom: (projectId: string, atomIndex: number, updatedAtom: Atom) => void;
  deleteAtom: (projectId: string, atomIndex: number) => void;
  completeSession: (projectId: string, sessionIndex: number) => void;
  archiveProject: (projectId: string) => boolean;
  unarchiveProject: (projectId: string) => void;
  deleteProjectPermanently: (projectId: string) => void;
  toggleProjectPublic: (projectId: string, isPublic: boolean) => void;
  energy: number;
  sessionStreak: number;
  dailyStreak: number;
  cognitiveCredits: number;
  globalCognitiveCredits: number;
  masteryPoints: number;
  totalMasteryPoints: number;
  updateEnergy: (amount: number) => void;
  recordAnswer: (projectId: string, atomIndex: number, fsrs: number, aidsUsed: boolean, isCorrect: boolean) => void;
  resetSessionStats: () => void;
  exchangeCreditsForEnergy: (credits: number, energyAmount: number) => boolean;
  nextEnergyIn: number;
  sessionAnswers: boolean[];
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  learnerRankInfo: LearnerRankInfo | null;
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
    bestStreak: 5,
    totalAnswers: 20,
    correctAnswers: 17,
    atoms: [
        { 
            question: "¿Qué es la dualidad onda-partícula?", 
            answer: "Es el concepto de la mecánica cuántica según el cual cada partícula puede ser descrita en términos no solo de partículas, sino también de ondas.",
            incorrectAnswers: [
                "Es el principio que dice que las partículas solo pueden existir en un estado a la vez.",
                "Una teoría sobre la gravedad a nivel subatómico.",
                "La idea de que las partículas se comunican más rápido que la luz."
            ]
        },
        { question: "¿Qué es el principio de incertidumbre de Heisenberg?", answer: "Establece la imposibilidad de que determinados pares de magnitudes físicas observables y complementarias sean conocidas con precisión arbitraria." }
    ],
    sessions: [
        { session: 1, type: "Calibración", questions: "Opción Múltiple", duration: "20 min", status: "Continue", atoms: [
            { question: "¿Qué es la dualidad onda-partícula?", answer: "Es el concepto de la mecánica cuántica según el cual cada partícula puede ser descrita en términos no solo de partículas, sino también de ondas.", incorrectAnswers: [
                "Es el principio que dice que las partículas solo pueden existir en un estado a la vez.",
                "Una teoría sobre la gravedad a nivel subatómico.",
                "La idea de que las partículas se comunican más rápido que la luz."
            ] },
            { question: "¿Qué es el principio de incertidumbre de Heisenberg?", answer: "Establece la imposibilidad de que determinados pares de magnitudes físicas observables y complementarias sean conocidas con precisión arbitraria." }
        ] },
        { session: 2, type: "Refuerzo de Dominio", questions: "Formatos Mixtos (Opción Múltiple, Ordenamiento, Asociación)", duration: "30 min", status: "Locked", atoms: [] },
        { session: 3, type: "Prueba de Dominio", questions: "Pregunta Abierta y Casos Prácticos", duration: "25 min", status: "Locked", atoms: [] },
    ],
    learningPath: [
        { session: 1, topic: "Fundamentos de la Mecánica Cuántica", sessionType: "Calibración", questions: "Opción Múltiple" },
        { session: 2, topic: "Superposición y Entrelazamiento", sessionType: "Incursión", questions: "Pregunta Abierta" },
        { session: 3, topic: "Repaso de Fundamentos", sessionType: "Refuerzo de Dominio", questions: "Formatos Mixtos (Opción Múltiple, Ordenamiento, Asociación)" },
    ],
    sources: [ {name: "Quantum_Physics_for_Dummies.pdf", type: "Documento", content: "data:application/pdf;base64,..."} ],
    isPublic: false,
  },
  {
    id: "2",
    title: "Historia de Roma",
    description: "Explora el ascenso y caída del Imperio Romano.",
    mastery: 62,
    icon: "Landmark",
    bestStreak: 3,
    totalAnswers: 15,
    correctAnswers: 9,
    categories: ["Humanidades", "Historia"],
    atoms: [
        { question: "¿Quién fue el primer emperador de Roma?", answer: "César Augusto (nacido como Cayo Octavio)." },
        { question: "¿Qué fueron las Guerras Púnicas?", answer: "Una serie de tres guerras libradas entre Roma y Cartago desde el 264 a.C. hasta el 146 a.C." }
    ],
    sessions: [
        { session: 1, type: "Incursión", questions: "Pregunta Abierta", duration: "25 min", status: "Continue", atoms: [
            { question: "¿Quién fue el primer emperador de Roma?", answer: "César Augusto (nacido como Cayo Octavio)." },
            { question: "¿Qué fueron las Guerras Púnicas?", answer: "Una serie de tres guerras libradas entre Roma y Cartago desde el 264 a.C. hasta el 146 a.C." }
        ] },
    ],
    learningPath: [
        { session: 1, topic: "La fundación de Roma y la República", sessionType: "Incursión", questions: "Pregunta Abierta" },
    ],
    sources: [ {name: "The_History_of_Rome.pdf", type: "Documento", content: "data:application/pdf;base64,..."} ],
    isPublic: false,
  },
  {
    id: "3",
    title: "Química Orgánica",
    description: "Domina las bases de los compuestos basados en carbono.",
    mastery: 45,
    icon: "FlaskConical",
    bestStreak: 2,
    totalAnswers: 10,
    correctAnswers: 4,
    categories: ["Ciencia", "Química"],
    atoms: [
        { question: "¿Qué es un alcano?", answer: "Un hidrocarburo acíclico saturado, lo que significa que consiste en átomos de hidrógeno y carbono dispuestos en una estructura de árbol en la que todos los enlaces carbono-carbono son simples." },
    ],
    sessions: [
        { session: 1, type: "Calibración", questions: "Opción Múltiple", duration: "15 min", status: "Continue", atoms: [
            { question: "¿Qué es un alcano?", answer: "Un hidrocarburo acíclico saturado, lo que significa que consiste en átomos de hidrógeno y carbono dispuestos en una estructura de árbol en la que todos los enlaces carbono-carbono son simples." },
        ] },
    ],
    learningPath: [
        { session: 1, topic: "Introducción a los hidrocarburos", sessionType: "Calibración", questions: "Opción Múltiple" },
    ],
    sources: [ {name: "Organic_Chemistry.pdf", type: "Documento", content: "data:application/pdf;base64,..."} ],
    isPublic: false,
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
        { session: 1, topic: "Variables y Tipos de Datos", sessionType: "Incursión", questions: "Pregunta Abierta" },
        { session: 2, topic: "Estructuras de Control", sessionType: "Incursión", questions: "Pregunta Abierta" },
    ],
    sources: [{ name: "python_intro.pdf", type: "Documento", content: "data:application/pdf;base64,..." }],
    isPublic: true,
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
        { session: 1, topic: "Escalas y Tonalidades", sessionType: "Calibración", questions: "Opción Múltiple" },
        { session: 2, topic: "Intervalos y Acordes", sessionType: "Incursión", questions: "Pregunta Abierta" },
    ],
    sources: [{ name: "music_theory_basics.docx", type: "Documento", content: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,..." }],
    isPublic: true,
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
        { session: 1, topic: "Renacimiento", sessionType: "Incursión", questions: "Pregunta Abierta" },
        { session: 2, topic: "Impresionismo y Postimpresionismo", sessionType: "Incursión", questions: "Pregunta Abierta" },
    ],
    sources: [{ name: "art_history_101.pdf", type: "Documento", content: "data:application/pdf;base64,..." }],
    isPublic: true,
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
        { session: 1, topic: "Componentes y Props", sessionType: "Incursión", questions: "Pregunta Abierta" },
        { session: 2, topic: "State y Ciclo de Vida", sessionType: "Incursión", questions: "Pregunta Abierta" },
    ],
    sources: [{ name: "react_docs_summary.txt", type: "Documento", content: "data:text/plain;base64,..." }],
    isPublic: true,
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
        { session: 1, topic: "Filósofos Presocráticos", sessionType: "Calibración", questions: "Opción Múltiple" },
        { session: 2, topic: "Sócrates y Platón", sessionType: "Incursión", questions: "Pregunta Abierta" },
    ],
    sources: [{ name: "greek_philosophy.pdf", type: "Documento", content: "data:application/pdf;base64,..." }],
    isPublic: true,
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

const ranks = [
    { name: "G", minPoints: 0 },
    { name: "F", minPoints: 100 },
    { name: "E", minPoints: 250 },
    { name: "D", minPoints: 500 },
    { name: "C", minPoints: 1000 },
    { name: "B", minPoints: 2000 },
    { name: "A", minPoints: 5000 },
    { name: "S", minPoints: 10000 },
];

const getLearnerRank = (totalMasteryPoints: number): LearnerRankInfo => {
    let currentRank = ranks[0];
    let nextRank = ranks[1];

    for (let i = 0; i < ranks.length; i++) {
        if (totalMasteryPoints >= ranks[i].minPoints) {
            currentRank = ranks[i];
            if (i < ranks.length - 1) {
                nextRank = ranks[i + 1];
            } else {
                nextRank = { name: "S", minPoints: Infinity }; // Max rank
            }
        }
    }

    const pointsInCurrentRank = totalMasteryPoints - currentRank.minPoints;
    const pointsForNextRank = nextRank.minPoints - currentRank.minPoints;
    const progressPercentage = pointsForNextRank === Infinity ? 100 : Math.round((pointsInCurrentRank / pointsForNextRank) * 100);
    const pointsToNext = pointsForNextRank === Infinity ? 0 : pointsForNextRank - pointsInCurrentRank;
    
    return {
        rankName: currentRank.name,
        nextRankName: nextRank.name,
        progress: progressPercentage,
        pointsToNext: pointsToNext,
    };
}


const MAX_NATURAL_ENERGY = 10;
const ENERGY_REGEN_HOURS = 1;
const MAX_ARCHIVED_PROJECTS = 5;

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [energy, setEnergy] = useState(10);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [cognitiveCredits, setCognitiveCredits] = useState(0);
  const [globalCognitiveCredits, setGlobalCognitiveCredits] = useState(500);
  const [masteryPoints, setMasteryPoints] = useState(0);
  const [totalMasteryPoints, setTotalMasteryPoints] = useState(170); // Initial value for demonstration
  const [lastSessionCompletedDate, setLastSessionCompletedDate] = useState<Date | null>(null);
  const [nextEnergyTimestamp, setNextEnergyTimestamp] = useState<number | null>(null);
  const [nextEnergyIn, setNextEnergyIn] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<boolean[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const user = localStorage.getItem('kolearning_user');
      if (user) {
        setCurrentUser(JSON.parse(user));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    try {
      const users: User[] = JSON.parse(localStorage.getItem('kolearning_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        localStorage.setItem('kolearning_user', JSON.stringify(userWithoutPassword));
        setCurrentUser(userWithoutPassword);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed", error);
      return false;
    }
  };

  const signup = (name: string, email: string, password: string): boolean => {
    try {
      const users: User[] = JSON.parse(localStorage.getItem('kolearning_users') || '[]');
      if (users.some(u => u.email === email)) {
        return false; // User already exists
      }
      const newUser: User = { name, email, password };
      users.push(newUser);
      localStorage.setItem('kolearning_users', JSON.stringify(users));
      
      const { password: _, ...userWithoutPassword } = newUser;
      localStorage.setItem('kolearning_user', JSON.stringify(userWithoutPassword));
      setCurrentUser(userWithoutPassword);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Signup failed", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('kolearning_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

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


  const addProject = useCallback((projectToAdd: Project) => {
    if (!projects.find(p => p.id === projectToAdd.id)) {
        const atoms = [...projectToAdd.atoms];
        const sessions: Session[] = projectToAdd.learningPath.map((item, index) => {
            const sessionSize = 10;
            const sessionAtoms = atoms.slice(index * sessionSize, (index + 1) * sessionSize);

            return {
                session: item.session,
                type: item.sessionType,
                questions: item.questions,
                duration: '20 min',
                status: index === 0 ? 'Continue' : 'Locked',
                atoms: sessionAtoms,
            };
        });

        const projectWithSessions: Project = {
            ...projectToAdd,
            sessions: sessions,
        };
        setProjects(prevProjects => [...prevProjects, projectWithSessions]);
    }
}, [projects]);


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

  const updateProjectPlan = (projectId: string, plan: CalibratePlanOutput) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newLearningPath = plan.learningPath.flatMap(day => day.sessions);
          const newSessions: Session[] = newLearningPath.map((item, index) => ({
            session: item.session,
            type: item.sessionType,
            questions: item.questions,
            duration: '20 min', // Default duration
            status: index === 0 ? 'Continue' : 'Locked',
            atoms: p.atoms.slice(index * 10, (index + 1) * 10),
          }));

          return {
            ...p,
            learningPath: newLearningPath,
            sessions: newSessions,
            fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
            // Reset stats as it's a new plan
            mastery: 0,
            bestStreak: 0,
            totalAnswers: 0,
            correctAnswers: 0,
          };
        }
        return p;
      })
    );
  };

  const addSessionsToProject = (projectId: string, newSessions: Omit<Session, 'status' | 'session' | 'atoms'>[]) => {
      setProjects(prevProjects => {
          return prevProjects.map(p => {
              if (p.id === projectId) {
                  const existingSessions = p.sessions;
                  const nextSessionNumber = (existingSessions[existingSessions.length - 1]?.session || 0) + 1;
                  const formattedNewSessions: Session[] = newSessions.map((s, i) => ({
                      ...s,
                      session: nextSessionNumber + i,
                      status: 'Locked',
                      atoms: [] // Atoms should be added separately if needed
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
  
 const completeSession = useCallback((projectId: string, sessionIndex: number) => {
    const today = new Date();
    
    if (!lastSessionCompletedDate || !isSameDay(today, lastSessionCompletedDate)) {
        if (lastSessionCompletedDate && isYesterday(today, lastSessionCompletedDate)) {
            setDailyStreak(prev => prev + 1);
        } else {
            setDailyStreak(1);
        }
        setLastSessionCompletedDate(today);
    }

    setGlobalCognitiveCredits(prev => prev + cognitiveCredits);

    let projectToUpdate: Project | undefined;

    setProjects(prevProjects =>
        prevProjects.map(p => {
            if (p.id === projectId) {
                projectToUpdate = p;
                const updatedSessions = [...p.sessions];
                if (updatedSessions[sessionIndex]) {
                    updatedSessions[sessionIndex].status = 'Completed';
                }
                if (updatedSessions[sessionIndex + 1]) {
                    updatedSessions[sessionIndex + 1].status = 'Continue';
                }
                
                const sessionCorrectAnswers = sessionAnswers.filter(a => a).length;
                const newTotalAnswers = (p.totalAnswers || 0) + sessionAnswers.length;
                const newCorrectAnswers = (p.correctAnswers || 0) + sessionCorrectAnswers;
                const newBestStreak = Math.max(p.bestStreak || 0, sessionStreak);
                const newMastery = newTotalAnswers > 0 ? Math.round((newCorrectAnswers / newTotalAnswers) * 100) : 0;

                return { 
                    ...p, 
                    sessions: updatedSessions,
                    totalAnswers: newTotalAnswers,
                    correctAnswers: newCorrectAnswers,
                    bestStreak: newBestStreak,
                    mastery: newMastery,
                };
            }
            return p;
        })
    );

    if (projectToUpdate && sessionIndex === projectToUpdate.sessions.length - 1) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setCompletedProjects(prev => [...prev, { ...projectToUpdate, mastery: 100 }]);
    }
}, [lastSessionCompletedDate, cognitiveCredits, sessionAnswers, sessionStreak]);


  const archiveProject = (projectId: string): boolean => {
    if (archivedProjects.length >= MAX_ARCHIVED_PROJECTS) {
        return false; // Limit reached
    }
    const projectToArchive = projects.find(p => p.id === projectId);
    if (projectToArchive) {
        setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
        setArchivedProjects(prevArchived => [...prevArchived, projectToArchive]);
    }
    return true;
};

  const unarchiveProject = (projectId: string) => {
    const projectToUnarchive = archivedProjects.find(p => p.id === projectId);
    if (projectToUnarchive) {
      setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
      setProjects(prev => [...prev, projectToUnarchive]);
    }
  };

  const deleteProjectPermanently = (projectId: string) => {
    setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const toggleProjectPublic = (projectId: string, isPublic: boolean) => {
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, isPublic } : p))
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

  const recordAnswer = useCallback((projectId: string, atomIndex: number, fsrs: number, aidsUsed: boolean, isCorrect: boolean) => {
    setSessionAnswers(prev => [...prev, isCorrect]);
    
    setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === projectId) {
            const newAtoms = [...p.atoms];
            if (newAtoms[atomIndex]) {
                newAtoms[atomIndex] = { ...newAtoms[atomIndex], retrievability: fsrs };
            }
            return { ...p, atoms: newAtoms };
        }
        return p;
    }));
    
    if (isCorrect) {
      setSessionStreak(prev => prev + 1);
      setCognitiveCredits(prev => prev + (aidsUsed ? 1 : 2));
    } else {
      setSessionStreak(0);
    }
    
    const newMasteryPoints = fsrs * 5;
    setMasteryPoints(prev => prev + newMasteryPoints);
    setTotalMasteryPoints(prev => prev + newMasteryPoints);
  }, []);

  const resetSessionStats = useCallback(() => {
    setSessionStreak(0);
    setCognitiveCredits(0);
    setMasteryPoints(0);
    setSessionAnswers([]);
  }, []);
  
  const exchangeCreditsForEnergy = (credits: number, energyAmount: number): boolean => {
      if (globalCognitiveCredits >= credits) {
          setGlobalCognitiveCredits(prev => prev - credits);
          setEnergy(prev => prev + energyAmount);
          return true;
      }
      return false;
  }
  
  const learnerRankInfo = getLearnerRank(totalMasteryPoints);

  return (
    <ProjectContext.Provider value={{ 
        projects, completedProjects, archivedProjects, addProject, updateProjectIcon, updateProjectDetails, updateProjectPlan, addSessionsToProject, 
        addAtomsToProject, updateAtom, deleteAtom, completeSession, archiveProject, unarchiveProject, deleteProjectPermanently, toggleProjectPublic,
        energy, sessionStreak, dailyStreak, cognitiveCredits, globalCognitiveCredits, masteryPoints, totalMasteryPoints,
        updateEnergy, recordAnswer, resetSessionStats, exchangeCreditsForEnergy, nextEnergyIn, sessionAnswers,
        isAuthenticated, currentUser, login, signup, logout,
        learnerRankInfo
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
