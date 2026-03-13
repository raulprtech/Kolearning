"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CalibratePlanOutput } from '@/ai/flows/kolearning-calibrate-plan';
import { dynamicLearningPathAdjustment } from '@/ai/flows/kolearning-strategic-tutor';
import { differenceInDays, addDays } from 'date-fns';
import { useAuth } from './AuthContext';
import { ProjectDatabase } from '@/lib/supabase/database';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { SupabaseProjectRepository } from '@/infrastructure/repositories/SupabaseProjectRepository';
import { GenkitLLMService } from '@/infrastructure/ai/GenkitLLMService';
import { OpenClawLLMService } from '@/infrastructure/ai/OpenClawLLMService';
import { CreateProjectUseCase } from '@/application/use-cases/CreateProjectUseCase';
import { ExtractKnowledgeUseCase } from '@/application/use-cases/ExtractKnowledgeUseCase';
import { StudySessionUseCase } from '@/application/use-cases/StudySessionUseCase';
// Utility functions imported from domain
import { calculateMastery, calculateCurrentRetrievability } from '@/core/domain/mastery';
import { getLearnerRank, LearnerRankInfo } from '@/core/domain/ranks';

// AI flows (for legacy functions not yet refactored if any)
import { generateAtomsFromLargeContent } from '@/ai/flows/generate-atoms';
import { extractContentFromUrl } from '@/ai/flows/extract-content-from-url';
import { fetchPaperAbstract } from '@/lib/paper-utils';

// Re-export models for backwards compatibility so other files don't break immediately
export * from '@/core/domain/models/atom';
export * from '@/core/domain/models/paper';
export * from '@/core/domain/models/project';
export * from '@/core/domain/models/user';

// Core Type imports for internal use
import { Atom, AtomPayload } from '@/core/domain/models/atom';
import { Paper, PaperStatus, PDFStatus, ImportSource, ReadingStatus, PaperPriority, DifficultyLevel, PaperType } from '@/core/domain/models/paper';
import { Project, Session, LearningPathItem, Source } from '@/core/domain/models/project';
import { User } from '@/core/domain/models/user';



