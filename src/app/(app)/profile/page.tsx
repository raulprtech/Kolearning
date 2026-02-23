
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProjects, User } from '@/contexts/ProjectContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Globe,
  Bot,
  User as UserIcon,
  Palette,
  Rocket,
  Cat,
  Brain,
  Flame,
  BrainCircuit,
  Target,
  Zap,
  BookOpen,
  Landmark,
  FlaskConical,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function ProfilePage() {
  const { currentUser, updateUserProfile } = useProjects();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    profession: '',
    company: '',
    age: '',
    additionalInfo: '',
  });

  const [parsedInfo, setParsedInfo] = useState<any>({
    assistant: {
      name: 'Koli',
      avatar: 'bot',
      personality: 'motivator',
      autonomy: 'proactive'
    },
    student: {
      learning_style: 'text',
      pace: 'deep',
      schooling: 'university',
      study_area: '',
      objective: 'understand'
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        profession: currentUser.profession || '',
        company: currentUser.company || '',
        age: currentUser.age || '',
        additionalInfo: currentUser.additionalInfo || '',
      });

      if (currentUser.additionalInfo) {
        try {
          const info = JSON.parse(currentUser.additionalInfo);
          // Handle legacy vs new structure
          const assistant = info.assistant || {
            name: info.assistant_name || 'Koli',
            avatar: info.assistant_avatar || 'bot',
            personality: info.personality || 'motivator',
            autonomy: info.autonomy_level || 'proactive'
          };
          const student = info.student || {
            learning_style: info.learning_style || 'text',
            pace: info.pace || 'deep',
            schooling: info.schooling || 'university',
            study_area: info.study_area || '',
            objective: info.objective || 'understand'
          };
          setParsedInfo({ assistant, student });
        } catch (e) {
          console.error("Failed to parse additionalInfo", e);
        }
      }
    }
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAssistantChange = (field: string, value: string) => {
    setParsedInfo((prev: any) => ({
      ...prev,
      assistant: { ...prev.assistant, [field]: value }
    }));
  };

  const handleStudentChange = (field: string, value: string) => {
    setParsedInfo((prev: any) => ({
      ...prev,
      student: { ...prev.student, [field]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const updatedAdditionalInfo = JSON.stringify({
      ...parsedInfo,
      onboarding_completed: true,
      completed_at: new Date().toISOString()
    });

    const finalData = {
      ...formData,
      additionalInfo: updatedAdditionalInfo
    };

    // Simulate async operation
    setTimeout(() => {
      const success = updateUserProfile(finalData);
      if (success) {
        toast({
          title: t('profile.updated'),
          description: t('profile.updated_desc'),
        });
      } else {
        toast({
          title: t('common.error'),
          description: 'Could not update your profile. Please try again.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }, 500);
  };

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-background">
      <div className="mb-8 font-headline">
        <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground">
          {t('profile.description')}
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full space-y-6">
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>{t('profile.personal_info')}</CardTitle>
            <CardDescription>
              {t('profile.personal_info_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('profile.name')}</Label>
                  <Input id="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('profile.email')}</Label>
                  <Input id="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="profession">{t('profile.profession')}</Label>
                  <Input id="profession" value={formData.profession} onChange={handleChange} placeholder="e.g.: Student, Developer..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{t('profile.company')}</Label>
                  <Input id="company" value={formData.company} onChange={handleChange} placeholder="e.g.: University of London..." />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Student Profile Card */}
        <Card className="bg-card/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t('profile.student_profile')}</CardTitle>
                <CardDescription>{t('profile.student_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t('onboarding.schooling_label')}</Label>
                <Select
                  value={parsedInfo.student.schooling}
                  onValueChange={(val) => handleStudentChange('schooling', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['secondary', 'university', 'master', 'professional'].map(level => (
                      <SelectItem key={level} value={level}>{t(`onboarding.sch_${level}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="study_area">{t('onboarding.area_label')}</Label>
                <Input
                  id="study_area"
                  value={parsedInfo.student.study_area}
                  onChange={(e) => handleStudentChange('study_area', e.target.value)}
                  placeholder={t('onboarding.area_placeholder')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t('onboarding.objectives_label')}</Label>
                <Select
                  value={parsedInfo.student.objective}
                  onValueChange={(val) => handleStudentChange('objective', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['exams', 'understand', 'reference'].map(obj => (
                      <SelectItem key={obj} value={obj}>{t(`onboarding.obj_${obj}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('onboarding.pace_label')}</Label>
                <Select
                  value={parsedInfo.student.pace}
                  onValueChange={(val) => handleStudentChange('pace', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">{t('onboarding.pace_fast')}</SelectItem>
                    <SelectItem value="deep">{t('onboarding.pace_deep')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assistant Settings Card */}
        <Card className="bg-card/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t('profile.assistant_title')}</CardTitle>
                <CardDescription>{t('profile.assistant_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="assistant_name">{t('onboarding.assistant_name')}</Label>
                <Input
                  id="assistant_name"
                  value={parsedInfo.assistant.name}
                  onChange={(e) => handleAssistantChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('onboarding.personality_label')}</Label>
                <Select
                  value={parsedInfo.assistant.personality}
                  onValueChange={(val) => handleAssistantChange('personality', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['motivator', 'socratic', 'direct', 'funny'].map(p => (
                      <SelectItem key={p} value={p}>{t(`onboarding.p_${p}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{t('onboarding.autonomy_label')}</Label>
                <Select
                  value={parsedInfo.assistant.autonomy}
                  onValueChange={(val) => handleAssistantChange('autonomy', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proactive">{t('onboarding.auto_proactive')}</SelectItem>
                    <SelectItem value="reactive">{t('onboarding.auto_reactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('onboarding.avatar_label')}</Label>
                <Select
                  value={parsedInfo.assistant.avatar}
                  onValueChange={(val) => handleAssistantChange('avatar', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['bot', 'human', 'creative', 'rocket', 'cat', 'brain'].map(av => (
                      <SelectItem key={av} value={av}>{av.charAt(0).toUpperCase() + av.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('profile.settings')}
            </CardTitle>
            <CardDescription>
              {t('profile.language_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">{t('profile.language')}</Label>
              <Select value={language} onValueChange={(val) => setLanguage(val as any)}>
                <SelectTrigger id="language" className="w-[180px]">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
