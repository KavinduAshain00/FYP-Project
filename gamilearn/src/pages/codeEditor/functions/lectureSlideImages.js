// Context-relevant images for lecture slides: { keywords, url }
export const SLIDE_IMAGES = [
  {
    keywords: ["console", "log", "print", "output", "debug"],
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop",
  },
  {
    keywords: ["variable", "const", "let", "var", "assign", "data type"],
    url: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop",
  },
  {
    keywords: ["loop", "for", "while", "iterate", "array"],
    url: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=400&fit=crop",
  },
  {
    keywords: ["function", "call", "return", "parameter"],
    url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop",
  },
  {
    keywords: ["game", "canvas", "sprite", "player", "score"],
    url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop",
  },
  {
    keywords: ["react", "component", "hooks", "hook"],
    url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop",
  },
  {
    keywords: ["state", "usestate", "event", "click"],
    url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
  },
  {
    keywords: ["multiplayer", "server", "socket", "network"],
    url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop",
  },
  {
    keywords: ["condition", "if", "else", "switch"],
    url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop",
  },
  {
    keywords: ["html", "css", "dom", "element"],
    url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop",
  },
];

export const DEFAULT_SLIDE_IMAGE =
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop";

export function getSlideImage(slideContent, moduleTitle, category) {
  const text = `${(slideContent || "").toLowerCase()} ${(moduleTitle || "").toLowerCase()} ${(category || "").toLowerCase()}`;
  let best = { score: 0, url: DEFAULT_SLIDE_IMAGE };
  for (const { keywords, url } of SLIDE_IMAGES) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += 1;
    }
    if (score > best.score) best = { score, url };
  }
  return best.url;
}
