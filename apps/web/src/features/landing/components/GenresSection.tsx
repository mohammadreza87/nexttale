import { Skull, Heart, Sword, Zap, Flame, Brain } from 'lucide-react';

const GENRES = [
  { icon: Skull, name: 'Thriller', color: 'from-gray-700 to-gray-900' },
  { icon: Heart, name: 'Romance', color: 'from-rose-500 to-pink-600' },
  { icon: Sword, name: 'Fantasy', color: 'from-purple-600 to-indigo-700' },
  { icon: Zap, name: 'Sci-Fi', color: 'from-cyan-500 to-blue-600' },
  { icon: Flame, name: 'Drama', color: 'from-orange-500 to-red-600' },
  { icon: Brain, name: 'Mystery', color: 'from-emerald-600 to-teal-700' },
];

export function GenresSection() {
  return (
    <section className="bg-gray-950 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-block rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-400">
            GENRES
          </span>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Every Genre. Every Mood.
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            From heart-pounding thrillers to sweeping romances—craft the story you want to live.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {GENRES.map((genre, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${genre.color} transform cursor-pointer rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              <genre.icon className="mx-auto mb-3 h-10 w-10 text-white" />
              <p className="font-bold text-white">{genre.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
