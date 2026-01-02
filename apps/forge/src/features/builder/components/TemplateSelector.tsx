import { X, Gamepad2, Wrench, LayoutGrid, HelpCircle, BarChart3 } from 'lucide-react';
import { GAME_TEMPLATES, type GameTemplate } from '../templates';

interface TemplateSelectorProps {
  onSelect: (starterPrompt: string, baseHtml?: string) => void;
  onClose: () => void;
}

const CATEGORY_ICONS = {
  platformer: Gamepad2,
  puzzle: Gamepad2,
  arcade: Gamepad2,
  quiz: HelpCircle,
  tool: Wrench,
  visualization: BarChart3,
};

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Choose a Template</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Blank canvas option */}
            <button
              onClick={() => onClose()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 p-6 text-center transition-colors hover:border-purple-500 hover:bg-purple-500/10"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800">
                <LayoutGrid className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-medium text-white">Blank Canvas</h3>
              <p className="mt-1 text-sm text-gray-400">Start from scratch</p>
            </button>

            {/* Template cards */}
            {GAME_TEMPLATES.map((template) => {
              const Icon = CATEGORY_ICONS[template.category] || Gamepad2;
              return (
                <button
                  key={template.id}
                  onClick={() => onSelect(template.starterPrompt, template.baseHtml)}
                  className="flex flex-col rounded-xl border border-gray-700 bg-gray-800/50 p-4 text-left transition-all hover:border-purple-500 hover:bg-gray-800"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                    <Icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="font-medium text-white">{template.name}</h3>
                  <p className="mt-1 text-sm text-gray-400">{template.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
