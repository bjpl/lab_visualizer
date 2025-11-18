import Anthropic from '@anthropic-ai/sdk';
import { AnnotationResponse } from '@/types/api';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Annotate an image with Claude Vision
 */
export async function annotateImageWithClaude(
  imageUrl: string,
  targetColors: string[]
): Promise<AnnotationResponse> {
  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Determine media type
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const mediaType = contentType.includes('png')
      ? 'image/png'
      : contentType.includes('gif')
      ? 'image/gif'
      : contentType.includes('webp')
      ? 'image/webp'
      : 'image/jpeg';

    const prompt = buildAnnotationPrompt(targetColors);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
    }

    const annotation: AnnotationResponse = JSON.parse(jsonMatch[0]);
    return annotation;

  } catch (error) {
    console.error('Error annotating image with Claude:', error);
    throw error;
  }
}

/**
 * Build annotation prompt for Claude
 */
function buildAnnotationPrompt(targetColors: string[]): string {
  return `Analyze this image and provide Spanish color learning content.

Target colors to focus on: ${targetColors.join(', ')}

Provide your response in JSON format with this exact structure:
{
  "detectedColors": ["array of color names in Spanish"],
  "primary": "the most dominant color in Spanish",
  "descriptionsInSpanish": {
    "basic": "a simple, clear description suitable for beginners (1-2 sentences)",
    "expanded": "a more detailed, vivid description with adjectives (2-3 sentences)"
  },
  "contextualPhrases": [
    "3-5 example phrases using the colors in natural context",
    "Each phrase should be conversational and appropriate for Spanish learners",
    "Include variety: some simple, some more complex"
  ],
  "colorAnalysis": {
    "dominantColors": ["array of 2-3 hex color codes"],
    "mood": "brief description of the visual mood/feeling"
  },
  "confidenceScore": 0.95,
  "difficulty": "basic or expanded"
}

Guidelines:
- Use natural, conversational Spanish appropriate for language learners
- Make descriptions vivid and memorable
- Include cultural context where relevant
- Phrases should demonstrate practical usage of color vocabulary
- Basic descriptions: simple vocabulary, present tense
- Expanded descriptions: richer vocabulary, varied tenses, adjectives
- Ensure all Spanish text has proper accents and spelling

Example phrases style:
- "El cielo es azul brillante hoy"
- "Las hojas verdes oscuras del árbol"
- "Una rosa roja hermosa en el jardín"

Return only valid JSON, no additional text.`;
}

/**
 * Generate quiz questions using Claude
 */
export async function generateQuizQuestions(
  colors: Array<{ id: string; name_es: string; name_en: string }>,
  level: 'basic' | 'expanded',
  count: number
): Promise<any[]> {
  const prompt = `Generate ${count} Spanish color quiz questions for ${level} level learners.

Available colors:
${colors.map(c => `- ${c.name_es} (${c.name_en})`).join('\n')}

Create varied question types:
1. Multiple choice color identification
2. Fill in the blank sentences
3. Color matching
4. Contextual usage

Return JSON array of questions with this structure:
[
  {
    "type": "multiple-choice",
    "question": "question text in Spanish",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "correct option",
    "explanation": "brief explanation in Spanish",
    "colorId": "id of the color being tested"
  }
]

Make questions engaging and contextual. Return only valid JSON.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate learning feedback using Claude
 */
export async function generateLearningFeedback(
  colorName: string,
  masteryLevel: number,
  recentPerformance: { correct: number; total: number }
): Promise<string> {
  const prompt = `You are a supportive Spanish language tutor. Generate encouraging feedback for a student learning the color "${colorName}".

Student stats:
- Overall mastery: ${masteryLevel}%
- Recent performance: ${recentPerformance.correct}/${recentPerformance.total} correct

Provide brief (1-2 sentences), personalized feedback in Spanish that:
- Acknowledges their progress
- Offers specific encouragement
- Suggests next steps if needed

Keep it warm, supportive, and motivating.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return message.content[0].type === 'text'
    ? message.content[0].text
    : '';
}
