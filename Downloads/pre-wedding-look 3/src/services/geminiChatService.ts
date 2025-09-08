import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'demo-key');

interface ChatContext {
  hasImage: boolean;
  selectedStyle: string | null;
  context: string;
}

export async function getChatResponse(
  message: string,
  context: ChatContext
): Promise<string> {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'demo-key') {
      // Demo responses
      return getDemoResponse(message, context);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = `You are an expert AI hairstylist and beauty consultant specializing in pre-wedding styling. 
    You provide personalized advice about hairstyles, makeup, and beauty preparation for weddings and pre-wedding photoshoots.

    Context:
    - User has ${context.hasImage ? 'uploaded a photo' : 'not uploaded a photo yet'}
    - Selected style: ${context.selectedStyle || 'none selected'}
    - Focus: ${context.context}

    Guidelines:
    - Be encouraging and positive
    - Provide specific, actionable advice
    - Consider face shapes, hair types, and wedding themes
    - Suggest complementary makeup and accessories when relevant
    - Keep responses concise but helpful (2-3 sentences max)
    - Use emojis sparingly but appropriately
    `;

    const fullPrompt = `${systemPrompt}

    User question: ${message}

    Please provide a helpful, personalized response:`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error('Chat service error:', error);
    return "I'm having trouble connecting right now. Please try again in a moment, or feel free to ask your question differently!";
  }
}

function getDemoResponse(message: string, context: ChatContext): string {
  const lowerMessage = message.toLowerCase();

  // Face shape questions
  if (lowerMessage.includes('face shape')) {
    return "Great question! 💫 Face shape is key to choosing the perfect hairstyle. Oval faces work with most styles, round faces benefit from volume on top, square faces look great with soft waves, and heart-shaped faces suit side-swept styles. If you upload your photo, I can give you more personalized advice!";
  }

  // Hair preparation
  if (lowerMessage.includes('prepare') || lowerMessage.includes('preparation')) {
    return "Perfect timing to ask! ✨ Start preparing 2-3 weeks before: deep condition weekly, avoid major cuts 2 weeks prior, do a trial run of your chosen style, and use a clarifying shampoo the night before. Day-of: wash with sulfate-free shampoo and use a light leave-in conditioner for styling hold.";
  }

  // Accessories
  if (lowerMessage.includes('accessories') || lowerMessage.includes('accessory')) {
    return "Beautiful accessories can elevate any hairstyle! 👑 For updos: delicate hair pins, pearl combs, or a subtle tiara work wonderfully. For loose styles: try a jeweled headband, scattered hairpins, or floral accents. The key is choosing pieces that complement your dress and personal style without overwhelming the look.";
  }

  // Makeup coordination
  if (lowerMessage.includes('makeup')) {
    return "Makeup and hair should work in harmony! 💄 If you choose an elaborate updo, you can go bolder with makeup. For romantic loose waves, keep makeup soft and glowing. Always do a trial run together, use long-wearing formulas, and bring touch-up products for the day. Consider your photo lighting too!";
  }

  // Style-specific advice
  if (context.selectedStyle) {
    return `Excellent choice with ${context.selectedStyle}! 🌟 This style photographs beautifully and will complement your features well. Make sure to schedule a trial run 1-2 weeks before, and consider the weather and venue when finalizing the look. Would you like specific tips for maintaining this style throughout the day?`;
  }

  // General styling advice
  if (lowerMessage.includes('style') || lowerMessage.includes('hairstyle')) {
    if (!context.hasImage) {
      return "I'd love to help you choose the perfect style! 📸 Upload your photo so I can give you personalized recommendations based on your face shape and features. In the meantime, consider your dress style, venue, and personal comfort when thinking about options.";
    }
    return "Based on your photo, you have so many beautiful options! 🌸 I'd recommend trying a few different styles to see what feels most 'you'. Consider your wedding theme, dress neckline, and how you want to feel on your special day. What type of vibe are you going for - classic elegance, bohemian romance, or modern chic?";
  }

  // Default helpful response
  const defaultResponses = [
    "That's a great question! 💫 I'm here to help make your pre-wedding styling perfect. Feel free to ask about hairstyles, face shapes, preparation tips, or anything beauty-related!",
    "I love helping with pre-wedding styling! ✨ Whether it's choosing the right hairstyle, coordinating with makeup, or preparation tips, I'm here to guide you to look absolutely stunning.",
    "Wonderful question! 🌟 Pre-wedding styling is all about enhancing your natural beauty. I can help with hairstyle selection, preparation advice, accessory choices, and making sure everything coordinates beautifully."
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export async function getStyleRecommendations(
  faceShape: string,
  hairType?: string,
  preferences?: string[]
): Promise<string[]> {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY === 'demo-key') {
      // Demo recommendations based on face shape
      const recommendations = {
        'oval': [
          'You can pull off almost any hairstyle!',
          'Try a classic updo for timeless elegance',
          'Loose waves would look romantic and soft',
          'Consider a half-up style for versatility'
        ],
        'round': [
          'Styles with height on top will elongate your face',
          'Side-swept styles are very flattering',
          'Avoid styles that add width at the sides',
          'A sleek updo can create a sophisticated look'
        ],
        'square': [
          'Soft, romantic waves will soften angular features',
          'Side parts work better than center parts',
          'Avoid blunt cuts or severe updos',
          'Consider styles with movement and texture'
        ],
        'heart': [
          'Side-swept bangs can balance a wider forehead',
          'Styles with volume at the jawline are flattering',
          'Avoid excessive height on top',
          'Soft updos with face-framing pieces work well'
        ]
      };

      return recommendations[faceShape as keyof typeof recommendations] || recommendations.oval;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
      Provide 4 specific hairstyle recommendations for someone with:
      - Face shape: ${faceShape}
      - Hair type: ${hairType || 'not specified'}
      - Preferences: ${preferences?.join(', ') || 'none specified'}
      
      Focus on pre-wedding/bridal styling. Return as a simple array of recommendation strings.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse recommendations or return defaults
    try {
      return text.split('\\n').filter(line => line.trim().length > 0).slice(0, 4);
    } catch {
      return [
        'Classic styles work well for your features',
        'Consider your personal style and comfort',
        'Trial runs are essential for wedding styling',
        'Consult with a professional stylist for best results'
      ];
    }

  } catch (error) {
    console.error('Error getting style recommendations:', error);
    return [
      'Unable to provide recommendations at the moment',
      'Please try again or consult with a professional stylist'
    ];
  }
}