import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../card';
import { Button } from '../button';
import { Textarea } from '../textarea';
import { Atom } from '@/contexts/ProjectContext';
import { CheckCircle, PlayCircle, Eye, HelpCircle } from 'lucide-react';
import { extractYouTubeId } from '@/lib/utils'; // Assuming this utility exists or we'll add it

interface VideoReviewQuestionProps {
    atom: Atom;
    onAnswerSubmit: (isCorrect: boolean, responseTime: number) => void;
}

export const VideoReviewQuestion: React.FC<VideoReviewQuestionProps> = ({ atom, onAnswerSubmit }) => {
    const [isVideoDone, setIsVideoDone] = useState(false);
    const [userResponse, setUserResponse] = useState('');
    const [showingAnswer, setShowingAnswer] = useState(false);
    const startTimeRef = useRef(Date.now());
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const videoUrl = atom.payload?.videoUrl || '';
    const videoId = extractYouTubeId(videoUrl);
    const startSeconds = atom.payload?.startTime || 0;
    const endSeconds = atom.payload?.endTime;

    useEffect(() => {
        // Reset state when atom changes (next flashcard)
        setIsVideoDone(false);
        setUserResponse('');
        setShowingAnswer(false);
        startTimeRef.current = Date.now();
    }, [atom.id]);

    const handleVideoEnd = () => {
        // We simulate "done watching" since we don't have native iframe API hooked up perfectly yet
        setIsVideoDone(true);
    };

    const handleRevealAnswer = () => {
        setShowingAnswer(true);
    };

    const handleSelfGrade = (isCorrect: boolean) => {
        const responseTime = (Date.now() - startTimeRef.current) / 1000;
        onAnswerSubmit(isCorrect, responseTime);
    };

    let embedUrl = `https://www.youtube.com/embed/${videoId}?start=${startSeconds}`;
    if (endSeconds) {
        embedUrl += `&end=${endSeconds}`;
    }

    return (
        <Card className="w-full max-w-3xl mx-auto border-2 border-primary/20 shadow-lg mt-8 relative overflow-hidden bg-background">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row h-[600px]">
                    {/* Left Panel: Video Player */}
                    <div className="w-full md:w-1/2 bg-black flex flex-col items-center justify-center relative">
                        {videoId ? (
                            <iframe
                                ref={iframeRef}
                                className="w-full h-64 md:h-full"
                                src={embedUrl}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        ) : (
                            <div className="text-white text-center p-6">
                                <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Video no disponible o URL no válida.</p>
                            </div>
                        )}

                        {!isVideoDone && videoId && (
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                                <Button
                                    variant="secondary"
                                    className="bg-black/50 hover:bg-black/80 text-white backdrop-blur-sm"
                                    onClick={handleVideoEnd}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Terminé de ver el clip
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Question & Response */}
                    <div className="w-full md:w-1/2 p-6 flex flex-col h-[600px] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <HelpCircle className="w-5 h-5" />
                            <h3 className="font-semibold text-sm uppercase tracking-wider">Pregunta del Video</h3>
                        </div>

                        <p className="text-lg md:text-xl font-medium mb-8 leading-relaxed">
                            {atom.question}
                        </p>

                        {!isVideoDone ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 mt-12">
                                <Eye className="w-12 h-12 mb-4" />
                                <p>Observa el clip de video a la izquierda para poder responder.</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {!showingAnswer ? (
                                    <>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                Tu respuesta / Notas cognitivas:
                                            </label>
                                            <Textarea
                                                placeholder="Escribe lo que entendiste de este fragmento..."
                                                className="w-full min-h-[150px] resize-none"
                                                value={userResponse}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserResponse(e.target.value)}
                                            />
                                        </div>
                                        <div className="mt-6 pt-4 border-t">
                                            <Button
                                                className="w-full h-12 text-lg"
                                                onClick={handleRevealAnswer}
                                                disabled={userResponse.trim().length === 0}
                                            >
                                                Ver respuesta clave
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-300">
                                        <div className="flex-1 mb-6">
                                            <h4 className="text-sm font-bold text-green-600 dark:text-green-400 mb-2 uppercase flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                Respuesta Clave Esperada
                                            </h4>
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800/30">
                                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                                    {atom.answer}
                                                </p>
                                            </div>

                                            <div className="mt-6">
                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tu respuesta:</h4>
                                                <p className="text-sm italic opacity-80 border-l-2 border-primary/30 pl-3">"{userResponse}"</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto border-t pt-4">
                                            <p className="text-center text-sm font-medium mb-3 text-muted-foreground">¿Recordaste los puntos clave?</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="h-14 border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600 dark:border-red-900/50 dark:hover:bg-red-900/30 dark:text-red-400"
                                                    onClick={() => handleSelfGrade(false)}
                                                >
                                                    No, olvidé cosas
                                                </Button>
                                                <Button
                                                    className="h-14 bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleSelfGrade(true)}
                                                >
                                                    Sí, lo recordé
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
