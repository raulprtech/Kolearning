"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CalibratePlanOutput } from '@/ai/flows/koli-calibrate-plan';
import { dynamicLearningPathAdjustment } from '@/ai/flows/koli-strategic-tutor';
import { differenceInDays, addDays } from 'date-fns';
import { useAuth } from './AuthContext';
import { ProjectDatabase } from '@/lib/supabase/database';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

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
  phase?: 'calibration' | 'incursion' | 'reinforcement' | 'mastery';
  zettelkastenNote?: string;
  dependencies?: string[];
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
  phase?: 'calibration' | 'incursion' | 'reinforcement' | 'mastery';
  questionFormats?: string;
}

export type LearningPathItem = {
  session: number;
  topic: string;
  sessionType: string;
  questions: string; // Added from CalibratePlanOutput
  phase?: 'calibration' | 'incursion' | 'reinforcement' | 'mastery';
  questionFormats?: string;
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
  addSessionsToProject: (projectId: string, newSessions: Omit<Session, 'status' | 'session' | 'atoms'>[], insertAfterSession?: number) => Promise<void>;
  addAtomsToProject: (projectId: string, newAtoms: Atom[]) => Promise<void>;
  updateAtom: (projectId: string, atomIndex: number, updatedAtom: Atom) => void;
  deleteAtom: (projectId: string, atomIndex: number) => void;
  deleteSource: (projectId: string, sourceIndex: number) => void;
  completeSession: (projectId: string, sessionIndex: number) => Promise<void>;
  archiveProject: (projectId: string) => Promise<boolean>;
  unarchiveProject: (projectId: string) => Promise<void>;
  deleteProjectPermanently: (projectId: string) => Promise<void>;
  toggleProjectPublic: (projectId: string, isPublic: boolean) => void;
  energy: number;
  sessionStreak: number;
  dailyStreak: number;
  cognitiveCredits: number;
  globalCognitiveCredits: number;
  masteryPoints: number;
  totalMasteryPoints: number;
  updateEnergy: (amount: number) => void;
  recordAnswer: (projectId: string, atomIndex: number, fsrs: 1 | 2 | 3 | 4, aidsUsed: boolean, isCorrect: boolean) => void;
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

  // Auth context
  const { user, profile, loading: authLoading } = useAuth();
  const projectDb = new ProjectDatabase();
  const { toast } = useToast();

  // Load data when user changes
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      loadUserData();
    } else {
      loadFallbackData();
    }
  }, [user, authLoading]);

  // Sync data when window regains focus (for multi-browser/tab sync)
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      console.log('[Sync] Window focused, reloading data from Supabase');
      loadUserData();
    };

    // Reload when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('[Sync] Tab visible, reloading data from Supabase');
        loadUserData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Realtime subscription for instant sync across browsers/tabs
  useEffect(() => {
    if (!user) return;

    console.log('[Realtime] Setting up Supabase Realtime subscriptions');
    const supabase = createClient();

    // Subscribe to changes in projects table
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Realtime] Projects table change detected:', payload);
          // Reload all data when any project changes
          loadUserData();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Cleaning up subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadUserData = async () => {
    if (!user) {
      console.warn('[LoadData] No user found, skipping load');
      return;
    }

    console.log('[LoadData] Loading data for user:', user.id);
    setIsLoading(true);
    try {
      const [userProjects, userCompletedProjects, userArchivedProjects] = await Promise.all([
        projectDb.getProjects(user.id),
        projectDb.getCompletedProjects(user.id),
        projectDb.getArchivedProjects(user.id),
      ]);

      console.log('[LoadData] Loaded from Supabase:', {
        projects: userProjects.length,
        completed: userCompletedProjects.length,
        archived: userArchivedProjects.length,
      });

      setProjects(userProjects);
      setCompletedProjects(userCompletedProjects);
      setArchivedProjects(userArchivedProjects);

      if (profile) {
        setTotalMasteryPoints(profile.total_mastery_points);
        setGlobalCognitiveCredits(profile.global_cognitive_credits);
        setDailyStreak(profile.daily_streak);
      }

    } catch (error) {
      console.error('[LoadData] Error loading user data from Supabase:', error);
      loadFallbackData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackData = () => {
    try {
      const storedProjects = localStorage.getItem('learningbox_projects');
      const storedCompleted = localStorage.getItem('learningbox_completed_projects');
      const storedArchived = localStorage.getItem('learningbox_archived_projects');

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

  const addProject = useCallback(async (projectToAdd: Project) => {
    console.log('[AddProject] Adding project:', {
      title: projectToAdd.title,
      hasUser: !!user,
      userId: user?.id,
      atomsCount: projectToAdd.atoms.length,
      sessionsCount: projectToAdd.sessions?.length || 0,
    });

    if (user) {
      try {
        console.log('[AddProject] Creating project in Supabase for user:', user.id);
        const projectId = await projectDb.createProject(user.id, projectToAdd);
        console.log('[AddProject] ✅ Project created with ID:', projectId);

        console.log('[AddProject] Reloading user data...');
        await loadUserData();
        console.log('[AddProject] ✅ User data reloaded');
      } catch (error) {
        console.error('[AddProject] ❌ Failed to create project in Supabase:', error);
        setProjects(prev => [...prev, { ...projectToAdd, id: `temp-${Date.now()}` }]);
      }
    } else {
      console.log('[AddProject] No user, saving to localStorage only');
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

  const updateProjectPlan = useCallback(async (projectId: string, plan: CalibratePlanOutput) => {
    const updatedProjectFields = {
      learningPath: plan.learningPath.flatMap(day => day.sessions),
      fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
      // We need to calculate sessions and mastery based on existing project data
    };

    let sessions: Session[] = [];
    let mastery = 0;

    // First, update the local state to get the new sessions and mastery
    setProjects(prevProjects => {
      const newProjects = prevProjects.map(p => {
        if (p.id === projectId) {
          const newLearningPath = plan.learningPath.flatMap(day => day.sessions);
          sessions = newLearningPath.map((item, index) => ({
            session: item.session,
            type: item.sessionType,
            questions: item.questions,
            duration: '20 min',
            status: index === 0 ? 'Continue' : 'Locked',
            atoms: p.atoms.slice(index * 10, (index + 1) * 10),
          }));
          mastery = calculateMastery(p.atoms);
          return {
            ...p,
            learningPath: newLearningPath,
            sessions: sessions,
            fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
            mastery: mastery,
          };
        }
        return p;
      });
      return newProjects;
    });

    // Persist to Supabase (if user is logged in)
    if (user && projectDb) {
      try {
        await projectDb.updateProject(projectId, {
          fullLearningPlanMarkdown: plan.fullLearningPlanMarkdown,
          mastery: mastery,
        } as any);

        const newLearningPath = plan.learningPath.flatMap(day => day.sessions);
        await projectDb.updateLearningPathAndSessions(projectId, newLearningPath, sessions);
        console.log('✅ Project plan synchronized to Supabase');

        console.log(`Project plan for ${projectId} successfully updated in Supabase.`);
      } catch (error) {
        console.error('Failed to update project plan in Supabase:', error);
        // Optionally, revert local state changes here if the DB update fails
        toast({
          title: "Error de Sincronización",
          description: "No se pudo guardar el nuevo plan en la nube. Los cambios son locales.",
          variant: "destructive",
        });
      }
    }
  }, [user, projectDb, toast]);

  const addSessionsToProject = useCallback(async (projectId: string, newSessions: Omit<Session, 'status' | 'session' | 'atoms'>[], insertAfterSession?: number) => {
    let allSessions: Session[] = [];

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

            allSessions = renumberedSessions;
            return { ...p, sessions: renumberedSessions };
          } else {
            const nextSessionNumber = (existingSessions[existingSessions.length - 1]?.session || 0) + 1;
            const formattedNewSessions: Session[] = newSessions.map((s, i) => ({
              ...s,
              session: nextSessionNumber + i,
              status: 'Locked' as const,
              atoms: []
            }));
            allSessions = [...existingSessions, ...formattedNewSessions];
            return { ...p, sessions: allSessions };
          }
        }
        return p;
      });
    });

    // Sync to Supabase - need to replace all sessions
    if (user && projectDb && allSessions.length > 0) {
      try {
        // For simplicity, we'll use updateLearningPathAndSessions which replaces all sessions
        // In a production app, you might want a more granular approach
        const learningPath = allSessions.map(s => ({
          session: s.session,
          topic: '', // These would need to be preserved or reconstructed
          sessionType: s.type,
          questions: s.questions
        }));
        await projectDb.updateLearningPathAndSessions(projectId, learningPath, allSessions);
        console.log(`✅ Added sessions to Supabase`);
      } catch (error) {
        console.error('❌ Failed to add sessions to Supabase:', error);
        toast({
          title: "Error de Sincronización",
          description: "No se pudieron guardar las nuevas sesiones en la nube.",
          variant: "destructive",
        });
      }
    }
  }, [user, projectDb, toast]);

  const addAtomsToProject = useCallback(async (projectId: string, newAtoms: Atom[]) => {
    // Filter unique atoms first
    let uniqueNewAtoms: Atom[] = [];

    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          uniqueNewAtoms = newAtoms.filter(newAtom =>
            !p.atoms.some(existingAtom => existingAtom.question === newAtom.question)
          );
          return { ...p, atoms: [...p.atoms, ...uniqueNewAtoms] };
        }
        return p;
      })
    );

    // Sync to Supabase
    if (user && projectDb && uniqueNewAtoms.length > 0) {
      try {
        await projectDb.addAtoms(projectId, uniqueNewAtoms);
        console.log(`✅ Added ${uniqueNewAtoms.length} atoms to Supabase`);
      } catch (error) {
        console.error('❌ Failed to add atoms to Supabase:', error);
        toast({
          title: "Error de Sincronización",
          description: "No se pudieron guardar los nuevos átomos en la nube.",
          variant: "destructive",
        });
      }
    }
  }, [user, projectDb, toast]);

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

      // Mark as completed in Supabase
      if (user && projectDb) {
        try {
          await projectDb.completeProject(projectId);
          console.log(`✅ Project ${projectId} marked as completed in Supabase`);
        } catch (error) {
          console.error('❌ Failed to mark project as completed in Supabase:', error);
        }
      }
    }

    // Sync session completion and project stats to Supabase
    if (user && projectDb && projectToUpdate) {
      try {
        await projectDb.updateProject(projectId, {
          totalAnswers: projectToUpdate.totalAnswers,
          correctAnswers: projectToUpdate.correctAnswers,
          bestStreak: projectToUpdate.bestStreak,
          mastery: projectToUpdate.mastery,
        } as any);

        // Update sessions status
        await projectDb.updateLearningPathAndSessions(
          projectId,
          projectToUpdate.learningPath,
          projectToUpdate.sessions
        );
        console.log(`✅ Session ${sessionIndex} completion synchronized to Supabase`);
      } catch (error) {
        console.error('❌ Failed to sync session completion to Supabase:', error);
      }
    }

    resetSessionStats();
  }, [cognitiveCredits, sessionAnswers, sessionStreak, addSessionsToProject, resetSessionStats, user, projectDb]);

  const archiveProject = useCallback(async (projectId: string): Promise<boolean> => {
    const MAX_ARCHIVED_PROJECTS = 5;
    if (archivedProjects.length >= MAX_ARCHIVED_PROJECTS) {
      return false;
    }
    const projectToArchive = projects.find(p => p.id === projectId);
    if (projectToArchive) {
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      setArchivedProjects(prevArchived => [...prevArchived, projectToArchive]);

      // Sync to Supabase
      if (user && projectDb) {
        try {
          await projectDb.archiveProject(projectId);
          console.log(`✅ Project ${projectId} archived in Supabase`);
        } catch (error) {
          console.error('❌ Failed to archive project in Supabase:', error);
          toast({
            title: "Error de Sincronización",
            description: "No se pudo archivar el proyecto en la nube.",
            variant: "destructive",
          });
        }
      }
    }
    return true;
  }, [projects, archivedProjects, user, projectDb, toast]);

  const unarchiveProject = useCallback(async (projectId: string) => {
    const projectToUnarchive = archivedProjects.find(p => p.id === projectId);
    if (projectToUnarchive) {
      setArchivedProjects(prev => prev.filter(p => p.id !== projectId));
      setProjects(prev => [...prev, projectToUnarchive]);

      // Sync to Supabase
      if (user && projectDb) {
        try {
          await projectDb.unarchiveProject(projectId);
          console.log(`✅ Project ${projectId} unarchived in Supabase`);
        } catch (error) {
          console.error('❌ Failed to unarchive project in Supabase:', error);
          toast({
            title: "Error de Sincronización",
            description: "No se pudo desarchivar el proyecto en la nube.",
            variant: "destructive",
          });
        }
      }
    }
  }, [archivedProjects, user, projectDb, toast]);

  const deleteProjectPermanently = useCallback(async (projectId: string) => {
    setArchivedProjects(prev => prev.filter(p => p.id !== projectId));

    // Sync to Supabase
    if (user && projectDb) {
      try {
        await projectDb.deleteProject(projectId);
        console.log(`✅ Project ${projectId} permanently deleted from Supabase`);
      } catch (error) {
        console.error('❌ Failed to delete project from Supabase:', error);
        toast({
          title: "Error de Sincronización",
          description: "No se pudo eliminar el proyecto de la nube.",
          variant: "destructive",
        });
      }
    }
  }, [user, projectDb, toast]);

  const toggleProjectPublic = useCallback((projectId: string, isPublic: boolean) => {
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, isPublic } : p))
    );
  }, []);

  const updateEnergy = useCallback((amount: number) => {
    setEnergy(prev => Math.max(0, prev + amount));
  }, []);

  const recordAnswer = useCallback((projectId: string, atomIndex: number, fsrsRating: 1 | 2 | 3 | 4, aidsUsed: boolean, isCorrect: boolean) => {
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
        const initialStabilityMap = { 1: 0.4, 2: 1.0, 3: 2.5, 4: 4.0 };
        newStability = initialStabilityMap[fsrsRating as keyof typeof initialStabilityMap];
      } else if (fsrsRating === 1) {
        newStability = FSRS_WEIGHTS[7] * Math.pow(oldStability, FSRS_WEIGHTS[8]) * Math.exp(FSRS_WEIGHTS[9] * (1 - retrievability));
      } else {
        const difficultyFactor = Math.pow(FSRS_WEIGHTS[4], -clampedDifficulty);
        newStability = oldStability * (1 + FSRS_WEIGHTS[2] * difficultyFactor * (1 - retrievability) * Math.exp(FSRS_WEIGHTS[3] * (1 - retrievability)));
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
  const logout = () => { }; // Deprecated - use AuthContext
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