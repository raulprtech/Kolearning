
"use client";

import React, { useState } from "react";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/Sidebar";
import { OnboardingFlow } from "@/components/ui/onboarding-flow";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, loading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const isHideNavigation = pathname.includes('/session');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {!isHideNavigation && <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />}
      <div className="flex-1 flex flex-col min-w-0">
        {!isHideNavigation && <Header onToggleSidebar={toggleSidebar} />}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <OnboardingFlow
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}