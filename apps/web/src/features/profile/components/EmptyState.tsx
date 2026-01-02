import { Trophy, User, Gamepad2, Music, type LucideIcon } from 'lucide-react';

type EmptyStateType = 'completed' | 'created' | 'interactive' | 'music';

interface EmptyStateProps {
  type: EmptyStateType;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: LucideIcon;
  title: string;
  description: string;
}> = {
  completed: {
    icon: Trophy,
    title: 'No Completed Stories Yet',
    description: 'Start reading stories and complete them to see your achievements here!',
  },
  created: {
    icon: User,
    title: 'No Created Stories Yet',
    description: 'Create your first interactive story to see it here!',
  },
  interactive: {
    icon: Gamepad2,
    title: 'No Interactive Content Yet',
    description: 'Create games, tools, quizzes, and more to see them here!',
  },
  music: {
    icon: Music,
    title: 'No Music Created Yet',
    description: 'Create AI-generated music to see it here!',
  },
};

export function EmptyState({ type }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div className="p-8 text-center">
      <Icon className="mx-auto mb-4 h-16 w-16 text-gray-600" />
      <h3 className="mb-2 text-xl font-bold text-white">{config.title}</h3>
      <p className="text-gray-400">{config.description}</p>
    </div>
  );
}
