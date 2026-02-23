"use client";

// Switch to the Supabase-enabled context
import { ProjectProvider } from "./ProjectContext";
import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";

export function ClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ProjectProvider>
                    {children}
                </ProjectProvider>
            </AuthProvider>
        </LanguageProvider>
    )
}
