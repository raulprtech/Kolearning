
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SendHorizonal, User as UserIcon } from 'lucide-react';
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
            <h1 className="text-3xl font-bold">AI Tutor</h1>
            <p className="text-muted-foreground">Ask me anything about your studies!</p>
       </div>
      <div className="flex-grow flex flex-col bg-card border rounded-lg shadow-sm">
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
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
                    'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg',
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
                {msg.sender === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback><UserIcon className="w-5 h-5" /></AvatarFallback>
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
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
            <Input
              {...register('message')}
              placeholder="Type your message..."
              className="flex-grow"
              autoComplete='off'
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </form>
           {errors.message && <p className="text-destructive text-xs mt-1">{errors.message.message}</p>}
        </div>
      </div>
    </div>
  );
}
