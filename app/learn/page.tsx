import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';

export default function LearnPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Choose Your Level</h1>
          <p className="text-lg text-gray-600">
            Select the learning path that matches your current Spanish knowledge
          </p>
        </div>

        {/* Level Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Basic Level */}
          <Card className="border-2 hover:border-blue-500 transition-all hover:shadow-xl">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-3xl">Nivel Básico</CardTitle>
              <CardDescription className="text-base">
                Perfect for beginners starting their Spanish journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What you'll learn:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>12 fundamental colors in Spanish</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>Simple, clear descriptions and contexts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>Basic conversational phrases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>Foundation for everyday communication</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <h3 className="font-semibold mb-3">Colors included:</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['rojo', 'azul', 'amarillo', 'verde', 'naranja', 'morado', 'rosa', 'negro', 'blanco'].map(
                    (color) => (
                      <div
                        key={color}
                        className="text-xs text-center py-1 px-2 bg-gray-100 rounded"
                      >
                        {color}
                      </div>
                    )
                  )}
                </div>
              </div>

              <Link href="/learn/basic" className="block pt-4">
                <Button className="w-full" size="lg">
                  Start Basic Level
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Expanded Level */}
          <Card className="border-2 hover:border-purple-500 transition-all hover:shadow-xl">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-3xl">Nivel Avanzado</CardTitle>
              <CardDescription className="text-base">
                Expand your vocabulary with shades and variations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What you'll learn:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">✓</span>
                    <span>24+ color variations and shades</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">✓</span>
                    <span>Rich, descriptive Spanish vocabulary</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">✓</span>
                    <span>Complex phrases and cultural context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">✓</span>
                    <span>Advanced conversational skills</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <h3 className="font-semibold mb-3">Colors included:</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    'turquesa',
                    'coral',
                    'lavanda',
                    'borgoña',
                    'azul marino',
                    'verde lima',
                    'rosa fuerte',
                    'gris claro',
                    'beige',
                  ].map((color) => (
                    <div
                      key={color}
                      className="text-xs text-center py-1 px-2 bg-gray-100 rounded"
                    >
                      {color}
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/learn/expanded" className="block pt-4">
                <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                  Start Advanced Level
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Link href="/progress">
            <Button variant="outline">View Progress</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
