# 🫀 Cuerpo Humano - Interactive Spanish Learning Platform

An elegant, modern web application for learning Spanish body part vocabulary through interactive image annotation and visual learning.

## ✨ Features

### 🎯 Three Learning Modes

1. **Study Mode**
   - Explore labeled body parts at your own pace
   - Filter by category (head, torso, arms, legs, etc.)
   - Toggle labels on/off
   - Click markers for detailed information

2. **Quiz Mode**
   - Test your knowledge interactively
   - Click on body parts to answer questions
   - Real-time feedback and scoring
   - Track your accuracy

3. **Challenge Mode**
   - 60-second rapid-fire challenge
   - Beat your high score
   - Gamified learning experience
   - Perfect for quick practice sessions

### 🎨 Modern Design

- **Sophisticated UI** with Tailwind CSS
- **Dark Mode** support
- **Smooth Animations** with Framer Motion
- **Responsive Design** for all devices
- **Progressive Web App** capabilities
- **Accessibility** features built-in

### 🖼️ Image Integration

- High-quality anatomical images from Unsplash
- Fallback images for demo mode
- Multiple image perspectives

### 📊 Progress Tracking

- Persistent storage with Zustand
- Track mastered vocabulary
- Study time statistics
- Quiz scores and accuracy

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cuerpo_humano
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure Unsplash API:
   - Copy `.env.example` to `.env`
   - Get a free API key at [unsplash.com/developers](https://unsplash.com/developers)
   - Add your key to `.env`:
     ```
     VITE_UNSPLASH_ACCESS_KEY=your_key_here
     ```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Built With

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Zustand** - State management
- **Unsplash API** - High-quality images
- **Vite PWA** - Progressive web app

## 📁 Project Structure

```
src/
├── components/
│   ├── annotation/
│   │   ├── AnnotationMarker.tsx   # Interactive markers
│   │   └── AnnotationLayer.tsx    # Annotation overlay
│   ├── modes/
│   │   ├── StudyMode.tsx          # Study interface
│   │   ├── QuizMode.tsx           # Quiz interface
│   │   └── ChallengeMode.tsx      # Challenge interface
│   └── Header.tsx                  # App header
├── data/
│   └── bodyParts.ts               # Spanish vocabulary data
├── services/
│   └── unsplashApi.ts             # Image fetching
├── store/
│   └── useStore.ts                # Global state
├── types/
│   └── index.ts                   # TypeScript types
├── App.tsx                         # Main app component
├── main.tsx                        # Entry point
└── index.css                       # Global styles
```

## 🎓 Vocabulary Included

The app includes 40+ Spanish body parts across categories:

- **Head** - cabeza, ojos, nariz, boca, orejas, etc.
- **Torso** - pecho, espalda, estómago, etc.
- **Arms** - brazo, codo, muñeca, etc.
- **Hands** - mano, dedos, pulgar, etc.
- **Legs** - pierna, rodilla, tobillo, etc.
- **Feet** - pie, dedos del pie, talón, etc.
- **Organs** - corazón, cerebro, pulmones, etc.

## 🎯 SPARC Methodology

This project was built following the SPARC framework:

- **S**pecification - Clear requirements and user stories
- **P**seudocode - Logical flow planning
- **A**rchitecture - Component hierarchy and data flow
- **R**efinement - Performance and UX optimizations
- **C**ompletion - Testing and quality metrics

See [SPARC_SPEC.md](./SPARC_SPEC.md) for detailed documentation.

## 📦 Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 🌐 Deploy

The app can be deployed to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning and teaching!

## 🙏 Acknowledgments

- Images from [Unsplash](https://unsplash.com)
- Icons from [Lucide](https://lucide.dev)
- Inspired by modern language learning platforms

---

**¡Aprende español de manera divertida e interactiva!** 🎉
