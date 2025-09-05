"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { CalibratePlanOutput } from '@/ai/flows/koli-calibrate-plan';
import { dynamicLearningPathAdjustment } from '@/ai/flows/koli-strategic-tutor';
import { differenceInDays, addDays } from 'date-fns';
import { generateDistractors } from '@/ai/flows/generate-distractors';
import { generateOrderingQuestion } from "@/ai/flows/generate-ordering-question";


export type PerformanceRecord = {
  question: string;
  timestamp: string;
  responseTime: number; // in ms
  rating: 1 | 2 | 3 | 4;
  isCorrect: boolean;
  aidsUsed: string[]; // e.g., ['hint', 'rephrase']
};

export type Atom = {
  question: string;
  answer: string;
  // FSRS Metrics
  difficulty?: number; // How hard is this to learn? (0-1)
  stability?: number; // How long will you remember this? (in days)
  lastReviewed?: string; // ISO date string
  retrievability?: number; // FSRS score from 1 to 4
  incorrectAnswers?: string[]; // For multiple choice questions
  // For ordering questions
  orderingItems?: string[];
  correctOrder?: string[];
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
  numAtoms: number;
}

export type LearningPathItem = {
    session: number;
    topic: string;
    sessionType: string;
    questions: string; // Added from CalibratePlanOutput
    numAtoms: number;
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
  tutorLog?: any[];
  performanceLog?: PerformanceRecord[];
};

export type User = {
    name: string;
    email: string;
    password?: string; // Should not be stored long-term in a real app
    profession?: string;
    company?: string;
    age?: string;
    additionalInfo?: string;
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
  addSessionsToProject: (projectId: string, newSessions: Omit<Session, 'status' | 'session' | 'atoms'>[], insertAfterSession?: number) => void;
  addAtomsToProject: (projectId: string, newAtoms: Atom[]) => void;
  updateAtom: (projectId: string, atomIndex: number, updatedAtom: Atom) => void;
  deleteAtom: (projectId: string, atomIndex: number) => void;
  deleteSource: (projectId: string, sourceIndex: number) => void;
  completeSession: (projectId: string, sessionIndex: number) => Promise<void>;
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
  recordAnswer: (projectId: string, atomIndex: number, fsrs: 1|2|3|4, isCorrect: boolean, responseTime: number, aidsUsed: string[]) => void;
  resetSessionStats: () => void;
  exchangeCreditsForEnergy: (credits: number, energyAmount: number) => boolean;
  nextEnergyIn: number;
  sessionAnswers: boolean[];
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  signup: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateUserProfile: (profileData: Partial<User>) => boolean;
  learnerRankInfo: LearnerRankInfo | null;
  isLoading: boolean;
  setPendingProject: (project: Project) => void;
  pendingProject: Project | null;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const initialProjects: Project[] = [];

export const publicProjects: Project[] = [];

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

const calculateCurrentRetrievability = (stability: number, daysSinceLastReview: number): number => {
    return Math.pow(0.9, daysSinceLastReview / stability);
};


const calculateMastery = (atoms: Atom[]): number => {
    if (atoms.length === 0) {
        return 0;
    }

    const studiedAtoms = atoms.filter(atom => atom.lastReviewed && atom.stability);
    
    // If no atoms have been studied yet, mastery is 0
    if (studiedAtoms.length === 0) {
        return 0;
    }

    // Calculate average retrievability for studied atoms only
    const totalRetrievability = studiedAtoms.reduce((sum, atom) => {
        const daysSince = differenceInDays(new Date(), new Date(atom.lastReviewed!));
        const retrievability = calculateCurrentRetrievability(atom.stability!, daysSince);
        return sum + retrievability;
    }, 0);

    const averageRetrievability = totalRetrievability / studiedAtoms.length;
    
    // Convert to percentage (0-100) and weight by coverage
    const coverage = studiedAtoms.length / atoms.length;
    const masteryScore = (averageRetrievability * coverage) * 100;
    
    return Math.round(masteryScore);
};


const MAX_NATURAL_ENERGY = 10;
const ENERGY_REGEN_HOURS = 1;
const MAX_ARCHIVED_PROJECTS = 5;
const FSRS_WEIGHTS = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];


