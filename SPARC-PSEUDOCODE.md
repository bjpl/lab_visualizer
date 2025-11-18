# SPARC Pseudocode - Core Workflows

## 1. ML-Powered Annotation Workflow

```pseudocode
FUNCTION annotateImageWithClaude(imageUrl, targetColors):
  // Download and analyze image
  imageData = fetchImage(imageUrl)

  // Prepare Claude prompt
  prompt = buildAnnotationPrompt(imageData, targetColors)

  // Call Claude API with vision
  response = claudeAPI.messages.create({
    model: "claude-sonnet-4-5-20250929",
    messages: [{
      role: "user",
      content: [
        { type: "image", source: imageData },
        { type: "text", text: prompt }
      ]
    }]
  })

  // Parse structured response
  annotation = parseAnnotation(response)

  RETURN {
    colors: annotation.detectedColors,
    primaryColor: annotation.primary,
    descriptions: annotation.descriptionsInSpanish,
    phrases: annotation.contextualPhrases,
    confidence: annotation.confidenceScore,
    metadata: {
      dominantColors: annotation.colorAnalysis,
      suggestedLevel: annotation.difficulty
    }
  }

FUNCTION buildAnnotationPrompt(imageData, targetColors):
  RETURN """
  Analyze this image and provide Spanish color learning content:

  Target colors: {targetColors}

  Provide in JSON format:
  {
    "detectedColors": ["color names in Spanish"],
    "primary": "dominant color in Spanish",
    "descriptionsInSpanish": {
      "basic": "simple description for beginners",
      "expanded": "detailed description with adjectives"
    },
    "contextualPhrases": [
      "Example phrases using the colors in context"
    ],
    "colorAnalysis": {
      "dominantColors": ["hex codes"],
      "mood": "visual mood description"
    },
    "confidenceScore": 0.0-1.0,
    "difficulty": "basic" | "expanded"
  }

  Focus on natural, conversational Spanish appropriate for learners.
  """
```

## 2. Image Fetching from Unsplash

```pseudocode
FUNCTION fetchImagesForColor(colorName, level, count=10):
  // Build search query
  query = buildUnsplashQuery(colorName, level)

  // Check cache first
  cachedImages = checkSupabaseCache(colorName, level)
  IF cachedImages.length >= count:
    RETURN cachedImages.slice(0, count)

  // Fetch from Unsplash
  response = unsplashAPI.search.photos({
    query: query,
    per_page: count,
    orientation: "landscape",
    order_by: "relevant"
  })

  // Process and cache images
  images = []
  FOR EACH photo IN response.results:
    imageRecord = {
      unsplashId: photo.id,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.small,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadLocation: photo.links.download_location
    }

    // Store in Supabase
    savedImage = supabase.from('images').insert(imageRecord)

    // Trigger async annotation
    queueAnnotation(savedImage.id, colorName)

    images.push(savedImage)

  RETURN images

FUNCTION buildUnsplashQuery(colorName, level):
  IF level == "basic":
    RETURN `${colorName} vibrant clear simple`
  ELSE:
    RETURN `${colorName} beautiful artistic detailed`
```

## 3. Learning Session Flow

```pseudocode
FUNCTION startLearningSession(userId, level):
  // Get user's current progress
  progress = getUserProgress(userId, level)

  // Determine next colors to study (spaced repetition)
  colorsToStudy = selectColorsForReview(progress, level)

  // Fetch annotated images for each color
  session = {
    userId: userId,
    level: level,
    cards: []
  }

  FOR EACH color IN colorsToStudy:
    images = getAnnotatedImages(color.id, limit=3)

    card = {
      colorId: color.id,
      colorName: color.name_es,
      colorHex: color.hex_code,
      images: images,
      currentMastery: progress[color.id].mastery
    }

    session.cards.push(card)

  RETURN session

FUNCTION selectColorsForReview(progress, level):
  // Spaced repetition algorithm
  colors = getColorsByLevel(level)

  reviewQueue = []
  FOR EACH color IN colors:
    userProgress = progress[color.id]

    IF userProgress IS NULL:
      // New color
      reviewQueue.push({ color, priority: 10 })
    ELSE IF userProgress.nextReview <= NOW():
      // Due for review
      priority = calculatePriority(userProgress)
      reviewQueue.push({ color, priority })

  // Sort by priority and select top N
  reviewQueue.sort(BY priority DESC)
  RETURN reviewQueue.slice(0, 5).map(item => item.color)

FUNCTION calculatePriority(userProgress):
  daysSinceReview = (NOW() - userProgress.lastReviewed) / DAY
  masteryFactor = (100 - userProgress.mastery) / 100

  RETURN daysSinceReview * masteryFactor * 10
```

## 4. Interactive Quiz Flow

