import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface FoodAnalysisRequest {
  userId: string
  imageBase64: string
  scanMode: 'food' | 'barcode' | 'label'
}

interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  confidence: number
}

interface FoodItem {
  name: string
  quantity: string
  nutrition: NutritionData
  isFood?: boolean
  message?: string
}

interface FoodAnalysisResponse {
  success: boolean
  foodItems?: FoodItem[]
  error?: string
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

/**
 * Creates robust prompts optimized for Indian cuisine and food recognition
 */
function getFoodAnalysisPrompt(): string {
  return `You are a highly accurate food nutrition expert specializing in Indian and international cuisines. 
Analyze this food image and provide detailed nutritional information.

CRITICAL: Your response MUST be valid JSON format only. Do not include any explanatory text, descriptions, or additional content. Only return the JSON structure specified below.

EDGE CASE HANDLING - VERY IMPORTANT:
- If the image contains NO FOOD ITEMS (e.g., hands, body parts, non-food objects, empty plates, etc.), return: {"foodItems": [{"name": "No Food Detected", "quantity": "N/A", "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "sugar": 0, "sodium": 0, "confidence": 0}, "isFood": false, "message": "Please scan an actual food item. The image appears to show [describe what you see instead of food]."}]}
- If the image is unclear, blurry, or unidentifiable, return similar with confidence 0 and isFood false
- Only proceed with normal analysis if you can clearly identify actual food items

IMPORTANT INSTRUCTIONS:
1. FIRST check if the image actually contains food items - if not, use edge case response above
2. Identify ALL visible food items in the image, including Indian dishes, snacks, beverages, and accompaniments
3. For Indian foods, consider regional variations and cooking methods (fried, steamed, grilled, etc.)
4. Estimate portion sizes based on visual cues (plate size, serving spoons, etc.)
5. Provide realistic calorie and macro estimates based on typical preparation methods
6. Consider hidden ingredients common in Indian cooking (ghee, oil, sugar, etc.)
7. If multiple items are present, analyze each separately
8. Assign confidence scores based on visibility and recognizability of each item

MANDATORY JSON FORMAT (return this exact structure with no other text):
{
  "foodItems": [
    {
      "name": "Food item name (in English) or 'No Food Detected'",
      "quantity": "Estimated portion (e.g., '1 cup', '2 pieces', '100g') or 'N/A'",
      "nutrition": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number,
        "sugar": number,
        "sodium": number,
        "confidence": number (0-100)
      },
      "isFood": boolean (true for actual food, false for non-food items),
      "message": "Optional message explaining why this isn't food (only include for non-food items)"
    }
  ]
}

INDIAN FOOD CONSIDERATIONS:
- Roti/Chapati: ~80-120 calories each depending on size and ghee
- Rice: ~200-250 calories per cup cooked
- Dal: ~150-200 calories per cup
- Curry dishes: Account for oil/ghee content (varies 200-400 calories per serving)
- Fried items (samosa, pakora): High oil content, 150-300 calories per piece
- Sweets (gulab jamun, rasgulla): Very high sugar, 150-250 calories per piece
- Lassi/drinks: Account for sugar and dairy content
- Street food: Often oil-heavy, estimate generously
- Biryani: ~400-600 calories per plate depending on portion and preparation
- Paratha: ~250-350 calories each depending on stuffing and ghee
- Dosa: ~150-250 calories per dosa depending on size and oil
- Idli: ~50-80 calories per piece
- Vada: ~150-200 calories per piece
- Chole/Rajma: ~200-300 calories per cup
- Paneer dishes: ~250-400 calories per serving depending on gravy
- Naan: ~200-300 calories per piece depending on butter/ghee
- Tandoori items: Account for marinades and cooking oil

COOKING METHOD ADJUSTMENTS:
- Fried foods: Add 30-50% more calories for oil absorption
- Steamed foods: Lower calorie estimates
- Grilled/Tandoori: Moderate oil content
- Curry/Gravy dishes: High oil/ghee content, estimate generously
- Dry preparations: Moderate oil content

Be thorough and accurate. If you cannot clearly identify an item, mark confidence as low but still provide your best estimate based on visual similarity to known foods.`
}

function getBarcodeAnalysisPrompt(): string {
  return `Analyze this barcode image and extract the product information if visible.

INSTRUCTIONS:
1. Read any visible text on the packaging
2. Identify the product name and brand
3. Look for nutrition facts panel
4. Extract serving size information
5. Calculate nutrition per serving

RESPONSE FORMAT (JSON only):
{
  "foodItems": [
    {
      "name": "Product name",
      "quantity": "1 serving (as per package)",
      "nutrition": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number,
        "sugar": number,
        "sodium": number,
        "confidence": number (0-100)
      }
    }
  ]
}

If nutrition facts are not clearly visible, provide typical values for the product type and mark confidence as low.`
}

function getNutritionLabelPrompt(): string {
  return `Extract nutrition information from this nutrition facts label.

INSTRUCTIONS:
1. Read all visible nutrition information
2. Extract serving size
3. Get all macro and micronutrients listed
4. Ensure accuracy in number extraction
5. Convert to per-serving values if needed

RESPONSE FORMAT (JSON only):
{
  "foodItems": [
    {
      "name": "Product name (if visible) or 'Packaged Food'",
      "quantity": "1 serving (as per label)",
      "nutrition": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number,
        "sugar": number,
        "sodium": number,
        "confidence": 95
      }
    }
  ]
}

Be extremely accurate with numbers from the label.`
}

/**
 * Calls Gemini Vision API with the image and prompt
 */
async function callGeminiVisionAPI(
  imageBase64: string,
  scanMode: 'food' | 'barcode' | 'label'
): Promise<FoodItem[]> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  let prompt = ''
  switch (scanMode) {
    case 'food':
      prompt = getFoodAnalysisPrompt()
      break
    case 'barcode':
      prompt = getBarcodeAnalysisPrompt()
      break
    case 'label':
      prompt = getNutritionLabelPrompt()
      break
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1, // Low temperature for consistent results
      topK: 1,
      topP: 1,
      maxOutputTokens: 4096, // Increased for detailed food analysis
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  }

