import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      "Finally, interactive fiction that doesn't feel childish. The AI writing is genuinely compelling.",
    name: 'Alex R.',
    role: 'Thriller enthusiast',
  },
  {
    quote:
      "I've replayed my favorite story 5 times and still find new paths. Absolutely addictive.",
    name: 'Maya K.',
    role: 'Romance reader',
  },
  {
    quote:
      "The narration quality is incredible. It's like having an audiobook that responds to my choices.",
    name: 'Jordan T.',
    role: 'Fantasy lover',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-gray-900 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
            TESTIMONIALS
          </span>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Readers Love Next Tale
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-3xl border border-gray-800 bg-gray-950 p-8 transition-colors hover:border-purple-500/30"
            >
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="mb-6 text-lg italic leading-relaxed text-gray-300">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600">
                  <span className="font-bold text-white">{testimonial.name[0]}</span>
                </div>
                <div>
                  <p className="font-bold text-white">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
