import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Code, Bot, LineChart, BookOpen } from 'lucide-react';
import type { Deck } from '@/types';

const categoryIcons: { [key: string]: React.ReactNode } = {
    Programming: <Code className="w-full h-full" />,
    'Web Development': <LineChart className="w-full h-full" />,
    AI: <Bot className="w-full h-full" />,
    Default: <BookOpen className="w-full h-full" />,
};

const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || categoryIcons.Default;
};

export function DashboardDeckCard({ deck }: { deck: Deck }) {
  return (
    <Link href={`/deck/${deck.id}`} className="block group">
        <Card className="flex flex-col h-full transition-all duration-300 group-hover:shadow-primary/20 group-hover:shadow-lg group-hover:-translate-y-1 bg-card/50 hover:bg-card">
        <CardContent className="p-6 flex-grow">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 p-2.5 rounded-lg bg-primary/10 text-primary">
                    {getCategoryIcon(deck.category)}
                </div>
                <Badge variant="outline" className="font-normal">Mazo de estudio</Badge>
            </div>
            
            <h3 className="font-bold text-lg text-foreground mb-2 truncate">{deck.title}</h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10">{deck.description}</p>
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4"/>
                    <span>~ 15 min</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium">
                    <Play className="h-4 w-4"/>
                    <span>Empezar</span>
                </div>
            </div>
        </CardContent>
        </Card>
    </Link>
  );
}
