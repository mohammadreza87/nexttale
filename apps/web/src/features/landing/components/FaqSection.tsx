import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What kind of stories can I create?',
    answer:
      'Next Tale supports a wide range of genres including thriller, romance, fantasy, sci-fi, drama, mystery, and more. You can create stories with complex characters, moral dilemmas, and mature themes suitable for adult readers.',
  },
  {
    question: 'How does the AI create personalized stories?',
    answer:
      'Our AI uses advanced language models to generate unique, immersive narratives based on your preferences. Describe your ideal scenario—a noir detective story, a forbidden romance, an epic fantasy quest—and the AI crafts a complete illustrated story with multiple branching paths.',
  },
  {
    question: 'Is this appropriate for all ages?',
    answer:
      "Next Tale is designed for adults (18+). While we don't allow explicit content, stories may contain mature themes, complex moral choices, violence, and romantic elements appropriate for adult fiction.",
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      "Yes! You can cancel your Pro subscription at any time. There are no long-term contracts or cancellation fees. You'll continue to have access until the end of your billing period.",
  },
];

interface FaqSectionProps {
  activeFaq: number | null;
  onToggleFaq: (index: number) => void;
}

export function FaqSection({ activeFaq, onToggleFaq }: FaqSectionProps) {
  return (
    <section className="bg-gray-900 py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
            FAQ
          </span>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Common Questions</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950"
            >
              <button
                onClick={() => onToggleFaq(index)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-gray-900"
              >
                <span className="font-semibold text-white">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`}
                />
              </button>
              {activeFaq === index && (
                <div className="px-6 pb-6">
                  <p className="leading-relaxed text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
