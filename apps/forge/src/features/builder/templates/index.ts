export interface GameTemplate {
  id: string;
  name: string;
  description: string;
  category: 'platformer' | 'puzzle' | 'arcade' | 'quiz' | 'tool' | 'visualization';
  starterPrompt: string;
  baseHtml?: string;
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'platformer',
    name: 'Platformer Game',
    category: 'platformer',
    description: 'Side-scrolling jump and run game',
    starterPrompt: 'Create a platformer game with a character that can jump and collect coins. Use arrow keys for movement.',
  },
  {
    id: 'snake',
    name: 'Snake Game',
    category: 'arcade',
    description: 'Classic snake with growing tail',
    starterPrompt: 'Create a classic snake game where the snake grows when eating food. Use arrow keys to control direction.',
  },
  {
    id: 'pong',
    name: 'Pong',
    category: 'arcade',
    description: 'Two-player paddle game',
    starterPrompt: 'Create a Pong game with two paddles. Player 1 uses W/S keys, Player 2 uses arrow keys. Ball speeds up over time.',
  },
  {
    id: 'breakout',
    name: 'Breakout',
    category: 'arcade',
    description: 'Break all the bricks',
    starterPrompt: 'Create a Breakout game with a paddle, ball, and colorful bricks to destroy. Use mouse or arrow keys to control the paddle.',
  },
  {
    id: 'memory',
    name: 'Memory Match',
    category: 'puzzle',
    description: 'Card matching memory game',
    starterPrompt: 'Create a memory card matching game with a 4x4 grid of cards. Track the number of moves and add a timer.',
  },
  {
    id: 'puzzle-slider',
    name: 'Sliding Puzzle',
    category: 'puzzle',
    description: '15-tile sliding puzzle',
    starterPrompt: 'Create a 15-tile sliding puzzle game. Let users shuffle and solve the puzzle. Count moves and track best score.',
  },
  {
    id: 'trivia',
    name: 'Trivia Quiz',
    category: 'quiz',
    description: 'Multiple choice quiz game',
    starterPrompt: 'Create a trivia quiz with 10 general knowledge questions. Show score at the end and allow replay.',
  },
  {
    id: 'typing-test',
    name: 'Typing Test',
    category: 'tool',
    description: 'Speed typing challenge',
    starterPrompt: 'Create a typing speed test that shows random words to type. Calculate WPM and accuracy.',
  },
  {
    id: 'calculator',
    name: 'Calculator',
    category: 'tool',
    description: 'Scientific calculator',
    starterPrompt: 'Create a scientific calculator with basic operations plus sin, cos, tan, sqrt, and power functions.',
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro Timer',
    category: 'tool',
    description: 'Focus timer with breaks',
    starterPrompt: 'Create a Pomodoro timer with 25-minute work sessions and 5-minute breaks. Show notifications and track completed sessions.',
  },
  {
    id: 'weather-widget',
    name: 'Weather Widget',
    category: 'visualization',
    description: 'Animated weather display',
    starterPrompt: 'Create a beautiful weather widget with animated weather icons. Let users enter a city name and show temperature, conditions, and forecast.',
  },
  {
    id: 'chart-maker',
    name: 'Chart Maker',
    category: 'visualization',
    description: 'Interactive data charts',
    starterPrompt: 'Create an interactive chart maker where users can input data and see it as a bar chart, line chart, or pie chart.',
  },
];
