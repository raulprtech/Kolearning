
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SendHorizonal, User2 } from 'lucide-react';
import { handleTutorChat } from '@/app/actions/tutor';
import { cn } from '@/lib/utils';

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});
type ChatFormData = z.infer<typeof chatSchema>;

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const TutorAvatar = () => (
  <div className="w-8 h-8 rounded-full bg-blue-500/50 flex items-center justify-center shrink-0">
      <div className="w-full h-full rounded-full bg-gradient-radial from-white to-blue-400 animate-pulse"></div>
  </div>
);

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatFormData>({
    resolver: zodResolver(chatSchema),
  });
  
  const scrollToBottom = () => {
      setTimeout(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }
      }, 0);
  };

  const onSubmit = async (data: ChatFormData) => {
    setIsLoading(true);
    const userMessage: Message = { sender: 'user', text: data.message };
    setMessages(prev => [...prev, userMessage]);
    reset();
    
    scrollToBottom();

    const result = await handleTutorChat(data.message);

    if (result.response) {
      const aiMessage: Message = { sender: 'ai', text: result.response };
      setMessages(prev => [...prev, aiMessage]);
    } else if (result.error) {
       const errorMessage: Message = { sender: 'ai', text: result.error };
       setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
    scrollToBottom();
  };

  useEffect(() => {
      scrollToBottom();
  }, [messages]);

  return (
    <div className="container mx-auto py-8 h-[calc(100vh-57px)] flex flex-col">
       <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Pregúntale a Koli</h1>
            <p className="text-muted-foreground">¡Pregúntame lo que sea sobre tus estudios!</p>
       </div>
      <div className="flex-grow flex flex-col bg-black/30 rounded-lg">
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-6 font-code">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.sender === 'ai' && <TutorAvatar />}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg text-sm md:text-base',
                    msg.sender === 'user'
                      ? 'bg-secondary/50 border border-primary/50 text-primary-foreground'
                      : 'bg-blue-900/50 border border-blue-600/50 shadow-[0_0_15px_rgba(59,130,246,0.2)] text-blue-100'
                  )}
                >
                  <p>{msg.text}</p>
                </div>
                {msg.sender === 'user' && (
                  <Avatar className="w-8 h-8 border-2 border-primary/50">
                    <AvatarFallback className='bg-secondary/50'><User2 className="w-5 h-5" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                     <TutorAvatar />
                    <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg bg-muted flex items-center gap-2">
                        <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-0"></span>
                        <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-foreground rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-primary/20">
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-4">
            <Input
              {...register('message')}
              placeholder="Escríbele a Koli..."
              className="flex-grow bg-transparent border-primary/30 focus-visible:ring-primary/50 focus-visible:ring-offset-0 focus-visible:border-primary font-code"
              autoComplete='off'
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading} variant="outline" className="bg-transparent border-primary/30 hover:bg-primary/20 hover:text-primary-foreground">
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </form>
           {errors.message && <p className="text-destructive text-xs mt-2">{errors.message.message}</p>}
        </div>
      </div>
    </div>
  );
}