```pseudocode
FUNCTION generateColorQuiz(userId, level, questionCount=10):
  colors = getColorsByLevel(level)
  questions = []

  FOR i = 1 TO questionCount:
    questionType = randomChoice(["image-to-text", "text-to-image", "phrase-match"])

    SWITCH questionType:
      CASE "image-to-text":
        question = generateImageToTextQuestion(colors)
      CASE "text-to-image":
        question = generateTextToImageQuestion(colors)
      CASE "phrase-match":
        question = generatePhraseMatchQuestion(colors)

    questions.push(question)

  RETURN {
    quizId: generateId(),
    userId: userId,
    level: level,
    questions: questions,
    startedAt: NOW()
  }

FUNCTION generateImageToTextQuestion(colors):
  correctColor = randomChoice(colors)
  image = getRandomAnnotatedImage(correctColor.id)

  // Generate distractors (wrong answers)
  distractors = getRandomColors(colors, 3, exclude=correctColor.id)
  options = shuffle([correctColor, ...distractors])

  RETURN {
    type: "multiple-choice",
    prompt: "¿Qué color ves en esta imagen?",
    image: image.url,
    options: options.map(c => ({
      id: c.id,
      text: c.name_es
    })),
    correctAnswer: correctColor.id
  }

FUNCTION evaluateAnswer(quizId, questionId, answer):
  question = getQuestion(quizId, questionId)
  isCorrect = (answer == question.correctAnswer)

  // Update user progress
  IF isCorrect:
    incrementCorrectCount(userId, question.colorId)
    updateMastery(userId, question.colorId, +5)
  ELSE:
    incrementIncorrectCount(userId, question.colorId)
    updateMastery(userId, question.colorId, -3)

  // Update next review date (spaced repetition)
  updateNextReview(userId, question.colorId, isCorrect)

  RETURN {
    correct: isCorrect,
    explanation: question.annotation.descriptions.basic,
    correctAnswer: question.correctAnswer
  }
```

## 5. Annotation Review Workflow (Admin)

```pseudocode
FUNCTION getAnnotationsPendingReview():
  RETURN supabase
    .from('annotations')
    .select('*, images(*), colors(*)')
    .eq('validated', false)
    .order('created_at', ascending=true)
    .limit(20)

FUNCTION reviewAnnotation(annotationId, action, feedback):
  annotation = getAnnotation(annotationId)

  SWITCH action:
    CASE "approve":
      updateAnnotation(annotationId, {
        validated: true,
        validatedAt: NOW(),
        validatorId: getCurrentUserId()
      })

      // Mark image as ready for learning
      updateImage(annotation.imageId, { status: 'approved' })

    CASE "reject":
      updateAnnotation(annotationId, {
        validated: false,
        rejectionReason: feedback
      })

      // Queue for re-annotation
      queueReannotation(annotation.imageId)

    CASE "edit":
      updateAnnotation(annotationId, {
        description_es: feedback.description,
        phrases: feedback.phrases,
        validated: true,
        validatedAt: NOW(),
        validatorId: getCurrentUserId()
      })

  RETURN { success: true }
```

## 6. Progressive Learning Path

```pseudocode
FUNCTION getUserLearningPath(userId):
  progress = getUserProgress(userId)

  // Calculate overall mastery
  basicMastery = calculateAverageMastery(progress, level="basic")
  expandedMastery = calculateAverageMastery(progress, level="expanded")

  // Determine current level and recommendations
  currentLevel = basicMastery >= 70 ? "expanded" : "basic"

  // Get recommended next steps
  IF basicMastery < 70:
    recommendations = getWeakColors(progress, "basic")
    message = "Focus on mastering basic colors"
  ELSE IF expandedMastery < 70:
    recommendations = getWeakColors(progress, "expanded")
    message = "Great! Now explore expanded vocabulary"
  ELSE:
    recommendations = getMixedReview(progress)
    message = "Excellent! Keep practicing both levels"

  RETURN {
    currentLevel: currentLevel,
    basicMastery: basicMastery,
    expandedMastery: expandedMastery,
    recommendations: recommendations,
    message: message,
    totalWordsLearned: countMasteredColors(progress),
    streakDays: calculateStreak(userId)
  }
```

## 7. Real-time Image Processing Pipeline

```pseudocode
BACKGROUND_JOB processNewImages():
  WHILE true:
    // Poll for unprocessed images
    images = supabase
      .from('images')
      .select()
      .is('annotations', null)
      .limit(5)

    FOR EACH image IN images:
      TRY:
        // Run ML annotation
        annotation = annotateImageWithClaude(
          image.url,
          targetColors=image.targetColors
        )

        // Save annotation
        supabase.from('annotations').insert({
          imageId: image.id,
          colorId: image.primaryColorId,
          description_es: annotation.descriptions,
          phrases: annotation.phrases,
          confidence_score: annotation.confidence,
          validated: false
        })

        // Update image status
        supabase.from('images')
          .update({ status: 'annotated' })
          .eq('id', image.id)

      CATCH error:
        LOG error
        markImageAsFailedProcessing(image.id, error)

    SLEEP 30 seconds
```

---

This pseudocode provides the logical structure for implementing the core features. Next step is to design the detailed architecture.
