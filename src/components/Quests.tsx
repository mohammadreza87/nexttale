import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PlusCircle, BookOpen } from 'lucide-react';
import { getQuests, type Quest } from '../lib/questsService';

interface QuestsProps {
  userId: string;
}

export function Quests(_props: QuestsProps) {
  const [loading, setLoading] = useState(true);
  const [questsData, setQuestsData] = useState<Quest[]>([]);

  const questMeta = useMemo(
    () => ({
      read_chapter: {
        title: 'Read 2 Chapters',
        description: 'Read any two chapters today.',
        reward: 10,
        quest_type: 'daily' as const,
        target: 2,
      },
      create_story: {
        title: 'Create a Story',
        description: 'Generate a new story today.',
        reward: 15,
        quest_type: 'daily' as const,
        target: 1,
      },
      complete_story: {
        title: 'Finish a Story',
        description: 'Reach an ending in any story this week.',
        reward: 30,
        quest_type: 'weekly' as const,
        target: 1,
      },
    }),
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { quests } = await getQuests();
        if (!mounted) return;
        setQuestsData(quests);
      } catch (error) {
        console.error('Failed to load quests', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const displayQuests: (Quest & {
    title: string;
    description: string;
    reward_points: number;
    quest_type: 'daily' | 'weekly';
    target: number;
  })[] = questsData.length
    ? questsData.map((q) => ({
        ...q,
        title: questMeta[q.task]?.title || q.task,
        description: questMeta[q.task]?.description || '',
        reward_points: q.reward_points || questMeta[q.task]?.reward || 0,
        quest_type: q.quest_type,
        target: q.target || questMeta[q.task]?.target || 1,
      }))
    : Object.entries(questMeta).map(([task, meta]) => ({
        id: `placeholder-${task}`,
        task: task as Quest['task'],
        quest_type: meta.quest_type,
        period_start: '',
        period_end: '',
        progress: 0,
        target: meta.target,
        status: 'pending' as const,
        reward_points: meta.reward,
        rewarded: false,
        title: meta.title,
        description: meta.description,
      }));

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-950 pb-20">
        <div className="flex gap-2">
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-purple-500"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-purple-500"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="h-3 w-3 animate-bounce rounded-full bg-purple-500"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <div className="mx-auto max-w-2xl px-4 pb-6 pt-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Quests</h1>
          <p className="text-sm text-gray-400">Complete quests to earn points</p>
        </div>

        <div className="space-y-4 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <h2 className="mb-2 text-xl font-bold text-white">Daily Quests</h2>
          {displayQuests
            .filter((q) => q.quest_type === 'daily')
            .map((quest) => {
              const pct = Math.min(100, ((quest.progress || 0) / quest.target) * 100);
              return (
                <div key={quest.id} className="rounded-2xl bg-gray-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {quest.task === 'read_chapter' ? (
                        <BookOpen className="mt-0.5 h-4 w-4 text-purple-400" />
                      ) : (
                        <PlusCircle className="mt-0.5 h-4 w-4 text-purple-400" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{quest.title}</p>
                        <p className="text-xs text-gray-400">{quest.description}</p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-400">
                      +{quest.reward_points} pts
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {quest.progress}/{quest.target}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-green-400 to-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="mt-6 space-y-4 rounded-3xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
          <h2 className="mb-2 text-xl font-bold text-white">Weekly Quest</h2>
          {displayQuests
            .filter((q) => q.quest_type === 'weekly')
            .map((quest) => {
              const pct = Math.min(100, ((quest.progress || 0) / quest.target) * 100);
              return (
                <div key={quest.id} className="rounded-2xl bg-gray-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-purple-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">{quest.title}</p>
                        <p className="text-xs text-gray-400">{quest.description}</p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-400">
                      +{quest.reward_points} pts
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {quest.progress}/{quest.target}
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-green-400 to-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
