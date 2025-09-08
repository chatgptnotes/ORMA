# Pre-Wedding Look Styler 💄✨

An AI-powered hairstyle generation app for pre-wedding photoshoots. Transform your photos with intelligent styling recommendations using Google Gemini AI.

![Pre-Wedding Styler](https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=400&fit=crop&crop=face)

## Features

🌟 **AI-Powered Styling**: Generate personalized hairstyle recommendations using Google Gemini AI
📸 **Photo Upload & Camera**: Upload photos or capture directly with your camera
👰 **Bride & Groom Styles**: Specialized hairstyle options for both brides and grooms
🤖 **AI Chat Assistant**: Get styling advice and tips from our intelligent chatbot
📱 **Mobile Responsive**: Perfect experience on all devices
⚡ **Real-time Generation**: Fast AI-powered image processing

## Tech Stack

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Google Gemini AI** - Advanced AI for image analysis and chat
- **Modern CSS** - Responsive design with gradients and animations

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/chatgptnotes/pre-wedding-look.git
   cd pre-wedding-look
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Add your Google Gemini API key
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env.local` file with:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

1. **Upload Your Photo**: Drag & drop or click to upload your photo, or use the camera to take a new one
2. **Choose Your Style**: Select from bride or groom hairstyle categories
3. **Generate**: Click on any style to generate your personalized look
4. **Chat with AI**: Ask our styling assistant for personalized advice
5. **Download**: Save your styled images for your photoshoot

## Available Hairstyles

### 👰 Bride Styles
- **Elegant Updo**: Classic bridal updo with soft curls and floral accents
- **Loose Waves**: Romantic loose waves with braided details
- **Half-Up Crown**: Half-up style with intricate braided crown
- **Side-Swept Glamour**: Hollywood glamour with side-swept curls

### 🤵 Groom Styles
- **Classic Pompadour**: Timeless pompadour with modern styling
- **Textured Quiff**: Modern textured quiff with fade
- **Side Part Classic**: Traditional side-parted gentleman style
- **Slicked Back**: Sleek slicked-back style

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Header.tsx
│   ├── ImageUploader.tsx
│   ├── CameraCapture.tsx
│   ├── OptionSelector.tsx
│   ├── ImageDisplay.tsx
│   └── Chatbot.tsx
├── services/           # API services
│   ├── geminiService.ts
│   └── geminiChatService.ts
├── types.ts           # TypeScript definitions
├── constants.ts       # App constants
└── App.tsx           # Main app component
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Demo Mode

The app includes a demo mode that works without API keys, using placeholder images and responses. Perfect for testing and development.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Google Gemini AI** for powerful image analysis and chat capabilities
- **Unsplash** for beautiful demo images
- **React Team** for the amazing framework
- **Vite** for lightning-fast development experience

---

Made with ❤️ for beautiful pre-wedding moments

✨ **Pre-Wedding Look Styler** - Transform your special moments with AI ✨