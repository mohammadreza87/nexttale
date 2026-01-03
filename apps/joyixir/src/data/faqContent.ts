/**
 * FAQ Content Data
 * Questions and answers organized by category
 */

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  items: FAQItem[];
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    items: [
      {
        id: 'how-to-create',
        question: 'How do I create my first game?',
        answer: 'Simply type a description of the game you want to create in the chat input. For example, "Create a snake game where the snake grows when eating apples." The AI will generate the code and you\'ll see it running in the preview immediately.',
      },
      {
        id: 'what-can-i-build',
        question: 'What types of games can I build?',
        answer: 'You can build a wide variety of games including: 2D arcade games (Snake, Tetris, Pong), platformers, puzzle games, quiz games, card games, and even 3D experiences using Three.js. The AI supports both simple HTML5 Canvas games and more complex React-based applications.',
      },
      {
        id: 'need-coding',
        question: 'Do I need to know how to code?',
        answer: 'No coding experience is required! The AI will generate all the code for you based on your descriptions. However, if you do know how to code, you can view and edit the generated code directly in the code editor.',
      },
      {
        id: 'save-work',
        question: 'How do I save my work?',
        answer: 'Your work is automatically saved as you go. Every change you make or code the AI generates is persisted to your project. You can close the browser and come back anytime - your project will be exactly as you left it.',
      },
    ],
  },
  {
    id: 'templates',
    name: 'Templates',
    items: [
      {
        id: 'what-are-templates',
        question: 'What are templates?',
        answer: 'Templates are pre-configured starting points for common game types. They include the basic structure and mechanics already set up, so you can focus on customizing and adding your own features.',
      },
      {
        id: 'customize-templates',
        question: 'Can I customize templates?',
        answer: 'Absolutely! Templates are just a starting point. After selecting a template, you can ask the AI to modify any aspect - change colors, add features, modify gameplay mechanics, or completely transform the game.',
      },
    ],
  },
  {
    id: 'ai-chat',
    name: 'AI Chat',
    items: [
      {
        id: 'better-prompts',
        question: 'How can I write better prompts?',
        answer: 'Be specific about what you want. Instead of "make a game", try "Create a space shooter game where the player controls a spaceship with arrow keys and shoots lasers at incoming asteroids. Add a score counter and 3 lives." The more detail you provide, the better the result.',
      },
      {
        id: 'iterate-design',
        question: 'Can I iterate on the design?',
        answer: 'Yes! The AI remembers your conversation history. You can say things like "Make the player faster" or "Add a power-up that gives invincibility for 5 seconds" and the AI will modify the existing game.',
      },
      {
        id: 'fix-bugs',
        question: 'What if there\'s a bug in my game?',
        answer: 'Simply describe the bug to the AI. For example, "The player goes off screen when moving right" or "The score doesn\'t update when I collect coins." The AI will analyze and fix the issue.',
      },
      {
        id: 'credits-system',
        question: 'How does the credits system work?',
        answer: 'Each message you send to the AI uses one credit. Free users get 50 credits per day. Pro users get unlimited credits plus faster generation and priority support.',
      },
    ],
  },
  {
    id: 'code-editor',
    name: 'Code Editor',
    items: [
      {
        id: 'view-code',
        question: 'How do I view the code?',
        answer: 'Click the "Code" button at the bottom of the screen to open the code editor panel. You can view all the files in your project and see the generated code.',
      },
      {
        id: 'edit-code',
        question: 'Can I edit the code directly?',
        answer: 'Yes! You can edit any file in the code editor. Changes are applied immediately and you\'ll see the results in the preview. This is great for making small tweaks or learning how the code works.',
      },
      {
        id: 'multiple-files',
        question: 'Does it support multiple files?',
        answer: 'Yes, your project can have multiple files. The AI organizes code into separate files for components, styles, and game logic. You can navigate between files using the Files tab in the left panel.',
      },
    ],
  },
  {
    id: 'sharing',
    name: 'Sharing & Publishing',
    items: [
      {
        id: 'share-game',
        question: 'How do I share my game?',
        answer: 'Click the "Share" button in the header to get a shareable link. Anyone with the link can play your game directly in their browser.',
      },
      {
        id: 'publish-game',
        question: 'What does publishing do?',
        answer: 'Publishing makes your game publicly visible in the Discover section. Other users can find, play, and get inspired by your creation.',
      },
      {
        id: 'download-code',
        question: 'Can I download my code?',
        answer: 'Yes! Click the Export button in the header to download your project as a ZIP file. You can then host it anywhere or continue development in your own environment.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    items: [
      {
        id: 'preview-not-loading',
        question: 'The preview isn\'t loading',
        answer: 'Try refreshing the page. If the issue persists, check the Terminal for any error messages. You can also ask the AI to "check for and fix any errors in the code."',
      },
      {
        id: 'slow-generation',
        question: 'Why is generation slow?',
        answer: 'Complex games with lots of features take longer to generate. Free users may also experience slower speeds during peak hours. Pro users get priority processing.',
      },
      {
        id: 'lost-work',
        question: 'I lost my work!',
        answer: 'Don\'t panic! Your work is automatically saved. Go to the Projects page and find your project in the list. If you still can\'t find it, contact support through the Feedback button.',
      },
    ],
  },
];

// Flatten all FAQ items for search
export const ALL_FAQ_ITEMS = FAQ_CATEGORIES.flatMap((category) =>
  category.items.map((item) => ({
    ...item,
    category: category.name,
  }))
);
