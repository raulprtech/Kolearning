"use client";

import React, { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import {
    CheckCircle2,
    Landmark,
    FlaskConical,
    Bot,
    User,
    Ghost,
    Cat,
    Rocket,
    Brain,
    Sparkles,
    BrainCircuit,
    Zap,
    Flame,
    BookOpen,
    Target,
    Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingFlowProps {
    open: boolean;
    onComplete: () => void;
}

export function OnboardingFlow({ open, onComplete }: OnboardingFlowProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { profile, updateProfile } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form states
    const [assistantName, setAssistantName] = useState("Kolearning");
    const [avatar, setAvatar] = useState("bot");
    const [personality, setPersonality] = useState("motivator");
    const [autonomy, setAutonomy] = useState("proactive");
    const [learningStyle, setLearningStyle] = useState("text");
    const [pace, setPace] = useState("deep");
    const [schooling, setSchooling] = useState("university");
    const [studyArea, setStudyArea] = useState("");
    const [objective, setObjective] = useState("understand");

    const totalSteps = 7;

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const onboardingData = {
                onboarding_completed: true,
                assistant: {
                    name: assistantName,
                    avatar: avatar,
                    personality: personality,
                    autonomy: autonomy
                },
                student: {
                    learning_style: learningStyle,
                    pace: pace,
                    schooling: schooling,
                    study_area: studyArea,
                    objective: objective
                },
                completed_at: new Date().toISOString()
            };

            await updateProfile({
                additional_info: JSON.stringify(onboardingData)
            });

            toast({
                title: t('onboarding.finish_btn'),
                description: t('profile.updated_desc'),
            });

            onComplete();
        } catch (error) {
            console.error("Failed to save onboarding data:", error);
            toast({
                title: t('common.error'),
                description: "No se pudieron guardar tus preferencias.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 py-4">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center border-2 border-primary/20 animate-pulse">
                                <Sparkles className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Label htmlFor="assistant-name" className="text-base">
                                {t('onboarding.assistant_name')}
                            </Label>
                            <Input
                                id="assistant-name"
                                value={assistantName}
                                onChange={(e) => setAssistantName(e.target.value)}
                                placeholder={t('onboarding.assistant_name_placeholder')}
                                className="h-12 text-lg"
                                autoFocus
                            />
                        </div>
                    </div>
                );
            case 2:
                const avatars = [
                    { id: 'bot', icon: Bot, color: 'text-primary' },
                    { id: 'human', icon: User, color: 'text-blue-500' },
                    { id: 'creative', icon: Palette, color: 'text-purple-500' },
                    { id: 'rocket', icon: Rocket, color: 'text-orange-500' },
                    { id: 'cat', icon: Cat, color: 'text-green-500' },
                    { id: 'brain', icon: Brain, color: 'text-pink-500' }
                ];
                return (
                    <div className="space-y-6 py-4">
                        <Label className="text-base">{t('onboarding.avatar_label')}</Label>
                        <RadioGroup value={avatar} onValueChange={setAvatar} className="grid grid-cols-3 gap-4">
                            {avatars.map((av) => {
                                const Icon = av.icon;
                                return (
                                    <div key={av.id}>
                                        <RadioGroupItem value={av.id} id={av.id} className="sr-only" />
                                        <Label
                                            htmlFor={av.id}
                                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all hover:border-primary/50 ${avatar === av.id ? "border-primary bg-primary/5" : "border-muted"
                                                }`}
                                        >
                                            <Icon className={`h-10 w-10 ${av.color}`} />
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>
                );
            case 3:
                const personalities = [
                    { id: 'motivator', icon: Flame, color: 'text-orange-500' },
                    { id: 'socratic', icon: BrainCircuit, color: 'text-blue-500' },
                    { id: 'direct', icon: Target, color: 'text-green-500' },
                    { id: 'funny', icon: Zap, color: 'text-purple-500' }
                ];

                return (
                    <div className="space-y-6 py-4">
                        <Label className="text-base">{t('onboarding.personality_label')}</Label>
                        <RadioGroup value={personality} onValueChange={setPersonality} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {personalities.map((p) => {
                                const Icon = p.icon;
                                return (
                                    <div key={p.id}>
                                        <RadioGroupItem value={p.id} id={p.id} className="sr-only" />
                                        <Label
                                            htmlFor={p.id}
                                            className={`flex flex-col h-full border-2 rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 ${personality === p.id ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-transparent"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`p-2 rounded-lg bg-background border ${personality === p.id ? 'border-primary/30' : 'border-border'}`}>
                                                    <Icon className={`h-5 w-5 ${p.color}`} />
                                                </div>
                                                <span className="font-bold">{t(`onboarding.p_${p.id}`)}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground leading-snug">
                                                {t(`onboarding.p_${p.id}_desc`)}
                                            </span>
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>
                );
            case 4:
                const autonomyOptions = [
                    { id: 'proactive', icon: Zap, color: 'text-orange-500' },
                    { id: 'reactive', icon: Target, color: 'text-blue-500' }
                ];
                return (
                    <div className="space-y-6 py-4">
                        <Label className="text-base">{t('onboarding.autonomy_label')}</Label>
                        <RadioGroup value={autonomy} onValueChange={setAutonomy} className="grid grid-cols-1 gap-4">
                            {['proactive', 'reactive'].map((auto) => (
                                <div key={auto}>
                                    <RadioGroupItem value={auto} id={auto} className="sr-only" />
                                    <Label
                                        htmlFor={auto}
                                        className={`flex flex-col border-2 rounded-xl p-4 cursor-pointer transition-all ${autonomy === auto ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-transparent"
                                            }`}
                                    >
                                        <span className="font-bold">{t(`onboarding.auto_${auto}`)}</span>
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {t(`onboarding.auto_${auto}_desc`)}
                                        </span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-8 py-4">
                        <div className="space-y-4">
                            <Label className="text-base">{t('onboarding.style_label')}</Label>
                            <RadioGroup value={learningStyle} onValueChange={setLearningStyle} className="grid grid-cols-2 gap-4">
                                <Label
                                    htmlFor="style-text"
                                    className={`flex items-center justify-center h-14 border-2 rounded-xl cursor-pointer transition-all ${learningStyle === 'text' ? "border-primary bg-primary/5" : "border-muted"
                                        }`}
                                >
                                    <RadioGroupItem value="text" id="style-text" className="sr-only" />
                                    <span>{t('onboarding.style_text')}</span>
                                </Label>
                                <Label
                                    htmlFor="style-visual"
                                    className={`flex items-center justify-center h-14 border-2 rounded-xl cursor-pointer transition-all ${learningStyle === 'visual' ? "border-primary bg-primary/5" : "border-muted"
                                        }`}
                                >
                                    <RadioGroupItem value="visual" id="style-visual" className="sr-only" />
                                    <span>{t('onboarding.style_visual')}</span>
                                </Label>
                            </RadioGroup>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-base">{t('onboarding.pace_label')}</Label>
                            <RadioGroup value={pace} onValueChange={setPace} className="grid grid-cols-2 gap-4">
                                <Label
                                    htmlFor="pace-fast"
                                    className={`flex items-center justify-center h-14 border-2 rounded-xl cursor-pointer transition-all ${pace === 'fast' ? "border-primary bg-primary/5" : "border-muted"
                                        }`}
                                >
                                    <RadioGroupItem value="fast" id="pace-fast" className="sr-only" />
                                    <span>{t('onboarding.pace_fast')}</span>
                                </Label>
                                <Label
                                    htmlFor="pace-deep"
                                    className={`flex items-center justify-center h-14 border-2 rounded-xl cursor-pointer transition-all ${pace === 'deep' ? "border-primary bg-primary/5" : "border-muted"
                                        }`}
                                >
                                    <RadioGroupItem value="deep" id="pace-deep" className="sr-only" />
                                    <span>{t('onboarding.pace_deep')}</span>
                                </Label>
                            </RadioGroup>
                        </div>
                    </div>
                );
            case 6:
                const schoolingLevels = [
                    { id: 'secondary', icon: BookOpen },
                    { id: 'university', icon: Landmark },
                    { id: 'master', icon: FlaskConical || BrainCircuit },
                    { id: 'professional', icon: Zap }
                ];

                return (
                    <div className="space-y-6 py-4">
                        <Label className="text-base">{t('onboarding.schooling_label')}</Label>
                        <RadioGroup value={schooling} onValueChange={setSchooling} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['secondary', 'university', 'master', 'professional'].map((level) => (
                                <div key={level}>
                                    <RadioGroupItem value={level} id={level} className="sr-only" />
                                    <Label
                                        htmlFor={level}
                                        className={`flex items-center h-14 border-2 rounded-xl px-4 cursor-pointer transition-all ${schooling === level ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-transparent"
                                            }`}
                                    >
                                        <span className="font-medium">{t(`onboarding.sch_${level}`)}</span>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                );
            case 7:
                return (
                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label htmlFor="study-area" className="text-base">{t('onboarding.area_label')}</Label>
                            <Input
                                id="study-area"
                                value={studyArea}
                                onChange={(e) => setStudyArea(e.target.value)}
                                placeholder={t('onboarding.area_placeholder')}
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base">{t('onboarding.objectives_label')}</Label>
                            <RadioGroup value={objective} onValueChange={setObjective} className="grid grid-cols-1 gap-3">
                                {['exams', 'understand', 'reference'].map((obj) => (
                                    <div key={obj}>
                                        <RadioGroupItem value={obj} id={obj} className="sr-only" />
                                        <Label
                                            htmlFor={obj}
                                            className={`flex items-center h-14 border-2 rounded-xl px-4 cursor-pointer transition-all ${objective === obj ? "border-primary bg-primary/5 shadow-sm" : "border-muted bg-transparent"
                                                }`}
                                        >
                                            <span className="font-medium">{t(`onboarding.obj_${obj}`)}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[500px] overflow-hidden p-0 rounded-3xl border-none shadow-2xl">
                <div className="bg-primary h-2 w-full">
                    <div
                        className="bg-white/30 h-full transition-all duration-500 ease-out"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold font-headline">
                            {step === 1 ? t('onboarding.title') : t(`onboarding.step${step}_title`)}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            {step === 1 ? t('onboarding.subtitle') : ""}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-[300px]">
                        {renderStep()}
                    </div>

                    <DialogFooter className="mt-8 flex-row justify-between gap-4 sm:justify-between">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 1 || loading}
                            className="flex-1"
                        >
                            {t('onboarding.prev_btn')}
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={loading}
                            className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                        >
                            {loading ? (
                                "..."
                            ) : step === totalSteps ? (
                                <>
                                    {t('onboarding.finish_btn')}
                                    <CheckCircle2 className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                t('onboarding.next_btn')
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
