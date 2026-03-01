"use client";

import { ProjectProvider } from "./ProjectContext";
import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import { AIProvider } from "./AIContext";
import { ConectorProvider } from "./ConectorContext";

export function ClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ProjectProvider>
                    <ConectorProvider>
                        <AIProvider>
                            {children}
                        </AIProvider>
                    </ConectorProvider>
                </ProjectProvider>
            </AuthProvider>
        </LanguageProvider>
    )
}
