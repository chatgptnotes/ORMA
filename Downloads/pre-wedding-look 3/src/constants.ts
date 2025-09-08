import { HairstyleOption } from './types';

export const BRIDE_HAIRSTYLES: HairstyleOption[] = [
  {
    id: 'bride-1',
    name: 'Elegant Updo',
    description: 'Classic bridal updo with soft curls and floral accents',
    category: 'bride',
    prompt: 'Create an elegant bridal updo hairstyle with soft romantic curls, adorned with delicate flowers and pearl accessories. The style should be sophisticated and wedding-appropriate with a timeless, classic look.'
  },
  {
    id: 'bride-2',
    name: 'Loose Waves',
    description: 'Romantic loose waves with braided details',
    category: 'bride',
    prompt: 'Style the hair into romantic loose waves with subtle braided elements on the sides. Add soft highlights and a natural, glowing finish that looks effortless yet polished for a wedding.'
  },
  {
    id: 'bride-3',
    name: 'Half-Up Crown',
    description: 'Half-up style with intricate braided crown',
    category: 'bride',
    prompt: 'Create a half-up hairstyle featuring an intricate braided crown at the top, with the remaining hair flowing in soft, voluminous waves. Add subtle hair accessories for a bohemian bridal look.'
  },
  {
    id: 'bride-4',
    name: 'Side-Swept Glamour',
    description: 'Hollywood glamour with side-swept curls',
    category: 'bride',
    prompt: 'Style the hair in classic Hollywood glamour with deep side-swept waves, featuring vintage-inspired curls that cascade elegantly over one shoulder. Add shine and volume for a red-carpet worthy bridal look.'
  }
];

export const GROOM_HAIRSTYLES: HairstyleOption[] = [
  {
    id: 'groom-1',
    name: 'Classic Pompadour',
    description: 'Timeless pompadour with modern styling',
    category: 'groom',
    prompt: 'Create a classic pompadour hairstyle with modern touches. The hair should be swept back and up with good volume, neatly styled with a subtle shine. Professional and wedding-appropriate.'
  },
  {
    id: 'groom-2',
    name: 'Textured Quiff',
    description: 'Modern textured quiff with fade',
    category: 'groom',
    prompt: 'Style the hair into a modern textured quiff with subtle fading on the sides. The top should have natural texture and movement while maintaining a sharp, contemporary look suitable for weddings.'
  },
  {
    id: 'groom-3',
    name: 'Side Part Classic',
    description: 'Traditional side-parted gentleman style',
    category: 'groom',
    prompt: 'Create a classic side-parted hairstyle with a clean, sharp part line. The hair should be neatly combed and styled with a sophisticated finish, perfect for formal wedding occasions.'
  },
  {
    id: 'groom-4',
    name: 'Slicked Back',
    description: 'Sleek slicked-back style',
    category: 'groom',
    prompt: 'Style the hair in a sleek slicked-back look with a smooth, polished finish. The hair should be combed straight back with a subtle shine, creating an elegant and timeless groom appearance.'
  }
];

export const ALL_HAIRSTYLES = [...BRIDE_HAIRSTYLES, ...GROOM_HAIRSTYLES];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CHAT_PROMPTS = {
  WELCOME: "Hi! I'm your AI styling assistant. I can help you choose the perfect hairstyle for your pre-wedding photos. What kind of look are you going for?",
  STYLE_RECOMMENDATION: "Based on your photo, I'd recommend these styles that would complement your features beautifully:",
  PROCESSING: "I'm analyzing your photo and generating your styled look. This may take a moment...",
  ERROR: "I'm sorry, I encountered an issue processing your request. Please try again or contact support if the problem persists."
};