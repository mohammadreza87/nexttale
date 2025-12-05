interface ChapterContentProps {
  content: string;
  currentWordIndex: number;
  isPlaying: boolean;
}

export function ChapterContent({ content, currentWordIndex, isPlaying }: ChapterContentProps) {
  const words = content.split(/\s+/);

  return (
    <div className="prose max-w-none">
      <p className="text-base leading-relaxed text-gray-300">
        {words.map((word, index) => (
          <span key={index}>
            <span
              className={`transition-all duration-200 ${
                isPlaying && index === currentWordIndex
                  ? 'rounded bg-yellow-300 px-1 font-semibold text-gray-900'
                  : ''
              }`}
            >
              {word}
            </span>{' '}
          </span>
        ))}
      </p>
    </div>
  );
}