type ProjectContextType = {
  projects: Project[];
  completedProjects: Project[];
  archivedProjects: Project[];
  addProject: (project: Project, logCallback?: (msg: string) => void) => Promise<string>;
  updateProjectIcon: (projectId: string, icon: string) => Promise<void>;
  updateProjectDetails: (projectId: string, title: string, description: string) => Promise<void>;
  updateProjectPlan: (projectId: string, plan: CalibratePlanOutput) => void;
  addSessionsToProject: (projectId: string, newSessions: Omit<Session, 'status' | 'session' | 'atoms'>[], insertAfterSession?: number) => Promise<void>;
  addAtomsToProject: (projectId: string, newAtoms: Atom[]) => Promise<void>;
  updateAtom: (projectId: string, atomIndex: number, updatedAtom: Atom) => void;
  deleteAtom: (projectId: string, atomIndex: number) => void;
  deleteSource: (projectId: string, sourceIndex: number) => void;
  updateSourceStatus: (projectId: string, sourceIndex: number, status: SourceStatus) => void;
  addSource: (projectId: string, source: Omit<Source, 'id'>) => Promise<void>;
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
  recordAnswer: (projectId: string, atomIndex: number, fsrs: 1 | 2 | 3 | 4, isCorrect: boolean, responseTime: number, aidsUsed: string[]) => void;
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
  getSourceContent: (sourceId: string) => Promise<string>;
  // Paper Box methods
  papers: Paper[];
  addPaper: (paper: Omit<Paper, 'id' | 'createdAt' | 'lastInteraction'>) => Promise<string>;
  updatePaper: (paperId: string, updates: Partial<Paper>) => Promise<void>;
  deletePaper: (paperId: string) => Promise<void>;
  classifyPaper: (paperId: string) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

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
  const [papers, setPapers] = useState<Paper[]>([]);

  // Auth context
  const { user, profile, loading: authLoading, updateProfile } = useAuth();

  // Dependency Injection setup
  const [projectDb] = useState(() => new SupabaseProjectRepository());
  const [llmService] = useState(() => {
    const provider = process.env.NEXT_PUBLIC_LLM_PROVIDER || 'genkit';
    if (provider === 'openclaw') {
      console.log('🏭 [LLM Factory] Init OpenClaw Service');
      return new OpenClawLLMService();
    }
    console.log('🏭 [LLM Factory] Init Genkit Service');
    return new GenkitLLMService();
  });

  const { toast } = useToast();

  // Track whether initial data load has completed
  const initialLoadDoneRef = React.useRef(false);
  const currentUserIdRef = React.useRef<string | null>(null);

  // Load data when user changes
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // Only show spinner on first load for this user
      const isNewUser = currentUserIdRef.current !== user.id;
      const showSpinner = !initialLoadDoneRef.current || isNewUser;

      if (isNewUser) {
        currentUserIdRef.current = user.id;
        initialLoadDoneRef.current = false;
      }

      loadUserData(showSpinner).then(() => {
        initialLoadDoneRef.current = true;
      });
    } else {
      currentUserIdRef.current = null;
      initialLoadDoneRef.current = false;
      loadFallbackData();
    }
  }, [user, authLoading]);

  // Keep global stats in sync with profile updates
  useEffect(() => {
    if (profile) {
      setTotalMasteryPoints(profile.total_mastery_points || 0);
      setGlobalCognitiveCredits(profile.global_cognitive_credits || 0);
      setDailyStreak(profile.daily_streak || 0);
    }
  }, [profile]);

  // Track last reload time to avoid excessive refetches
  const lastReloadRef = React.useRef<number>(0);
  const RELOAD_COOLDOWN_MS = 30_000; // 30 seconds between background reloads

  // Sync data when tab becomes visible again (with cooldown)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        const now = Date.now();
        const elapsed = now - lastReloadRef.current;
        if (elapsed < RELOAD_COOLDOWN_MS) {
          console.log(`[Sync] Tab visible but cooldown active (${Math.round((RELOAD_COOLDOWN_MS - elapsed) / 1000)}s remaining), skipping reload`);
          return;
        }
        console.log('[Sync] Tab visible, refreshing data from Supabase (background)');
        lastReloadRef.current = now;
        loadUserData(false); // false = background refresh, no loading spinner
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
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
          // Reload all data when any project changes (background)
          loadUserData(false);
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

  const loadUserData = async (showLoading: boolean = true) => {
    if (!user) {
      console.warn('[ProjectContext] No user found, skipping load');
      return;
    }

    console.log('[ProjectContext] 🔄 Loading data for user:', user.id);
    if (showLoading) setIsLoading(true);

    try {
      console.log('[ProjectContext] Fetching projects from Supabase...');
      const startTime = Date.now();

      const [userProjects, userCompletedProjects, userArchivedProjects, userPapers] = await Promise.all([
        projectDb.getProjects(user.id),
        projectDb.getCompletedProjects(user.id),
        projectDb.getArchivedProjects(user.id),
        projectDb.getPapers(user.id),
      ]);

      const duration = Date.now() - startTime;
      console.log(`[ProjectContext] ✅ Data fetched in ${duration}ms from Supabase`, {
        projects: userProjects.length,
        completed: userCompletedProjects.length,
        archived: userArchivedProjects.length,
      });

      setProjects(userProjects);
      setCompletedProjects(userCompletedProjects);
      setArchivedProjects(userArchivedProjects);
      setPapers(userPapers);

      if (profile) {
        setTotalMasteryPoints(profile.total_mastery_points);
        setGlobalCognitiveCredits(profile.global_cognitive_credits);
        setDailyStreak(profile.daily_streak);
      }

    } catch (error) {
      console.error('[ProjectContext] ❌ Error loading data from Supabase:', error);
      loadFallbackData();
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const addPaper = async (paper: Omit<Paper, 'id' | 'createdAt' | 'lastInteraction'>): Promise<string> => {
    console.log('[ProjectContext] addPaper called with:', paper);
    if (!user) throw new Error('User must be authenticated to add papers');
    try {
      console.log('[ProjectContext] Calling projectDb.createPaper...');
      const paperId = await projectDb.createPaper(user.id, paper);
      console.log('[ProjectContext] createPaper succeeded with ID:', paperId);

      console.log('[ProjectContext] Calling projectDb.getPapers...');
      // Refresh papers list in background
      const updatedPapers = await projectDb.getPapers(user.id);
      console.log('[ProjectContext] getPapers succeeded, updating state...');
      setPapers(updatedPapers);

      console.log('[ProjectContext] Triggering background classification...');
      // Trigger background classification
      classifyPaper(paperId).catch(err => console.error('Auto-classification failed:', err));

      console.log('[ProjectContext] addPaper resolving with ID:', paperId);
      return paperId;
    } catch (error: any) {
      console.error('[ProjectContext] Failed to add paper in context:', error);
      console.error('Details:', error?.message, error?.details, error?.hint, error?.code);
      toast({
        title: "Error",
        description: "No se pudo agregar el paper a la base de datos.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePaper = async (paperId: string, updates: Partial<Paper>): Promise<void> => {
    if (!user) throw new Error('User must be authenticated to update papers');
    try {
      // If we are assigning the paper to a project, let's extract knowledge and atoms
      if (updates.status === 'assigned' && updates.projectId) {
        const paperToAssign = papers.find(p => p.id === paperId);
        if (paperToAssign) {
          // Tell UI we are processing extraction
          await projectDb.updatePaper(paperId, { status: 'processing', projectId: updates.projectId });
          setPapers(prev => prev.map(p => p.id === paperId ? { ...p, status: 'processing', projectId: updates.projectId, lastInteraction: new Date().toISOString() } : p));

          try {
            console.log(`[ProjectContext] Extracting knowledge for paper: ${paperToAssign.title}`);

            const extractor = new ExtractKnowledgeUseCase(llmService, projectDb);
            const atoms = await extractor.execute(paperToAssign, updates.projectId);

            if (atoms && atoms.length > 0) {
              // Update local state by calling existing context method to maintain synced arrays 
              await addAtomsToProject(updates.projectId, atoms);

              toast({
                title: "Conocimiento extraído",
                description: `Se extrajeron y añadieron ${atoms.length} átomos al proyecto exitosamente.`,
              });
            }

            // The rest of the updates (status: assigned) will be applied after
          } catch (extractionError: any) {
            console.error("[ProjectContext] Error extracting atoms from paper:", extractionError);
            toast({
              title: extractionError.message === "INSUFFICIENT_TEXT" ? "Información insuficiente" : "Error de extracción",
              description: extractionError.message === "INSUFFICIENT_TEXT"
                ? "El paper no tiene suficiente resumen o texto para extraer átomos."
                : "Hubo un problema extrayendo los conceptos del artículo.",
              variant: "destructive"
            });
          }
        }
      }

      await projectDb.updatePaper(paperId, updates);
      // Optimistic update
      setPapers(prev => prev.map(p => p.id === paperId ? {
        ...p,
        ...updates,
        lastInteraction: new Date().toISOString()
      } : p));
    } catch (error) {
      console.error('[ProjectContext] Failed to update paper:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el paper.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePaper = async (paperId: string): Promise<void> => {
    if (!user) throw new Error('User must be authenticated to delete papers');
    try {
      await projectDb.deletePaper(paperId);
      setPapers(prev => prev.filter(p => p.id !== paperId));
    } catch (error) {
      console.error('[ProjectContext] Failed to delete paper:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el paper.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const classifyPaper = async (paperId: string): Promise<void> => {
    if (!user) throw new Error('User must be authenticated to classify papers');

    try {
      const paperToClassify = papers.find(p => p.id === paperId);
      if (!paperToClassify) {
        console.warn('[ProjectContext] Paper not found for classification:', paperId);
        return;
      }

      console.log('[ProjectContext] Classifying paper:', paperToClassify.title);
      await updatePaper(paperId, { status: 'processing' });

      let abstract = paperToClassify.notes;
      if (!abstract) {
        console.log('[ProjectContext] Abstract missing, attempting to fetch from Semantic Scholar...');
        const fetchedAbstract = await fetchPaperAbstract(paperToClassify.title, paperToClassify.doi || undefined);
        if (fetchedAbstract) {
          abstract = fetchedAbstract;
          await updatePaper(paperId, { notes: abstract });
        }
      }

      const result = await llmService.classifyDocument(
        paperToClassify.title,
        abstract,
        paperToClassify.authors
      );

      console.log('[ProjectContext] Paper classified successfully:', result);

      await updatePaper(paperId, {
        fieldOfKnowledge: result.fieldOfKnowledge,
        difficultyLevel: result.difficultyLevel as DifficultyLevel,
        paperType: result.paperType as PaperType,
        tags: [...new Set([...(paperToClassify.tags || []), ...(result.tags || [])])],
        status: 'ready'
      });
    } catch (error) {
      console.error('[ProjectContext] Classification failed:', error);
      await updatePaper(paperId, { status: 'in_box' });
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

  const addProject = useCallback(async (projectToAdd: Project, logCallback?: (msg: string) => void) => {
    // Instantiate UseCase on demand for clean contextual lifecycle. 
    // Uses the singleton-like adapter instance.
    const createProjectUseCase = new CreateProjectUseCase(projectDb);

    try {
      const finalProject = await createProjectUseCase.execute(user ? user.id : null, projectToAdd, logCallback);

      // Local state optimistic update
      const strippedSources = finalProject.sources.map(s => ({
        ...s,
        content: s.content.length > 50000 ? 'FETCH_REQUIRED' : s.content
      }));
      const projectForState = { ...finalProject, sources: strippedSources };
      setProjects(prev => [projectForState, ...prev]);

      return finalProject.id;
    } catch (error) {
      console.error('[ProjectContext] ❌ Save error directly propagated:', error);
      throw error;
    }
  }, [user, projectDb]);

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
            phase: item.phase,
            questionFormats: item.questionFormats,
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

  const updateSourceStatus = useCallback(async (projectId: string, sourceIndex: number, status: SourceStatus) => {
    let sourceId: string | undefined;

    setProjects(prevProjects =>
      prevProjects.map(p => {
        if (p.id === projectId) {
          const newSources = [...p.sources];
          sourceId = newSources[sourceIndex]?.id;
          newSources[sourceIndex] = { ...newSources[sourceIndex], status };
          return { ...p, sources: newSources };
        }
        return p;
      })
    );

    // Sync to Supabase
    if (user && projectDb && sourceId) {
      try {
        await projectDb.updateSourceStatus(sourceId, status);
        console.log(`✅ Source ${sourceId} status updated to ${status} in Supabase`);
      } catch (error) {
        console.error('❌ Failed to update source status in Supabase:', error);
        toast({
          title: "Error de Sincronización",
          description: "No se pudo actualizar el estado de la fuente en la nube.",
          variant: "destructive",
        });
      }
    }
  }, [user, projectDb, toast]);

  const addSource = useCallback(async (projectId: string, source: Omit<Source, 'id'>) => {
    if (user && projectDb) {
      try {
        const sourceId = await projectDb.addSource(projectId, source);
        const newSource = { ...source, id: sourceId };
        setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? { ...p, sources: [...p.sources, newSource] } : p));
        toast({ title: "Fuente Añadida", description: `"${source.name}" se ha añadido correctamente.` });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo añadir la fuente.", variant: "destructive" });
      }
    }
  }, [user, projectDb, toast]);

  const resetSessionStats = useCallback(() => {
    setSessionStreak(0);
    setCognitiveCredits(0);
    setMasteryPoints(0);
    setSessionAnswers([]);
  }, []);

  const completeSession = useCallback(async (projectId: string, sessionIndex: number) => {
    const finalCreditsReward = cognitiveCredits;
    const finalMasteryReward = masteryPoints;

    setGlobalCognitiveCredits(prev => prev + finalCreditsReward);
    setTotalMasteryPoints(prev => prev + finalMasteryReward);

    // Sync profile stats to Supabase (Background)
    if (user && profile) {
      updateProfile({
        global_cognitive_credits: (profile.global_cognitive_credits || 0) + finalCreditsReward,
        total_mastery_points: (profile.total_mastery_points || 0) + finalMasteryReward,
      }).catch((err: Error) => console.error('[ProjectContext] Failed to sync profile stats:', err));
    }

    const currentProject = projects.find(p => p.id === projectId);
    if (!currentProject) {
      resetSessionStats();
      return;
    }

    // Prepare Strategic Tutor wrapper to match dependency injection Interface
    const strategicTutorAdapter = {
      async adjustPath(params: any) {
        return dynamicLearningPathAdjustment(params);
      }
    };

    const useCase = new StudySessionUseCase(projectDb, strategicTutorAdapter);

    try {
      const { updatedProject, isFullyCompleted } = await useCase.execute(
        user ? user.id : null,
        currentProject,
        sessionIndex,
        sessionAnswers,
        sessionStreak,
        (newSessions, index) => addSessionsToProject(projectId, newSessions, index)
      );

      // Local React State Updates
      setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? updatedProject : p));

      if (isFullyCompleted) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setCompletedProjects(prev => {
          if (!prev.some(p => p.id === projectId)) {
            return [...prev, updatedProject];
          }
          return prev;
        });
      }

    } catch (e) {
      console.error("[ProjectContext] UseCase Failed during completeSession", e);
    }

    resetSessionStats();
  }, [cognitiveCredits, masteryPoints, sessionAnswers, sessionStreak, addSessionsToProject, resetSessionStats, user, projectDb, profile, updateProfile, projects]);

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

  const recordAnswer = useCallback((projectId: string, atomIndex: number, fsrsRating: 1 | 2 | 3 | 4, isCorrect: boolean, responseTime: number, aidsUsed: string[]) => {
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
      setCognitiveCredits(prev => prev + (aidsUsed.length > 0 ? 1 : 2));
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
    id: profile.id,
    name: profile.name,
    email: user?.email || '',
    profession: profile.profession || undefined,
    company: profile.company || undefined,
    age: profile.age?.toString(),
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
    updateSourceStatus,
    addSource,
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
    getSourceContent: async (sourceId: string) => await projectDb.getSourceContent(sourceId),
    papers,
    addPaper,
    updatePaper,
    deletePaper,
    classifyPaper,
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