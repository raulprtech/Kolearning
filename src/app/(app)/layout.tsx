
"use client";

import React, { useState } from "react";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Archive,
  LayoutDashboard,
  CheckCircle,
  BrainCircuit,
  Library,
} from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useProjects } from "@/contexts/ProjectContext";
import { Header } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { OnboardingFlow } from "@/components/ui/onboarding-flow";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";


const projectIcons: { [key: string]: React.ElementType } = {
  Archive,
};

const SidebarContent = () => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { t } = useLanguage();
  const { projects, completedProjects, learnerRankInfo, isLoading } = useProjects();

  return (
    <aside
      className={`flex flex-col bg-card/30 transition-all duration-300 ${isSidebarOpen ? "w-72" : "w-20"
        } p-4 border-r border-border`}
    >
      <div className={`flex items-center ${isSidebarOpen ? 'justify-end' : 'justify-center'} mb-8`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        <Link href="/projects" passHref>
          <Button variant="ghost" className={`w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'} ${pathname === '/projects' ? 'bg-muted' : ''}`}>
            <LayoutDashboard className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">{t('projects.title')}</span>}
          </Button>
        </Link>
        <Link href="/data-box" passHref>
          <Button variant="ghost" className={`w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'} ${pathname === '/data-box' ? 'bg-muted' : ''}`}>
            <Library className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">{t('header.data_box')}</span>}
          </Button>
        </Link>

        <h3 className={`mt-6 mb-2 text-sm font-semibold text-muted-foreground ${isSidebarOpen ? 'px-2' : 'text-center'}`}>
          {isSidebarOpen ? 'Proyectos' : 'Mis'}
        </h3>
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : (
            projects.map((project) => {
              const Icon = projectIcons[project.icon];
              return (
                <Link href={`/projects/${project.id}`} key={project.id} className={`p-2 rounded-md hover:bg-muted ${isSidebarOpen ? '' : 'flex justify-center'}`}>
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-primary shrink-0" />}
                    {isSidebarOpen && (
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{project.title}</span>
                          <span className="text-xs text-muted-foreground">{project.mastery}%</span>
                        </div>
                        <Progress value={project.mastery} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {completedProjects.length > 0 && (
          <>
            <h3 className={`mt-6 mb-2 text-sm font-semibold text-muted-foreground ${isSidebarOpen ? 'px-2' : 'text-center'}`}>
              {isSidebarOpen ? 'Completados' : 'Ok'}
            </h3>
            <div className="flex flex-col gap-1">
              <TooltipProvider>
                {completedProjects.map((project) => {
                  const Icon = projectIcons[project.icon];
                  const needsReview = project.sessions.some(s => s.status === 'Continue');

                  return (
                    <Tooltip key={project.id} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link href={`/projects/${project.id}`} className={`p-2 rounded-md hover:bg-muted ${isSidebarOpen ? '' : 'flex justify-center'}`}>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                            {isSidebarOpen && (
                              <div className="flex flex-col w-full">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{project.title}</span>
                                  {needsReview && <BrainCircuit className="h-4 w-4 text-primary" />}
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <Progress value={project.mastery} className="h-1.5 w-4/5" />
                                  <span className="text-xs text-muted-foreground">{project.mastery}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </Link>
                      </TooltipTrigger>
                      {!isSidebarOpen && (
                        <TooltipContent side="right">
                          <p>{project.title}</p>
                          <p className="text-sm text-muted-foreground">Dominio: {project.mastery}%</p>
                          {needsReview && <p className="text-xs text-primary">Repaso disponible</p>}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
              </TooltipProvider>
            </div>
          </>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        {/* Learner rank display removed from here */}
      </div>
    </aside>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, loading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const isStudyPage = pathname.startsWith('/study');

  React.useEffect(() => {
    if (!authLoading && profile) {
      let onboardingCompleted = false;
      try {
        if (profile.additional_info && profile.additional_info.startsWith('{')) {
          const additionalInfo = JSON.parse(profile.additional_info);
          onboardingCompleted = !!additionalInfo.onboarding_completed;
        }
      } catch (e) {
        console.error("[Dashboard] Error parsing onboarding data:", e);
      }

      if (!onboardingCompleted) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    }
  }, [profile, authLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {!isStudyPage && <SidebarContent />}
      <div className="flex-1 flex flex-col overflow-auto">
        {!isStudyPage && <Header />}
        {children}
      </div>
      <OnboardingFlow
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}