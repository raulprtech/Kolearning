'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut as performSignOut } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { Moon, Sun, User as UserIcon, Settings, HelpCircle, LogOut } from 'lucide-react';
import type { User } from '@/types';
import { useTheme } from 'next-themes';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

export function UserNav({ user }: { user: User }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const handleSignOut = async () => {
    await performSignOut();
    router.push('/login');
  };
  
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/avatars/01.png" alt={user.email} />
            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">¡Hola!</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Perfil</span>
            </DropdownMenuItem>
             <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Ajustes</span>
            </DropdownMenuItem>
             <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Preguntas Frecuentes</span>
            </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
             <div className="flex items-center justify-between w-full">
                <Label htmlFor="dark-mode" className="flex items-center gap-2 cursor-pointer">
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Modo Oscuro</span>
                </Label>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
           <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