  console.log('Calling Gemini 1.5 Flash API for', scanMode, 'analysis...')
  console.log('Image data length:', imageBase64.length)

  // Use FASTEST proven vision models - prioritize speed
  // Based on testing: gemini-2.0-flash responded instantly
  const modelVersions = [
    'gemini-2.0-flash',        // ✅ FASTEST - Instant response with vision
    'gemini-flash-latest',     // ✅ FAST - Good response time with vision
    'gemini-2.5-flash',        // ✅ Works but slower - fallback only
  ];

  let response: Response | null = null;
  let lastError: Error | null = null;

  for (const model of modelVersions) {
    try {
      console.log(`Food Analysis: Attempting to call ${model}...`);
      
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      if (response.ok) {
        console.log(`Food Analysis: Successfully connected to ${model}`);
        break; // Success, exit the loop
      } else {
        const errorData = await response.json()
        const errorMessage = `${model} API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        console.log(`Food Analysis: ${errorMessage}`)
        lastError = new Error(errorMessage)
        response = null; // Reset for next iteration
        continue; // Try next model
      }
      
    } catch (error) {
      console.log(`Food Analysis: Error with ${model}:`, error.message)
      lastError = error instanceof Error ? error : new Error(String(error))
      response = null;
      continue; // Try next model
    }
  }

  // If all models failed
  if (!response || !response.ok) {
    console.error('❌ All Gemini models failed:', lastError?.message || 'Unknown error')
    throw new Error(`All Gemini API models failed: ${lastError?.message || 'Unknown error'}`)
  }

  const data: GeminiResponse = await response.json()

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini API')
  }

  const responseText = data.candidates[0].content.parts[0].text
  console.log('Raw Gemini response:', responseText)

  try {
    // Multiple strategies to extract JSON from the response
    let parsedResponse: any = null;
    
    // Strategy 1: Try to parse the entire response as JSON
    try {
      parsedResponse = JSON.parse(responseText);
      console.log('Successfully parsed entire response as JSON');
    } catch (e) {
      console.log('Full response is not JSON, trying to extract JSON block...');
    }
    
    // Strategy 2: Extract JSON block using regex patterns
    if (!parsedResponse) {
      const jsonPatterns = [
        /\{[\s\S]*\}/,  // Basic JSON object
        /```json\s*(\{[\s\S]*?\})\s*```/,  // JSON in code blocks
        /```\s*(\{[\s\S]*?\})\s*```/,  // JSON in generic code blocks
        /(\{[\s\S]*?"foodItems"[\s\S]*?\})/,  // JSON containing foodItems
      ];
      
      for (const pattern of jsonPatterns) {
        const match = responseText.match(pattern);
        if (match) {
          try {
            const jsonText = match[1] || match[0];
            parsedResponse = JSON.parse(jsonText);
            console.log('Successfully extracted JSON using pattern:', pattern.source);
            break;
          } catch (e) {
            console.log('Failed to parse extracted JSON with pattern:', pattern.source);
            continue;
          }
        }
      }
    }
    
    // Strategy 3: If still no JSON, try to create structured response from description
    if (!parsedResponse) {
      console.log('No JSON found, attempting to parse description...');
      
      // Try to extract food information from the descriptive text
      const foodItems = parseDescriptiveResponse(responseText, scanMode);
      if (foodItems.length > 0) {
        console.log('Successfully parsed descriptive response');
        return foodItems;
      }
      
      throw new Error('No JSON found in response and could not parse description');
    }

    if (!parsedResponse.foodItems || !Array.isArray(parsedResponse.foodItems)) {
      throw new Error('Invalid response format: missing or invalid foodItems array');
    }

    // Validate and sanitize the response
    const foodItems: FoodItem[] = parsedResponse.foodItems.map((item: any) => ({
      name: item.name || 'Unknown Food',
      quantity: item.quantity || '1 serving',
      nutrition: {
        calories: Math.max(0, Number(item.nutrition?.calories) || 0),
        protein: Math.max(0, Number(item.nutrition?.protein) || 0),
        carbs: Math.max(0, Number(item.nutrition?.carbs) || 0),
        fat: Math.max(0, Number(item.nutrition?.fat) || 0),
        fiber: Math.max(0, Number(item.nutrition?.fiber) || 0),
        sugar: Math.max(0, Number(item.nutrition?.sugar) || 0),
        sodium: Math.max(0, Number(item.nutrition?.sodium) || 0),
        confidence: Math.min(100, Math.max(0, Number(item.nutrition?.confidence) || 50)),
      },
      isFood: item.isFood !== undefined ? Boolean(item.isFood) : true,
      message: item.message || undefined,
    }))

    // Check for non-food items and adjust response
    const nonFoodItems = foodItems.filter(item => item.isFood === false)
    if (nonFoodItems.length > 0) {
      console.log('Non-food items detected:', nonFoodItems.map(item => item.name))
    }

    console.log('Parsed food items:', foodItems)
    return foodItems
  } catch (parseError) {
    console.error('Error parsing Gemini response:', parseError)
    console.error('Raw response:', responseText)
    throw new Error('Failed to parse nutrition analysis')
  }
}

/**
 * Parse descriptive response when JSON format is not provided
 */
function parseDescriptiveResponse(responseText: string, scanMode: 'food' | 'barcode' | 'label'): FoodItem[] {
  console.log('Attempting to parse descriptive response...');
  
  try {
    const foodItems: FoodItem[] = [];
    
    // Common food patterns and their typical nutrition values
    const foodNutritionMap: { [key: string]: { calories: number, protein: number, carbs: number, fat: number } } = {
      // Middle Eastern/Mediterranean foods (based on the user's image)
      'kebab': { calories: 250, protein: 20, carbs: 5, fat: 18 },
      'grilled meat': { calories: 250, protein: 20, carbs: 5, fat: 18 },
      'hummus': { calories: 166, protein: 8, carbs: 14, fat: 10 },
      'flatbread': { calories: 150, protein: 5, carbs: 30, fat: 2 },
      'pita bread': { calories: 150, protein: 5, carbs: 30, fat: 2 },
      'beets': { calories: 35, protein: 1, carbs: 8, fat: 0 },
      'garlic bread': { calories: 200, protein: 6, carbs: 25, fat: 8 },
      'milkshake': { calories: 300, protein: 8, carbs: 45, fat: 12 },
      
      // Common Indian foods
      'biryani': { calories: 400, protein: 15, carbs: 55, fat: 12 },
      'curry': { calories: 250, protein: 12, carbs: 15, fat: 18 },
      'rice': { calories: 200, protein: 4, carbs: 45, fat: 0.5 },
      'dal': { calories: 180, protein: 12, carbs: 30, fat: 1 },
      'roti': { calories: 100, protein: 3, carbs: 20, fat: 2 },
      'chapati': { calories: 100, protein: 3, carbs: 20, fat: 2 },
      'naan': { calories: 250, protein: 8, carbs: 45, fat: 5 },
      'paneer': { calories: 300, protein: 18, carbs: 8, fat: 22 },
    };
    
    // Extract food items mentioned in the description
    const text = responseText.toLowerCase();
    let totalEstimatedCalories = 0;
    
    // Look for specific food mentions
    for (const [foodName, nutrition] of Object.entries(foodNutritionMap)) {
      if (text.includes(foodName)) {
        console.log(`Found food item: ${foodName}`);
        
        // Estimate quantity based on context
        let quantity = '1 serving';
        let multiplier = 1;
        
        // Look for quantity indicators
        if (text.includes('several') || text.includes('multiple')) {
          multiplier = 3;
          quantity = '3 pieces';
        } else if (text.includes('two') || text.includes('2')) {
          multiplier = 2;
          quantity = '2 pieces';
        } else if (text.includes('plate') || text.includes('serving')) {
          multiplier = 1;
          quantity = '1 serving';
        }
        
        const adjustedNutrition = {
          calories: Math.round(nutrition.calories * multiplier),
          protein: Math.round(nutrition.protein * multiplier),
          carbs: Math.round(nutrition.carbs * multiplier),
          fat: Math.round(nutrition.fat * multiplier),
          fiber: Math.round(2 * multiplier), // estimated
          sugar: Math.round(3 * multiplier), // estimated
          sodium: Math.round(400 * multiplier), // estimated
          confidence: 60 // Lower confidence for parsed descriptions
        };
        
        totalEstimatedCalories += adjustedNutrition.calories;
        
        foodItems.push({
          name: foodName.charAt(0).toUpperCase() + foodName.slice(1),
          quantity: quantity,
          nutrition: adjustedNutrition
        });
      }
    }
    
    // If no specific foods found, create a generic entry based on description
    if (foodItems.length === 0) {
      console.log('No specific foods found, creating generic entry...');
      
      // Try to determine meal type
      let mealType = 'Mixed Meal';
      let estimatedCalories = 400; // default
      
      if (text.includes('restaurant') || text.includes('dining')) {
        estimatedCalories = 500; // restaurant portions tend to be larger
        mealType = 'Restaurant Meal';
      }
      
      if (text.includes('mediterranean') || text.includes('middle eastern')) {
        mealType = 'Mediterranean Dish';
        estimatedCalories = 450;
      }
      
      if (text.includes('plate') && text.includes('meat')) {
        mealType = 'Meat Plate';
        estimatedCalories = 500;
      }
      
      foodItems.push({
        name: mealType,
        quantity: '1 serving',
        nutrition: {
          calories: estimatedCalories,
          protein: Math.round(estimatedCalories * 0.2 / 4), // 20% protein
          carbs: Math.round(estimatedCalories * 0.45 / 4), // 45% carbs
          fat: Math.round(estimatedCalories * 0.35 / 9), // 35% fat
          fiber: 5,
          sugar: 8,
          sodium: 800,
          confidence: 40 // Low confidence for generic estimates
        }
      });
    }
    
    console.log(`Parsed ${foodItems.length} food items from description`);
    return foodItems;
    
  } catch (error) {
    console.error('Error parsing descriptive response:', error);
    return [];
  }
}

/**
 * Provides mock data for development and testing
 */
function getMockFoodData(scanMode: 'food' | 'barcode' | 'label'): FoodItem[] {
  const mockData: { [key: string]: FoodItem[] } = {
    food: [
      {
        name: 'Chicken Biryani',
        quantity: '1 plate (300g)',
        nutrition: {
          calories: 485,
          protein: 22,
          carbs: 58,
          fat: 18,
          fiber: 3,
          sugar: 4,
          sodium: 890,
          confidence: 85,
        },
      },
      {
        name: 'Raita',
        quantity: '1 small bowl (100g)',
        nutrition: {
          calories: 65,
          protein: 3,
          carbs: 8,
          fat: 2,
          fiber: 1,
          sugar: 6,
          sodium: 125,
          confidence: 75,
        },
      },
    ],
    barcode: [
      {
        name: 'Packaged Snack',
        quantity: '1 serving (30g)',
        nutrition: {
          calories: 150,
          protein: 3,
          carbs: 20,
          fat: 7,
          fiber: 2,
          sugar: 3,
          sodium: 200,
          confidence: 90,
        },
      },
    ],
    label: [
      {
        name: 'Nutrition Label Product',
        quantity: '1 serving',
        nutrition: {
          calories: 120,
          protein: 4,
          carbs: 15,
          fat: 5,
          fiber: 2,
          sugar: 8,
          sodium: 180,
          confidence: 95,
        },
      },
    ],
  }

  return mockData[scanMode] || mockData.food
}

/**
 * Logs food analysis interaction for tracking
 */
async function logFoodAnalysis(
  supabase: any,
  userId: string,
  scanMode: string,
  foodItems: FoodItem[],
  success: boolean,
  error?: string
): Promise<void> {
  try {
    const totalCalories = foodItems.reduce((total, item) => total + item.nutrition.calories, 0)
    const avgConfidence = foodItems.length > 0 
      ? foodItems.reduce((total, item) => total + item.nutrition.confidence, 0) / foodItems.length 
      : 0

    await supabase
      .from('food_analysis_logs')
      .insert({
        user_id: userId,
        scan_mode: scanMode,
        food_items_count: foodItems.length,
        total_calories: totalCalories,
        average_confidence: avgConfidence,
        success: success,
        error_message: error,
        created_at: new Date().toISOString()
      })
  } catch (logError) {
    console.error('Failed to log food analysis:', logError)
    // Don't throw error as logging is not critical
  }
}

/**
 * Main food analysis handler
 */
serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { userId, imageBase64, scanMode }: FoodAnalysisRequest = await req.json()

    if (!userId || !imageBase64 || !scanMode) {
      return new Response(
        JSON.stringify({ error: 'userId, imageBase64, and scanMode are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Processing food analysis for user ${userId}, mode: ${scanMode}`)

    try {
      // Call Gemini Vision API
      const foodItems = await callGeminiVisionAPI(imageBase64, scanMode)
      
      // Log the successful analysis
      await logFoodAnalysis(supabase, userId, scanMode, foodItems, true)

      const response: FoodAnalysisResponse = {
        success: true,
        foodItems: foodItems
      }

      console.log('Food analysis completed successfully')

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )

    } catch (analysisError) {
      console.error('Food analysis failed:', analysisError)
      
      // For development, return mock data if API fails
      const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development'
      if (isDevelopment) {
        console.log('Using mock data for development')
        const mockFoodItems = getMockFoodData(scanMode)
        
        await logFoodAnalysis(supabase, userId, scanMode, mockFoodItems, true)

        return new Response(
          JSON.stringify({
            success: true,
            foodItems: mockFoodItems
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // Log the failed analysis
      await logFoodAnalysis(
        supabase, 
        userId, 
        scanMode, 
        [], 
        false, 
        analysisError instanceof Error ? analysisError.message : 'Unknown error'
      )

      throw analysisError
    }

  } catch (error) {
    console.error('Food analysis error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
