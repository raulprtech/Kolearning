"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CalibratePlanOutput } from '@/ai/flows/koli-calibrate-plan';
import { dynamicLearningPathAdjustment } from '@/ai/flows/koli-strategic-tutor';
import { differenceInDays, addDays } from 'date-fns';
import { useAuth } from './AuthContext';
import { ProjectDatabase } from '@/lib/supabase/database';
import { migrateLocalStorageToSupabase, hasLocalStorageData } from '@/lib/migrate-localStorage';

// Type definitions
export type Atom = {
  question: string;
  answer: string;
  // FSRS Metrics
  difficulty?: number; // How hard is this to learn? (0-1)
  stability?: number; // How long will you remember this? (in days)
  lastReviewed?: string; // ISO date string
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
  addProject: (project: Project) => Promise<void>;
  updateProjectIcon: (projectId: string, icon: string) => Promise<void>;
  updateProjectDetails: (projectId: string, title: string, description: string) => Promise<void>;
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
  recordAnswer: (projectId: string, atomIndex: number, fsrs: 1|2|3|4, aidsUsed: boolean, isCorrect: boolean) => void;
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
  // New Supabase-specific methods
  migrateFromLocalStorage: () => Promise<{ success: boolean; migratedProjects: number; errors: string[]; }>;
  hasLocalData: boolean;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Utility functions
const calculateCurrentRetrievability = (stability: number, daysSinceLastReview: number): number => {
  return Math.pow(0.9, daysSinceLastReview / stability);
};

const calculateMastery = (atoms: Atom[]): number => {
  if (atoms.length === 0) {
    return 0;
  }

  const studiedAtoms = atoms.filter(atom => atom.lastReviewed && atom.stability);
  
  if (studiedAtoms.length === 0) {
    return 0;
  }

  const totalRetrievability = studiedAtoms.reduce((sum, atom) => {
    const daysSince = differenceInDays(new Date(), new Date(atom.lastReviewed!));
    const retrievability = calculateCurrentRetrievability(atom.stability!, daysSince);
    return sum + retrievability;
  }, 0);

  const averageRetrievability = totalRetrievability / studiedAtoms.length;
  const coverage = studiedAtoms.length / atoms.length;
  const masteryScore = (averageRetrievability * coverage) * 100;
  
  return Math.round(masteryScore);
};

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
        nextRank = { name: "S", minPoints: Infinity };
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
};

