/**
 * FAQ Modal Component
 * Searchable FAQ with categories and accordion items
 */

import { useState, useMemo } from 'react';
import {
  X,
  Search,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { FAQ_CATEGORIES, ALL_FAQ_ITEMS } from '../data/faqContent';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback?: () => void;
  onStartTour?: () => void;
}

export function FAQModal({
  isOpen,
  onClose,
  onOpenFeedback,
  onStartTour,
}: FAQModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter FAQ items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase();
    return ALL_FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Toggle expanded state for an item
  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
              <HelpCircle className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Help & FAQ</h2>
              <p className="text-sm text-gray-500">Find answers to common questions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-800 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none ring-violet-500 focus:border-transparent focus:ring-2"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems ? (
            // Search results
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400">No results found for "{searchQuery}"</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Try different keywords or browse categories below
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-sm text-gray-500">
                    Found {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
                  </p>
                  {filteredItems.map((item) => (
                    <FAQItem
                      key={item.id}
                      question={item.question}
                      answer={item.answer}
                      category={item.category}
                      isExpanded={expandedItems.has(item.id)}
                      onToggle={() => toggleItem(item.id)}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            // Browse by category
            <div className="space-y-4">
              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                {onStartTour && (
                  <button
                    onClick={() => {
                      onClose();
                      onStartTour();
                    }}
                    className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4 text-left transition-colors hover:border-violet-500/50 hover:bg-gray-800"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
                      <Sparkles className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Take a tour</p>
                      <p className="text-sm text-gray-500">Learn the basics</p>
                    </div>
                  </button>
                )}
                {onOpenFeedback && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenFeedback();
                    }}
                    className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4 text-left transition-colors hover:border-violet-500/50 hover:bg-gray-800"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600/20">
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Send feedback</p>
                      <p className="text-sm text-gray-500">Report issues or ideas</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Category tabs */}
              <div className="flex flex-wrap gap-2">
                {FAQ_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() =>
                      setActiveCategory(
                        activeCategory === category.id ? null : category.id
                      )
                    }
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      activeCategory === category.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Category content */}
              {FAQ_CATEGORIES.filter(
                (cat) => !activeCategory || cat.id === activeCategory
              ).map((category) => (
                <div key={category.id} className="space-y-2">
                  {!activeCategory && (
                    <h3 className="text-sm font-medium text-gray-400">
                      {category.name}
                    </h3>
                  )}
                  {category.items.map((item) => (
                    <FAQItem
                      key={item.id}
                      question={item.question}
                      answer={item.answer}
                      isExpanded={expandedItems.has(item.id)}
                      onToggle={() => toggleItem(item.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 p-4">
          <p className="text-center text-sm text-gray-500">
            Can't find what you're looking for?{' '}
            {onOpenFeedback ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="text-violet-400 hover:text-violet-300"
              >
                Send us feedback
              </button>
            ) : (
              <span className="text-gray-400">Contact support</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
  category?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, category, isExpanded, onToggle }: FAQItemProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/30 transition-colors hover:border-gray-700">
      <button
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
        <div className="flex-1">
          <p className="font-medium text-white">{question}</p>
          {category && !isExpanded && (
            <span className="mt-1 inline-block rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
              {category}
            </span>
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="border-t border-gray-800 px-4 py-3 pl-11">
          <p className="text-sm leading-relaxed text-gray-400">{answer}</p>
        </div>
      )}
    </div>
  );
}
