import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, BookOpen, Trophy, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Colores
        </h1>
        <p className="text-2xl text-gray-700 mb-8">
          Aprende los colores en español
        </p>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Learn Spanish colors through beautiful, AI-annotated imagery.
          Master vocabulary with spaced repetition and interactive quizzes.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/learn">
            <Button size="lg" className="text-lg px-8">
              Start Learning
            </Button>
          </Link>
          <Link href="/quiz">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Take a Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <Card className="border-2 hover:border-blue-500 transition-all">
          <CardHeader>
            <Palette className="w-12 h-12 text-blue-500 mb-2" />
            <CardTitle>Rich Visual Learning</CardTitle>
            <CardDescription>
              High-quality images from Unsplash showcase colors in real-world contexts
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-2 hover:border-purple-500 transition-all">
          <CardHeader>
            <Sparkles className="w-12 h-12 text-purple-500 mb-2" />
            <CardTitle>AI-Powered Annotations</CardTitle>
            <CardDescription>
              Claude Sonnet 4.5 generates contextual descriptions and example phrases
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-2 hover:border-pink-500 transition-all">
          <CardHeader>
            <BookOpen className="w-12 h-12 text-pink-500 mb-2" />
            <CardTitle>Two Learning Levels</CardTitle>
            <CardDescription>
              Start with 12 basic colors, advance to 24+ expanded vocabulary
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-2 hover:border-orange-500 transition-all">
          <CardHeader>
            <Trophy className="w-12 h-12 text-orange-500 mb-2" />
            <CardTitle>Track Progress</CardTitle>
            <CardDescription>
              Spaced repetition system adapts to your learning pace
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Color Preview Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Preview: Basic Colors
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { es: 'rojo', en: 'red', hex: '#FF0000' },
            { es: 'azul', en: 'blue', hex: '#0000FF' },
            { es: 'amarillo', en: 'yellow', hex: '#FFFF00' },
            { es: 'verde', en: 'green', hex: '#00FF00' },
            { es: 'naranja', en: 'orange', hex: '#FFA500' },
            { es: 'morado', en: 'purple', hex: '#800080' },
            { es: 'rosa', en: 'pink', hex: '#FFC0CB' },
            { es: 'negro', en: 'black', hex: '#000000' },
            { es: 'blanco', en: 'white', hex: '#FFFFFF' },
            { es: 'gris', en: 'gray', hex: '#808080' },
            { es: 'marrón', en: 'brown', hex: '#8B4513' },
            { es: 'celeste', en: 'sky blue', hex: '#87CEEB' },
          ].map((color) => (
            <Card
              key={color.es}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div
                className="h-24"
                style={{ backgroundColor: color.hex }}
              />
              <CardContent className="p-3 text-center">
                <p className="font-semibold">{color.es}</p>
                <p className="text-xs text-gray-500">{color.en}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          How It Works
        </h2>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <CardTitle>Choose Your Level</CardTitle>
                  <CardDescription className="mt-2">
                    Start with basic colors or dive into expanded vocabulary with shades and variations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <CardTitle>Study with Images</CardTitle>
                  <CardDescription className="mt-2">
                    Each color comes with beautiful, curated images and AI-generated Spanish descriptions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <CardTitle>Practice with Quizzes</CardTitle>
                  <CardDescription className="mt-2">
                    Test your knowledge with interactive quizzes featuring image recognition and contextual phrases
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <div className="flex-1">
                  <CardTitle>Track Your Progress</CardTitle>
                  <CardDescription className="mt-2">
                    Our spaced repetition algorithm ensures you review at optimal intervals for long-term retention
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-16">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
          <CardHeader>
            <CardTitle className="text-3xl">
              Ready to Start?
            </CardTitle>
            <CardDescription className="text-white/90 text-lg">
              Join thousands of learners mastering Spanish colors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/learn">
              <Button size="lg" variant="secondary" className="text-lg px-12">
                Begin Learning Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
