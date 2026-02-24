"use client";

import { ProjectProvider } from "./ProjectContext";
import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import { AIProvider } from "./AIContext";
import { PluginProvider } from "./PluginContext";

export function ClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <ProjectProvider>
                    <PluginProvider>
                        <AIProvider>
                            {children}
                        </AIProvider>
                    </PluginProvider>
                </ProjectProvider>
            </AuthProvider>
        </LanguageProvider>
    )
}