const initialProjects: Project[] = [];

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [energy, setEnergy] = useState(10);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [cognitiveCredits, setCognitiveCredits] = useState(0);
  const [globalCognitiveCredits, setGlobalCognitiveCredits] = useState(500);
  const [masteryPoints, setMasteryPoints] = useState(0);
  const [totalMasteryPoints, setTotalMasteryPoints] = useState(170);
  const [lastSessionCompletedDate, setLastSessionCompletedDate] = useState<Date | null>(null);
  const [nextEnergyTimestamp, setNextEnergyTimestamp] = useState<number | null>(null);
  const [nextEnergyIn, setNextEnergyIn] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<boolean[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocalData, setHasLocalData] = useState(false);

  // Auth context
  const { user, profile, loading: authLoading } = useAuth();
  const projectDb = new ProjectDatabase();

  // Check for localStorage data on mount
  useEffect(() => {
    setHasLocalData(hasLocalStorageData());
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      loadUserData();
    } else {
      loadFallbackData();
    }
  }, [user, authLoading]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [userProjects, userCompletedProjects, userArchivedProjects] = await Promise.all([
        projectDb.getProjects(user.id),
        projectDb.getCompletedProjects(user.id),
        projectDb.getArchivedProjects(user.id),
      ]);

      setProjects(userProjects);
      setCompletedProjects(userCompletedProjects);
      setArchivedProjects(userArchivedProjects);

      if (profile) {
        setTotalMasteryPoints(profile.total_mastery_points);
        setGlobalCognitiveCredits(profile.global_cognitive_credits);
        setDailyStreak(profile.daily_streak);
      }

    } catch (error) {
      console.error('Error loading user data from Supabase:', error);
      loadFallbackData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackData = () => {
    try {
      const storedProjects = localStorage.getItem('kolearning_projects');
      const storedCompleted = localStorage.getItem('kolearning_completed_projects');
      const storedArchived = localStorage.getItem('kolearning_archived_projects');

      setProjects(storedProjects ? JSON.parse(storedProjects) : initialProjects);
      if (storedCompleted) setCompletedProjects(JSON.parse(storedCompleted));
      if (storedArchived) setArchivedProjects(JSON.parse(storedArchived));
      
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setProjects(initialProjects);
    } finally {
      setIsLoading(false);
    }
  };

  const migrateFromLocalStorage = async () => {
    if (!user) {
      throw new Error('User must be authenticated to migrate data');
    }

    try {
      setIsLoading(true);
      const result = await migrateLocalStorageToSupabase();
      
      if (result.success) {
        await loadUserData();
        setHasLocalData(false);
      }
      
      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addProject = useCallback(async (projectToAdd: Project) => {
    if (user) {
      try {
        await projectDb.createProject(user.id, projectToAdd);
        await loadUserData();
      } catch (error) {
        console.error('Failed to create project in Supabase:', error);
        setProjects(prev => [...prev, { ...projectToAdd, id: `temp-${Date.now()}` }]);
      }
    } else {
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
    }
  }, [projects, user, projectDb]);

  const updateProjectIcon = useCallback(async (projectId: string, icon: string) => {
    if (user) {
      try {
        await projectDb.updateProject(projectId, { icon });
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, icon } : p));
      } catch (error) {
        console.error('Failed to update project icon in Supabase:', error);
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, icon } : p));
      }
    } else {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, icon } : p));
    }
  }, [user, projectDb]);

  const updateProjectDetails = useCallback(async (projectId: string, title: string, description: string) => {
    if (user) {
      try {
        await projectDb.updateProject(projectId, { title, description });
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, title, description } : p));
      } catch (error) {
        console.error('Failed to update project in Supabase:', error);
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, title, description } : p));
      }
    } else {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, title, description } : p));
    }
  }, [user, projectDb]);

  const updateProjectPlan = useCallback((projectId: string, plan: CalibratePlanOutput) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newLearningPath = plan.learningPath.flatMap(day => day.sessions);
          const newSessions: Session[] = newLearningPath.map((item, index) => ({
            session: item.session,
            type: item.sessionType,
            questions: item.questions,
            duration: '20 min',
            status: index === 0 ? 'Continue' : 'Locked',
            atoms: p.atoms.slice(index * 10, (index + 1) * 10),
          }));
          return {
            ...p,
            learningPath: newLearningPath,
            sessions: newSessions,
            fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
            mastery: calculateMastery(p.atoms),
          };
        }
        return p;
      })
    );
  }, []);

  const addSessionsToProject = useCallback((projectId: string, newSessions: Omit<Session, 'status' | 'session' | 'atoms'>[], insertAfterSession?: number) => {
    setProjects(prevProjects => {
      return prevProjects.map(p => {
        if (p.id === projectId) {
          const existingSessions = [...p.sessions];
          
          if (insertAfterSession !== undefined && insertAfterSession >= 0) {
            const insertIndex = insertAfterSession + 1;
            
            const formattedNewSessions: Session[] = newSessions.map((s, i) => {
              const sessionNumber = insertAfterSession + 1 + (i * 0.1);
              return {
                ...s,
                session: Math.round(sessionNumber * 10) / 10,
                status: 'Locked' as const,
                atoms: p.atoms.filter(atom => 
                  (atom.difficulty && atom.difficulty > 0.7) || 
                  (atom.retrievability && atom.retrievability <= 2)
                ).slice(0, 10)
              };
            });
            
            existingSessions.splice(insertIndex, 0, ...formattedNewSessions);
            
            const renumberedSessions = existingSessions.map((session, index) => ({
              ...session,
              session: index + 1
            }));
            
            return { ...p, sessions: renumberedSessions };
          } else {
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
  }, []);

  const addAtomsToProject = useCallback((projectId: string, newAtoms: Atom[]) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const uniqueNewAtoms = newAtoms.filter(newAtom => 
            !p.atoms.some(existingAtom => existingAtom.question === newAtom.question)
          );
          return { ...p, atoms: [...p.atoms, ...uniqueNewAtoms] };
        }
        return p;
      })
    );
  }, []);

  const updateAtom = useCallback((projectId: string, atomIndex: number, updatedAtom: Atom) => {
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
  }, []);

  const deleteAtom = useCallback((projectId: string, atomIndex: number) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newAtoms = p.atoms.filter((_, index) => index !== atomIndex);
          return { ...p, atoms: newAtoms };
        }
        return p;
      })
    );
  }, []);

  const deleteSource = useCallback((projectId: string, sourceIndex: number) => {
    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newSources = p.sources.filter((_, index) => index !== sourceIndex);
          return { ...p, sources: newSources };
        }
        return p;
      })
    );
  }, []);

  const resetSessionStats = useCallback(() => {
    setSessionStreak(0);
    setCognitiveCredits(0);
    setMasteryPoints(0);
    setSessionAnswers([]);
  }, []);

  const completeSession = useCallback(async (projectId: string, sessionIndex: number) => {
    setGlobalCognitiveCredits(prev => prev + cognitiveCredits);

    let projectToUpdate: Project | undefined;
    let isCompletedProject = false;

    const updateLogic = (p: Project) => {
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
        
        projectToUpdate = { 
          ...p, 
          sessions: updatedSessions,
          totalAnswers: newTotalAnswers,
          correctAnswers: newCorrectAnswers,
          bestStreak: newBestStreak,
          mastery: newMastery,
        };
        return projectToUpdate;
      }
      return p;
    };

    setProjects(prevProjects => prevProjects.map(updateLogic));
    setCompletedProjects(prevCompleted => {
      const updatedCompleted = prevCompleted.map(updateLogic);
      if (updatedCompleted.some(p => p.id === projectId)) {
        isCompletedProject = true;
      }
      return updatedCompleted;
    });
    
    if (projectToUpdate && sessionAnswers.length > 0) {
      try {
        const fsrsData = JSON.stringify({
          atoms: projectToUpdate.atoms.map((atom, index) => ({
            index,
            question: atom.question.substring(0, 100),
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
          totalAnswers: projectToUpdate.totalAnswers || 0,
          correctAnswers: projectToUpdate.correctAnswers || 0,
          bestStreak: projectToUpdate.bestStreak || 0,
          mastery: projectToUpdate.mastery || 0,
          lastSessionAccuracy: sessionAnswers.length > 0 
            ? (sessionAnswers.filter(a => a).length / sessionAnswers.length) * 100 
            : 0
        });

        const currentLearningPlan = JSON.stringify({
          sessions: projectToUpdate.sessions.map(s => ({
            session: s.session,
            type: s.type,
            questions: s.questions,
            status: s.status,
            atomCount: s.atoms.length
          })),
          learningPath: projectToUpdate.learningPath
        });

        const adjustment = await dynamicLearningPathAdjustment({
          fsrsData,
          performanceHistory,
          currentLearningPlan,
          tutorLog: ''
        });

        if (adjustment.adjustments.add && adjustment.adjustments.add.length > 0) {
          console.log(`AI Strategic Tutor recommended ${adjustment.adjustments.add.length} additional sessions:`, adjustment.feedback);
          
          const newSessionsToAdd = adjustment.adjustments.add.map((newSession) => ({
            type: newSession.type,
            questions: newSession.questions,
            duration: newSession.duration
          }));

          addSessionsToProject(projectId, newSessionsToAdd, sessionIndex);
        }
      } catch (error) {
        console.error("Error during dynamic learning path adjustment:", error);
      }
    }
    
    if (projectToUpdate && !isCompletedProject && projectToUpdate.sessions.every(s => s.status === 'Completed' || s.type === "Refuerzo de Dominio")) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setCompletedProjects(prev => [...prev, projectToUpdate!]);
    }

    resetSessionStats();
  }, [cognitiveCredits, sessionAnswers, sessionStreak, addSessionsToProject, resetSessionStats]);

  const archiveProject = useCallback((projectId: string): boolean => {
    const MAX_ARCHIVED_PROJECTS = 5;
    if (archivedProjects.length >= MAX_ARCHIVED_PROJECTS) {
      return false;
    }
    const projectToArchive = projects.find(p => p.id === projectId);
    if (projectToArchive) {
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      setArchivedProjects(prevArchived => [...prevArchived, projectToArchive]);
    }
    return true;
  }, [projects, archivedProjects]);

  const unarchiveProject = useCallback((projectId: string) => {
    const projectToUnarchive = archivedProjects.find(p => p.id === projectId);
    if (projectToUnarchive) {
      setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
      setProjects(prev => [...prev, projectToUnarchive]);
    }
  }, [archivedProjects]);

  const deleteProjectPermanently = useCallback((projectId: string) => {
    setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  const toggleProjectPublic = useCallback((projectId: string, isPublic: boolean) => {
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, isPublic } : p))
    );
  }, []);

  const updateEnergy = useCallback((amount: number) => {
    setEnergy(prev => Math.max(0, prev + amount));
  }, []);

  const recordAnswer = useCallback((projectId: string, atomIndex: number, fsrsRating: 1|2|3|4, aidsUsed: boolean, isCorrect: boolean) => {
    setSessionAnswers(prev => [...prev, isCorrect]);
    
    const today = new Date().toISOString();
    const FSRS_WEIGHTS = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

    const updateAtomInProject = (project: Project): Project => {
      if (project.id !== projectId) return project;

      const atom = project.atoms[atomIndex];
      if (!atom) return project;

      const oldDifficulty = atom.difficulty || 0.3;
      const oldStability = atom.stability || 0;

      const daysSinceLastReview = atom.lastReviewed ? differenceInDays(new Date(), new Date(atom.lastReviewed)) : 0;
      const retrievability = calculateCurrentRetrievability(oldStability, daysSinceLastReview);

      const newDifficulty = oldDifficulty + FSRS_WEIGHTS[6] * (fsrsRating - 3);
      const clampedDifficulty = Math.max(0, Math.min(1, newDifficulty));

      let newStability;
      if (oldStability === 0) {
        const initialStabilityMap = {1: 0.4, 2: 1.0, 3: 2.5, 4: 4.0};
        newStability = initialStabilityMap[fsrsRating as keyof typeof initialStabilityMap];
      } else if (fsrsRating === 1) {
        newStability = FSRS_WEIGHTS[7] * Math.pow(oldStability, FSRS_WEIGHTS[8]) * Math.exp(FSRS_WEIGHTS[9] * (1 - retrievability));
      } else {
        const difficultyFactor = Math.pow(FSRS_WEIGHTS[4], -clampedDifficulty);
        newStability = oldStability * (1 + FSRS_WEIGHTS[2] * difficultyFactor * (1-retrievability) * Math.exp(FSRS_WEIGHTS[3] * (1 - retrievability)));
      }
      
      const newAtoms = [...project.atoms];
      newAtoms[atomIndex] = {
        ...atom,
        difficulty: clampedDifficulty,
        stability: newStability,
        lastReviewed: today,
        retrievability: fsrsRating,
      };

      const newMastery = calculateMastery(newAtoms);
      return { ...project, atoms: newAtoms, mastery: newMastery };
    };

    setProjects(prev => prev.map(updateAtomInProject));
    setCompletedProjects(prev => prev.map(updateAtomInProject));
    
    if (isCorrect) {
      setSessionStreak(prev => prev + 1);
      setCognitiveCredits(prev => prev + (aidsUsed ? 1 : 2));
    } else {
      setSessionStreak(0);
    }
    
    let newMasteryPoints = 0;
    switch (fsrsRating) {
      case 1: newMasteryPoints = 5; break;
      case 2: newMasteryPoints = 10; break;
      case 3: newMasteryPoints = 15; break;
      case 4: newMasteryPoints = 20; break;
    }
    setMasteryPoints(prev => prev + newMasteryPoints);
    setTotalMasteryPoints(prev => prev + newMasteryPoints);
  }, []);

  const exchangeCreditsForEnergy = useCallback((credits: number, energyAmount: number): boolean => {
    if (globalCognitiveCredits >= credits) {
      setGlobalCognitiveCredits(prev => prev - credits);
      setEnergy(prev => prev + energyAmount);
      return true;
    }
    return false;
  }, [globalCognitiveCredits]);

  // Utility functions
  const learnerRankInfo = getLearnerRank(totalMasteryPoints);

  // Authentication methods - these will be deprecated in favor of AuthContext
  const isAuthenticated = !!user;
  const currentUser = profile ? {
    name: profile.name,
    email: user?.email || '',
    profession: profile.profession || undefined,
    company: profile.company || undefined,
    age: profile.age || undefined,
    additionalInfo: profile.additional_info || undefined,
  } : null;

  const login = () => false; // Deprecated - use AuthContext
  const signup = () => false; // Deprecated - use AuthContext
  const logout = () => {}; // Deprecated - use AuthContext
  const updateUserProfile = () => false; // Deprecated - use AuthContext

  const value = {
    projects,
    completedProjects,
    archivedProjects,
    addProject,
    updateProjectIcon,
    updateProjectDetails,
    updateProjectPlan,
    addSessionsToProject,
    addAtomsToProject,
    updateAtom,
    deleteAtom,
    deleteSource,
    completeSession,
    archiveProject,
    unarchiveProject,
    deleteProjectPermanently,
    toggleProjectPublic,
    energy,
    sessionStreak,
    dailyStreak,
    cognitiveCredits,
    globalCognitiveCredits,
    masteryPoints,
    totalMasteryPoints,
    updateEnergy,
    recordAnswer,
    resetSessionStats,
    exchangeCreditsForEnergy,
    nextEnergyIn,
    sessionAnswers,
    isAuthenticated,
    currentUser,
    login,
    signup,
    logout,
    updateUserProfile,
    learnerRankInfo,
    isLoading,
    migrateFromLocalStorage,
    hasLocalData,
  };

  return (
    <ProjectContext.Provider value={value}>
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