export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProject, setPendingProject] = useState<Project | null>(null);
  
  // Derived values from Supabase auth
  const isAuthenticated = !!user;
  const currentUser: User | null = user ? {
    name: profile?.name || user.email || '',
    email: user.email || '',
    profession: profile?.profession || undefined,
    company: profile?.company || undefined,
    age: profile?.age || undefined,
    additionalInfo: profile?.additional_info || undefined,
  } : null;

  const learnerRankInfo = getLearnerRank(totalMasteryPoints);

  const checkForReviewSessions = useCallback(() => {
    const today = new Date();
    setCompletedProjects(prevCompleted => {
        let hasChanged = false;
        const updatedProjects = prevCompleted.map(p => {
            const atomsToReview = p.atoms.filter(atom => {
                if (!atom.lastReviewed || !atom.stability) return false;
                const daysSince = differenceInDays(today, new Date(atom.lastReviewed));
                const retrievability = calculateCurrentRetrievability(atom.stability, daysSince);
                return retrievability < 0.9;
            });

            const hasActiveReviewSession = p.sessions.some(s => s.status === 'Continue');

            if (atomsToReview.length > 0 && !hasActiveReviewSession) {
                hasChanged = true;
                
                const sessionType = "Refuerzo de Dominio";
                let questionsFormat: "Opción Múltiple" | "Ordenamiento";

                // Randomly select a question format (excluding open questions for reinforcement)
                const rand = Math.random();
                if (rand < 0.5) {
                    questionsFormat = "Opción Múltiple";
                } else {
                    questionsFormat = "Ordenamiento";
                }

                const atomsForSession = atomsToReview.slice(0, 10);

                const newSession: Session = {
                    session: (p.sessions[p.sessions.length - 1]?.session || 0) + 1,
                    type: sessionType,
                    questions: questionsFormat,
                    duration: "15 min",
                    status: 'Continue',
                    atoms: atomsForSession,
                    numAtoms: atomsForSession.length,
                };

                // Generate content asynchronously after session creation
                if (questionsFormat === "Opción Múltiple") {
                    (async () => {
                        const atomsWithDistractors = await Promise.all(newSession.atoms.map(async (atom) => {
                            if (!atom.incorrectAnswers || atom.incorrectAnswers.length === 0) {
                                try {
                                    const result = await generateDistractors({ question: atom.question, answer: atom.answer, count: 3 });
                                    return { ...atom, incorrectAnswers: result.distractors };
                                } catch (error) {
                                    console.error("Failed to generate distractors for atom:", atom.question, error);
                                    return atom;
                                }
                            }
                            return atom;
                        }));
                        
                        setCompletedProjects(currentProjects => 
                            currentProjects.map(cp => 
                                cp.id === p.id 
                                    ? { ...cp, sessions: cp.sessions.map(s => s.session === newSession.session ? { ...s, atoms: atomsWithDistractors } : s) } 
                                    : cp
                            )
                        );
                    })();
                } else if (questionsFormat === "Ordenamiento") {
                    (async () => {
                        const atomsWithOrderingData = await Promise.all(newSession.atoms.map(async (atom) => {
                            if (!atom.orderingItems || atom.orderingItems.length === 0) {
                                try {
                                    const result = await generateOrderingQuestion({ context: atom.answer });
                                    if (result) {
                                        return { ...atom, orderingItems: result.items, correctOrder: result.correctOrder };
                                    }
                                    return atom;
                                } catch (error) {
                                    console.error("Failed to generate ordering question for atom:", atom.question, error);
                                    return atom;
                                }
                            }
                            return atom;
                        }));
                        
                        setCompletedProjects(currentProjects => 
                            currentProjects.map(cp => 
                                cp.id === p.id 
                                    ? { ...cp, sessions: cp.sessions.map(s => s.session === newSession.session ? { ...s, atoms: atomsWithOrderingData } : s) } 
                                    : cp
                            )
                        );
                    })();
                }

                return { ...p, sessions: [...p.sessions, newSession] };
            }
            return p;
        });
        return hasChanged ? updatedProjects : prevCompleted;
    });

    // Also update mastery for all projects to reflect time decay
    setProjects(prev => prev.map(p => ({ ...p, mastery: calculateMastery(p.atoms) })));
    setCompletedProjects(prev => prev.map(p => ({ ...p, mastery: calculateMastery(p.atoms) })));
  }, []);

  // Effect to load data based on authentication state
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    try {
      if (user) {
        // User is authenticated, load their data
        const storedProjects = localStorage.getItem(`kolearning_projects_${user.id}`);
        const storedCompleted = localStorage.getItem(`kolearning_completed_projects_${user.id}`);
        const storedArchived = localStorage.getItem(`kolearning_archived_projects_${user.id}`);

        setProjects(storedProjects ? JSON.parse(storedProjects) : initialProjects);
        if (storedCompleted) setCompletedProjects(JSON.parse(storedCompleted));
        if (storedArchived) setArchivedProjects(JSON.parse(storedArchived));
      } else {
        // User not authenticated, reset to initial state
        setProjects(initialProjects);
        setCompletedProjects([]);
        setArchivedProjects([]);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setProjects(initialProjects);
      setCompletedProjects([]);
      setArchivedProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, user?.id]);


  useEffect(() => {
      if (!isLoading) {
          checkForReviewSessions();
      }
  }, [isLoading, checkForReviewSessions]);

  // Effect to save data to localStorage whenever it changes
  useEffect(() => {
    if (isLoading || !user) return; // Don't save if loading or not authenticated
    try {
      localStorage.setItem(`kolearning_projects_${user.id}`, JSON.stringify(projects));
      localStorage.setItem(`kolearning_completed_projects_${user.id}`, JSON.stringify(completedProjects));
      localStorage.setItem(`kolearning_archived_projects_${user.id}`, JSON.stringify(archivedProjects));
    } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            console.error("LocalStorage quota exceeded. Cannot save projects.");
        } else {
            console.error("Failed to save projects to localStorage", error);
        }
    }
  }, [projects, completedProjects, archivedProjects, isLoading, user]);


  // Legacy auth methods - now handled by Supabase AuthContext
  const login = (email: string, password: string): boolean => {
    console.warn('ProjectContext.login is deprecated. Use Supabase AuthContext instead.');
    return false;
  };

  const signup = (name: string, email: string, password: string): boolean => {
    console.warn('ProjectContext.signup is deprecated. Use Supabase AuthContext instead.');
    return false;
  };

  const logout = () => {
    console.warn('ProjectContext.logout is deprecated. Use Supabase AuthContext.signOut instead.');
    // Just clear project data, auth is handled by Supabase
    setProjects(initialProjects);
    setCompletedProjects([]);
    setArchivedProjects([]);
    setEnergy(10);
    setGlobalCognitiveCredits(500);
    setTotalMasteryPoints(170);
  };
  
  const updateUserProfile = (profileData: Partial<User>): boolean => {
    console.warn('ProjectContext.updateUserProfile is deprecated. Use Supabase AuthContext.updateProfile instead.');
    return false;
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
            const sessionAtoms = atoms.slice(index * item.numAtoms, (index + 1) * item.numAtoms);

            return {
                session: item.session,
                type: item.sessionType,
                questions: item.questions,
                duration: '20 min',
                status: index === 0 ? 'Continue' : 'Locked',
                atoms: sessionAtoms,
                numAtoms: item.numAtoms,
            };
        });

        const projectWithSessions: Project = {
            ...projectToAdd,
            sessions: sessions,
        };
        setProjects(prevProjects => [...prevProjects, projectWithSessions]);
    }
}, [projects]);

  // Effect to save pendingProject when user authenticates
  useEffect(() => {
    if (user && pendingProject && !authLoading) {
      // User just authenticated and there's a pending project
      addProject(pendingProject);
      setPendingProject(null); // Clear pending project after saving
    }
  }, [user, pendingProject, authLoading, addProject]);

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
            atoms: p.atoms.slice(index * item.numAtoms, (index + 1) * item.numAtoms),
            numAtoms: item.numAtoms,
          }));

          return {
            ...p,
            learningPath: newLearningPath,
            sessions: newSessions,
            fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
            // Reset some stats as it's a new plan (keep bestStreak as it's a historical achievement)
            mastery: calculateMastery(p.atoms),
          };
        }
        return p;
      })
    );
  };

  const addSessionsToProject = (projectId: string, newSessions: Omit<Session, 'status' | 'session' | 'atoms'>[], insertAfterSession?: number) => {
      setProjects(prevProjects => {
          return prevProjects.map(p => {
              if (p.id === projectId) {
                  const existingSessions = [...p.sessions];
                  
                  if (insertAfterSession !== undefined && insertAfterSession >= 0) {
                      // Insert sessions at specific position (for dynamic adjustment)
                      const insertIndex = insertAfterSession + 1;
                      
                      // Create new sessions with fractional numbering for insertion
                      const formattedNewSessions: Session[] = newSessions.map((s, i) => {
                          const sessionNumber = insertAfterSession + 1 + (i * 0.1); // e.g., 3.1, 3.2, etc.
                          return {
                              ...s,
                              session: Math.round(sessionNumber * 10) / 10, // Round to 1 decimal place
                              status: 'Locked' as const,
                              atoms: p.atoms.filter(atom => 
                                  // Assign atoms that need reinforcement based on FSRS data
                                  atom.difficulty && atom.difficulty > 0.7 || 
                                  atom.retrievability && atom.retrievability <= 2
                              ).slice(0, 10) // Limit to 10 atoms per session
                          };
                      });
                      
                      // Insert the new sessions and renumber subsequent sessions
                      existingSessions.splice(insertIndex, 0, ...formattedNewSessions);
                      
                      // Renumber sessions after insertion to maintain sequence
                      const renumberedSessions = existingSessions.map((session, index) => ({
                          ...session,
                          session: index + 1
                      }));
                      
                      return { ...p, sessions: renumberedSessions };
                  } else {
                      // Default behavior: append to end
                      const nextSessionNumber = (existingSessions[existingSessions.length - 1]?.session || 0) + 1;
                      const formattedNewSessions: Session[] = newSessions.map((s, i) => ({
                          ...s,
                          session: nextSessionNumber + i,
                          status: 'Locked' as const,
                          atoms: []
                      }));
                      return { ...p, sessions: [...existingSessions, ...formattedNewSessions] };
                  }
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

  const deleteSource = (projectId: string, sourceIndex: number) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newSources = p.sources.filter((_, index) => index !== sourceIndex);
          return { ...p, sources: newSources };
        }
        return p;
      })
    );
  };
  
  const resetSessionStats = useCallback(() => {
    setSessionStreak(0);
    setCognitiveCredits(0);
    setMasteryPoints(0);
    setSessionAnswers([]);
  }, []);
  
 const completeSession = useCallback(async (projectId: string, sessionIndex: number) => {
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
    let isCompletedProject = false;

    const findAndPrepareUpdate = (p: Project) => {
        if (p.id === projectId) {
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
            const newMastery = calculateMastery(p.atoms);
            
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
    }

    setProjects(prevProjects => {
        const newProjects = prevProjects.map(findAndPrepareUpdate);
        projectToUpdate = newProjects.find(p => p.id === projectId);
        return newProjects;
    });

    setCompletedProjects(prevCompleted => {
        const newCompleted = prevCompleted.map(findAndPrepareUpdate);
        if (!projectToUpdate) {
            projectToUpdate = newCompleted.find(p => p.id === projectId);
            if (projectToUpdate) isCompletedProject = true;
        }
        return newCompleted;
    });
    
    // FSRS-based dynamic learning path adjustment
    if (projectToUpdate && sessionAnswers.length > 0) {
        try {
            const projectForAI = projectToUpdate;
            // Prepare FSRS data for LLM analysis
            const fsrsData = JSON.stringify({
                atoms: projectForAI.atoms.map((atom, index) => ({
                    index,
                    question: atom.question.substring(0, 100), // Truncate for token efficiency
                    difficulty: atom.difficulty || 0.3,
                    stability: atom.stability || 0,
                    retrievability: atom.retrievability || 1,
                    lastReviewed: atom.lastReviewed,
                    daysSinceLastReview: atom.lastReviewed 
                        ? differenceInDays(new Date(), new Date(atom.lastReviewed))
                        : 0
                })),
                currentSessionPerformance: {
                    correctAnswers: sessionAnswers.filter(a => a).length,
                    totalAnswers: sessionAnswers.length,
                    accuracy: sessionAnswers.length > 0 
                        ? (sessionAnswers.filter(a => a).length / sessionAnswers.length) * 100 
                        : 0,
                    sessionStreak
                }
            });

            const performanceHistory = JSON.stringify({
                totalAnswers: projectForAI.totalAnswers || 0,
                correctAnswers: projectForAI.correctAnswers || 0,
                bestStreak: projectForAI.bestStreak || 0,
                mastery: projectForAI.mastery || 0,
                lastSessionAccuracy: sessionAnswers.length > 0 
                    ? (sessionAnswers.filter(a => a).length / sessionAnswers.length) * 100 
                    : 0,
                performanceLog: (projectForAI.performanceLog || []).slice(-20), // Include last 20 performance records
            });

            const currentLearningPlan = JSON.stringify({
                sessions: projectForAI.sessions.map((s: Session) => ({
                    session: s.session,
                    type: s.type,
                    questions: s.questions,
                    status: s.status,
                    atomCount: s.atoms.length
                })),
                learningPath: projectForAI.learningPath
            });

            const tutorLog = JSON.stringify(projectForAI.tutorLog || []);

            // Call AI Strategic Tutor for plan adjustment
            const adjustment = await dynamicLearningPathAdjustment({
                fsrsData,
                performanceHistory,
                currentLearningPlan,
                tutorLog,
            });

            // Apply adjustments from the AI
            if (adjustment && projectToUpdate) {
                let newSessions = [...projectToUpdate.sessions];
                let projectAtoms = [...projectToUpdate.atoms];

                // 1. Remove sessions
                if (adjustment.adjustments.remove && adjustment.adjustments.remove.length > 0) {
                    const sessionsToRemove = new Set(adjustment.adjustments.remove);
                    newSessions = newSessions.filter(s => !sessionsToRemove.has(s.session));
                }

                // 2. Update sessions
                if (adjustment.adjustments.update && adjustment.adjustments.update.length > 0) {
                    adjustment.adjustments.update.forEach(update => {
                        const sessionIdx = newSessions.findIndex(s => s.session === update.session);
                        if (sessionIdx !== -1) {
                            newSessions[sessionIdx] = {
                                ...newSessions[sessionIdx],
                                type: update.type,
                                questions: update.questions,
                                duration: update.duration,
                            };
                        }
                    });
                }

                // 3. Add new sessions
                if (adjustment.adjustments.add && adjustment.adjustments.add.length > 0) {
                    const sessionsToAddPromises = adjustment.adjustments.add.map(async (add) => {
                        const weakAtoms = projectForAI.atoms
                            .filter(a => (a.retrievability || 4) <= 2 || (a.difficulty || 0) > 0.6)
                            .slice(0, add.numAtoms);

                        let atomsForSession = weakAtoms;
                        if (add.questions === "Opción Múltiple") {
                            atomsForSession = await Promise.all(weakAtoms.map(async (atom) => {
                                try {
                                    const result = await generateDistractors({ question: atom.question, answer: atom.answer, count: 3 });
                                    const projectAtomIndex = projectAtoms.findIndex(pAtom => pAtom.question === atom.question);
                                    if (projectAtomIndex !== -1) {
                                        projectAtoms[projectAtomIndex] = { ...projectAtoms[projectAtomIndex], incorrectAnswers: result.distractors };
                                    }
                                    return { ...atom, incorrectAnswers: result.distractors };
                                } catch (error) {
                                    console.error("Failed to generate distractors for new session atom:", atom.question, error);
                                    return atom;
                                }
                            }));
                        } else if (add.questions === "Ordenamiento") {
                            atomsForSession = await Promise.all(weakAtoms.map(async (atom) => {
                                try {
                                    const result = await generateOrderingQuestion({ context: atom.answer });
                                    if (result) {
                                        const projectAtomIndex = projectAtoms.findIndex(pAtom => pAtom.question === atom.question);
                                        if (projectAtomIndex !== -1) {
                                            projectAtoms[projectAtomIndex] = { ...projectAtoms[projectAtomIndex], orderingItems: result.items, correctOrder: result.correctOrder };
                                        }
                                        return { ...atom, orderingItems: result.items, correctOrder: result.correctOrder };
                                    }
                                    return atom;
                                } catch (error) {
                                    console.error("Failed to generate ordering question for new session atom:", atom.question, error);
                                    return atom;
                                }
                            }));
                        }

                        return {
                            session: 0, // Temporary
                            type: add.type,
                            questions: add.questions,
                            duration: add.duration,
                            status: 'Locked',
                            atoms: atomsForSession,
                            numAtoms: add.numAtoms,
                        } as Session;
                    });

                    const sessionsToAdd = await Promise.all(sessionsToAddPromises);

                    const insertIndex = newSessions.findIndex(s => s.session > sessionIndex);
                    if (insertIndex !== -1) {
                        newSessions.splice(insertIndex, 0, ...sessionsToAdd);
                    } else {
                        newSessions.push(...sessionsToAdd);
                    }
                }
                
                newSessions = newSessions.map((session, index) => ({
                    ...session,
                    session: index + 1,
                }));

                const finalProjectUpdate = {
                    ...projectToUpdate,
                    atoms: projectAtoms,
                    sessions: newSessions,
                    tutorLog: [
                        ...(projectToUpdate.tutorLog || []),
                        {
                            date: new Date().toISOString(),
                            sessionCompleted: sessionIndex + 1,
                            feedback: adjustment.feedback,
                            reasoning: adjustment.reasoning,
                            adjustments: adjustment.adjustments,
                        }
                    ]
                };

                if (isCompletedProject) {
                    setCompletedProjects(prev => prev.map(p => p.id === projectId ? finalProjectUpdate : p));
                } else {
                    setProjects(prev => prev.map(p => p.id === projectId ? finalProjectUpdate : p));
                }
                projectToUpdate = finalProjectUpdate;
            }
        } catch (error) {
            console.error("Error during dynamic learning path adjustment:", error);
        }
    }
    
    // Only complete project if mastery >= 95 AND all sessions are actually completed
    // Do not allow completion if there are pending reinforcement sessions
    const allSessionsCompleted = projectToUpdate?.sessions.every(s => s.status === 'Completed') || false;
    const hasHighMastery = (projectToUpdate?.mastery || 0) >= 95;
    
    if (projectToUpdate && !isCompletedProject && hasHighMastery && allSessionsCompleted) {
        console.log(`Project ${projectId} completed with ${projectToUpdate.mastery}% mastery`);
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setCompletedProjects(prev => [...prev, projectToUpdate!]);
    } else if (projectToUpdate && !isCompletedProject) {
        console.log(`Project ${projectId} not ready for completion: mastery=${projectToUpdate.mastery}%, allSessionsCompleted=${allSessionsCompleted}`);
    }

    resetSessionStats();

}, [lastSessionCompletedDate, cognitiveCredits, sessionAnswers, sessionStreak, resetSessionStats, setProjects, setCompletedProjects, setDailyStreak, setGlobalCognitiveCredits, setLastSessionCompletedDate]);


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

  const recordAnswer = useCallback((projectId: string, atomIndex: number, fsrsRating: 1|2|3|4, isCorrect: boolean, responseTime: number, aidsUsed: string[]) => {
    setSessionAnswers(prev => [...prev, isCorrect]);
    
    const today = new Date().toISOString();

    const updateAtomInProject = (project: Project): Project => {
        if (project.id !== projectId) return project;

        const atom = project.atoms[atomIndex];
        if (!atom) return project;

        // Add to performance log
        const newPerformanceRecord: PerformanceRecord = {
            question: atom.question,
            timestamp: today,
            responseTime,
            rating: fsrsRating,
            isCorrect,
            aidsUsed,
        };
        const updatedPerformanceLog = [...(project.performanceLog || []), newPerformanceRecord];

        const oldDifficulty = atom.difficulty || 0.3; // Default starting difficulty
        const oldStability = atom.stability || 0; // 0 for new cards

        // 1. Calculate retrievability for this review
        const daysSinceLastReview = atom.lastReviewed ? differenceInDays(new Date(), new Date(atom.lastReviewed)) : 0;
        const retrievability = calculateCurrentRetrievability(oldStability, daysSinceLastReview);

        // 2. Update difficulty
        const newDifficulty = oldDifficulty + FSRS_WEIGHTS[6] * (fsrsRating - 3);
        const clampedDifficulty = Math.max(0, Math.min(1, newDifficulty));

        // 3. Update stability
        let newStability;
        if (oldStability === 0) {
            // Initial stability for new cards based on FSRS algorithm
            const initialStabilityMap = {1: 0.4, 2: 1.0, 3: 2.5, 4: 4.0}; // Days
            newStability = initialStabilityMap[fsrsRating as keyof typeof initialStabilityMap];
        } else if (fsrsRating === 1) { // Again
            newStability = FSRS_WEIGHTS[7] * Math.pow(oldStability, FSRS_WEIGHTS[8]) * Math.exp(FSRS_WEIGHTS[9] * (1 - retrievability));
        } else { // Hard, Good, Easy
            const difficultyFactor = Math.pow(FSRS_WEIGHTS[4], -clampedDifficulty);
            newStability = oldStability * (1 + FSRS_WEIGHTS[2] * difficultyFactor * (1-retrievability) * Math.exp(FSRS_WEIGHTS[3] * (1 - retrievability)));
        }
        
        const newAtoms = [...project.atoms];
        newAtoms[atomIndex] = {
            ...atom,
            difficulty: clampedDifficulty,
            stability: newStability,
            lastReviewed: today,
            retrievability: fsrsRating, // Store the user's direct rating
        };

        const newMastery = calculateMastery(newAtoms);
        return { ...project, atoms: newAtoms, mastery: newMastery, performanceLog: updatedPerformanceLog };
    };

    setProjects(prev => prev.map(updateAtomInProject));
    setCompletedProjects(prev => prev.map(updateAtomInProject));
    
    if (isCorrect) {
      setSessionStreak(prev => prev + 1);
      setCognitiveCredits(prev => prev + (aidsUsed.length > 0 ? 1 : 2));
    } else {
      setSessionStreak(0);
    }
    
    let newMasteryPoints = 0;
    switch (fsrsRating) {
        case 1: newMasteryPoints = 5; break; // Muy Difícil
        case 2: newMasteryPoints = 10; break; // Difícil
        case 3: newMasteryPoints = 15; break; // Bien
        case 4: newMasteryPoints = 20; break; // Fácil
    }
    setMasteryPoints(prev => prev + newMasteryPoints);
    setTotalMasteryPoints(prev => prev + newMasteryPoints);
  }, []);

  
  const exchangeCreditsForEnergy = (credits: number, energyAmount: number): boolean => {
      if (globalCognitiveCredits >= credits) {
          setGlobalCognitiveCredits(prev => prev - credits);
          setEnergy(prev => prev + energyAmount);
          return true;
      }
      return false;
  }

  const handleSetPendingProject = useCallback((project: Project) => {
      // Create sessions for the pending project similar to addProject
      const atoms = [...project.atoms];
      const sessions: Session[] = project.learningPath.map((item, index) => {
          const sessionAtoms = atoms.slice(index * item.numAtoms, (index + 1) * item.numAtoms);
          return {
              session: item.session,
              type: item.sessionType,
              questions: item.questions,
              duration: '20 min',
              status: index === 0 ? 'Continue' : 'Locked',
              atoms: sessionAtoms,
              numAtoms: item.numAtoms,
          };
      });

      const projectWithSessions: Project = {
          ...project,
          sessions: sessions,
      };
      
      setPendingProject(projectWithSessions);
  }, []);
  
  return (
    <ProjectContext.Provider value={{ 
        projects, completedProjects, archivedProjects, addProject, updateProjectIcon, updateProjectDetails, updateProjectPlan, addSessionsToProject, 
        addAtomsToProject, updateAtom, deleteAtom, deleteSource, completeSession, archiveProject, unarchiveProject, deleteProjectPermanently, toggleProjectPublic,
        energy, sessionStreak, dailyStreak, cognitiveCredits, globalCognitiveCredits, masteryPoints, totalMasteryPoints,
        updateEnergy, recordAnswer, resetSessionStats, exchangeCreditsForEnergy, nextEnergyIn, sessionAnswers,
        isAuthenticated, currentUser, login, signup, logout, updateUserProfile,
        learnerRankInfo, isLoading, setPendingProject: handleSetPendingProject, pendingProject
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
