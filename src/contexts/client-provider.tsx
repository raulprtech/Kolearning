"use client";

import { ProjectProvider } from "./ProjectContext";
import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import { AIProvider } from "./AIContext";

export function ClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ProjectProvider>
                    <AIProvider>
                        {children}
                    </AIProvider>
                </ProjectProvider>
            </AuthProvider>
        </LanguageProvider>
    )
}
