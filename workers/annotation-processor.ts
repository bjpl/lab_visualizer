/**
 * Background worker for processing image annotations
 * Deploy this to Railway for automated ML processing
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface AnnotationQueueItem {
  id: string;
  image_id: string;
  target_colors: string[];
  attempts: number;
}

interface Image {
  id: string;
  url: string;
  unsplash_id: string;
}

/**
 * Main processing loop
 */
async function processAnnotationQueue() {
  console.log('Starting annotation processor...');

  while (true) {
    try {
      // Fetch pending annotations
      const { data: queueItems, error } = await supabase
        .from('annotation_queue')
        .select(`
          *,
          image:images(*)
        `)
        .eq('status', 'pending')
        .lt('attempts', 3)
        .order('created_at', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching queue:', error);
        await sleep(10000);
        continue;
      }

      if (!queueItems || queueItems.length === 0) {
        console.log('No pending annotations. Waiting...');
        await sleep(30000); // Wait 30 seconds
        continue;
      }

      console.log(`Processing ${queueItems.length} annotations...`);

      // Process each item
      for (const item of queueItems) {
        await processAnnotation(item);
        await sleep(2000); // Rate limiting
      }

    } catch (error) {
      console.error('Error in main loop:', error);
      await sleep(10000);
    }
  }
}

/**
 * Process a single annotation
 */
async function processAnnotation(queueItem: any) {
  const { id: queueId, image_id, target_colors, image } = queueItem;

  if (!image || !Array.isArray(image) || image.length === 0) {
    console.error(`No image found for queue item ${queueId}`);
    await markFailed(queueId, 'Image not found');
    return;
  }

  const imageData = Array.isArray(image) ? image[0] : image;

  try {
    console.log(`Processing annotation for image ${imageData.id}...`);

    // Mark as processing
    await supabase
      .from('annotation_queue')
      .update({ status: 'processing' })
      .eq('id', queueId);

    // Fetch colors info
    const { data: colors } = await supabase
      .from('colors')
      .select('*')
      .in('id', target_colors);

    const colorNames = colors?.map(c => c.name_es) || [];

    // Call Claude for annotation
    const annotation = await annotateWithClaude(imageData.url, colorNames);

    // Save annotation
    await supabase.from('annotations').insert({
      image_id: imageData.id,
      color_id: target_colors[0],
      description_basic: annotation.descriptionsInSpanish.basic,
      description_expanded: annotation.descriptionsInSpanish.expanded,
      phrases: annotation.contextualPhrases,
      confidence_score: annotation.confidenceScore,
      validated: false,
      metadata: {
        detected_colors: annotation.detectedColors,
        mood: annotation.colorAnalysis.mood,
      },
    });

    // Update image status
    await supabase
      .from('images')
      .update({ status: 'annotated' })
      .eq('id', imageData.id);

    // Mark queue item as complete
    await supabase
      .from('annotation_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', queueId);

    console.log(`✓ Successfully annotated image ${imageData.id}`);

  } catch (error) {
    console.error(`Error processing annotation:`, error);
    await markFailed(queueId, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Annotate image using Claude
 */
async function annotateWithClaude(imageUrl: string, targetColors: string[]) {
  // Fetch the image
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  const mediaType = contentType.includes('png') ? 'image/png' : 'image/jpeg';

  const prompt = `Analyze this image and provide Spanish color learning content.

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
    "3-5 example phrases using the colors in natural context"
  ],
  "colorAnalysis": {
    "dominantColors": ["array of 2-3 hex color codes"],
    "mood": "brief description of the visual mood/feeling"
  },
  "confidenceScore": 0.95,
  "difficulty": "basic or expanded"
}

Return only valid JSON, no additional text.`;

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
              media_type: mediaType as any,
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

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Mark annotation as failed
 */
async function markFailed(queueId: string, errorMessage: string) {
  const { data: current } = await supabase
    .from('annotation_queue')
    .select('attempts')
    .eq('id', queueId)
    .single();

  await supabase
    .from('annotation_queue')
    .update({
      status: 'failed',
      error_message: errorMessage,
      attempts: (current?.attempts || 0) + 1,
      processed_at: new Date().toISOString(),
    })
    .eq('id', queueId);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start the processor
console.log('Colores Annotation Processor');
console.log('Environment:', {
  supabaseUrl: SUPABASE_URL,
  hasAnthropicKey: !!ANTHROPIC_API_KEY,
});

processAnnotationQueue().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
