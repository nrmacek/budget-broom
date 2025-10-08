import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
  confidence: number;
  is_refund?: boolean;
}

interface Discount {
  description: string;
  amount: number;
}

interface Tax {
  description: string;
  rate?: number;
  amount: number;
}

interface AdditionalCharge {
  description: string;
  amount: number;
}

interface ReceiptData {
  storeName: string;
  date: string;
  subtotal: number;
  discounts?: Discount[];
  taxes?: Tax[];
  additionalCharges?: AdditionalCharge[];
  total: number;
  lineItems: LineItem[];
  isReturn?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration not available');
    }

    const body = await req.json();
    
    // Check if we're processing via image path (new method) or direct file upload (legacy)
    if (body.imagePath) {
      // New method: fetch image from Supabase Storage
      console.log(`Processing stored image: ${body.imagePath}, type: ${body.mimeType}`);
      
      const imageResponse = await fetch(`${supabaseUrl}/storage/v1/object/receipt-images/${body.imagePath}`, {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch stored image: ${imageResponse.statusText}`);
      }
      
      const imageBlob = await imageResponse.blob();
      const file = new File([imageBlob], body.fileName, { type: body.mimeType });
      
      let extractedData: ReceiptData;
      
      if (body.mimeType.startsWith('image/')) {
        extractedData = await processImageReceipt(file, openAIApiKey);
      } else if (body.mimeType === 'text/csv') {
        extractedData = await processCsvReceipt(file);
      } else {
        throw new Error('Unsupported file type. Please use image or CSV files.');
      }
      
      console.log('Successfully parsed receipt:', {
        storeName: extractedData.storeName,
        date: extractedData.date,
        isReturn: extractedData.isReturn || false,
        itemCount: extractedData.lineItems.length,
        subtotal: extractedData.subtotal,
        total: extractedData.total,
        avgConfidence: (extractedData.lineItems.reduce((sum, item) => sum + (item.confidence || 0), 0) / extractedData.lineItems.length).toFixed(2),
        lowConfidenceItems: extractedData.lineItems.filter(item => (item.confidence || 0) < 0.7).length
      });
      return new Response(JSON.stringify(extractedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Legacy method: handle FormData (for backward compatibility)
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('No file provided');
      }

      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

      let extractedData: ReceiptData;

      if (file.type.startsWith('image/')) {
        extractedData = await processImageReceipt(file, openAIApiKey);
      } else if (file.type === 'application/pdf') {
        throw new Error('PDF processing not yet implemented. Please use image files (JPG, PNG, WebP).');
      } else if (file.type === 'text/csv') {
        extractedData = await processCsvReceipt(file);
      } else {
        throw new Error('Unsupported file type. Please use image, PDF, or CSV files.');
      }
      
      console.log('Successfully parsed receipt:', {
        storeName: extractedData.storeName,
        date: extractedData.date,
        isReturn: extractedData.isReturn || false,
        itemCount: extractedData.lineItems.length,
        subtotal: extractedData.subtotal,
        total: extractedData.total,
        avgConfidence: (extractedData.lineItems.reduce((sum, item) => sum + (item.confidence || 0), 0) / extractedData.lineItems.length).toFixed(2),
        lowConfidenceItems: extractedData.lineItems.filter(item => (item.confidence || 0) < 0.7).length
      });
      return new Response(JSON.stringify(extractedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in parse-receipt function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process receipt';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

interface ValidationResult {
  isValid: boolean;
  discrepancy?: number;
  expectedTotal?: number;
  actualTotal?: number;
  calculatedSubtotal?: number;
  actualSubtotal?: number;
  details?: string;
}

function validateReceiptMath(data: ReceiptData): ValidationResult {
  // Calculate expected subtotal from line items
  const calculatedSubtotal = data.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);
  
  // Calculate expected total: subtotal - discounts + taxes + additionalCharges
  const totalDiscounts = (data.discounts || []).reduce((sum, d) => sum + d.amount, 0);
  const totalTaxes = (data.taxes || []).reduce((sum, t) => sum + t.amount, 0);
  const totalCharges = (data.additionalCharges || []).reduce((sum, c) => sum + c.amount, 0);
  
  const expectedTotal = calculatedSubtotal - totalDiscounts + totalTaxes + totalCharges;
  const discrepancy = Math.abs(expectedTotal - data.total);
  
  // Allow $0.50 tolerance for rounding
  const isValid = discrepancy <= 0.50;
  
  const result: ValidationResult = {
    isValid,
    discrepancy,
    expectedTotal,
    actualTotal: data.total,
    calculatedSubtotal,
    actualSubtotal: data.subtotal,
    details: isValid 
      ? 'Math checks out within $0.50 tolerance' 
      : `Discrepancy of $${discrepancy.toFixed(2)} detected. Expected total: $${expectedTotal.toFixed(2)}, Actual: $${data.total.toFixed(2)}. Calculated subtotal: $${calculatedSubtotal.toFixed(2)}, Actual: $${data.subtotal.toFixed(2)}. Found ${data.lineItems.length} items.`
  };
  
  return result;
}

async function retryWithFocusedPrompt(file: File, apiKey: string, originalData: ReceiptData, validation: ValidationResult): Promise<ReceiptData> {
  // Convert image to base64 again
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64 = btoa(binary);
  const mimeType = file.type;

  const focusedPrompt = `CORRECTION NEEDED: Previous parsing attempt found issues.

Previous attempt found:
- ${originalData.lineItems.length} items totaling $${validation.calculatedSubtotal?.toFixed(2)}
- Receipt shows total: $${validation.actualTotal?.toFixed(2)}
- Discrepancy: $${validation.discrepancy?.toFixed(2)}

CRITICAL: Please re-examine this receipt VERY CAREFULLY and:
1. Count EVERY item - scan each line multiple times
2. Look for items on the SAME line separated by spaces
3. Check for small/compact text that may have been missed
4. Verify ALL negative amounts are preserved for returns
5. Double-check discount handling (positive amounts that reduce refunds)

${validation.calculatedSubtotal !== undefined && validation.actualSubtotal !== undefined && Math.abs(validation.calculatedSubtotal - validation.actualSubtotal) > 1 
  ? `HINT: Calculated subtotal ($${validation.calculatedSubtotal.toFixed(2)}) differs from receipt subtotal ($${validation.actualSubtotal.toFixed(2)}), suggesting MISSING ITEMS.`
  : ''}

Return the COMPLETE, CORRECTED JSON with ALL items found.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      max_completion_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: 'You are an expert receipt parser. Re-examine this receipt and provide corrected structured data. Return ONLY valid JSON, no markdown.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: focusedPrompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`Retry API call failed: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  // Clean and parse
  let cleanContent = content.trim();
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  const retryData = JSON.parse(cleanContent);
  
  // Apply same post-processing
  if (typeof retryData.subtotal !== 'number') {
    retryData.subtotal = retryData.lineItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
  }
  
  retryData.discounts = retryData.discounts || [];
  retryData.taxes = retryData.taxes || [];
  retryData.additionalCharges = retryData.additionalCharges || [];
  
  retryData.lineItems = retryData.lineItems.map((item: any, index: number) => ({
    ...item,
    id: item.id || `item_${index + 1}`
  }));
  
  return retryData;
}

async function processImageReceipt(file: File, apiKey: string): Promise<ReceiptData> {
  // Convert image to base64 using a more efficient method
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Use a chunk-based approach to avoid stack overflow
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  const base64 = btoa(binary);
  const mimeType = file.type;

  // Call OpenAI Vision API to extract receipt data
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      max_completion_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: `You are an expert receipt parser with advanced categorization capabilities. Analyze the receipt image and extract comprehensive structured data.

          **CRITICAL: RETURN/REFUND DETECTION**
          First, determine if this is a RETURN/REFUND receipt by looking for:
          - Keywords: "RETURN", "REFUND", "TOTAL REFUND", "CREDIT", "STORE CREDIT"
          - Negative amounts (with minus signs "-")
          - Return transaction patterns
          
          If this IS a return/refund receipt:
          - Set "isReturn": true in the response
          - PRESERVE negative amounts (do NOT convert to positive)
          - Mark ALL line items with "is_refund": true
          - Ensure total, subtotal, and line item amounts are NEGATIVE

          **SPECIAL ATTENTION FOR RETURN RECEIPTS:**
          - Return receipts often have DENSE, COMPACT layouts with multiple items per line
          - Carefully scan EVERY line for items, even if text is small or cramped
          - Look for patterns like: "ITEM_NAME    -$X.XX  ITEM_NAME2   -$Y.YY" on single lines
          - Count items carefully - if you see 11 items, parse ALL 11, not just 10
          - Return discounts are typically shown as POSITIVE amounts that reduce the refund
          - Cross-check: count of items × average price should roughly match subtotal

          **TARGET RETURN RECEIPT SPECIFIC PATTERNS:**
          Example format you might see:
          "ITEM_NAME_1    -$3.00  ITEM_NAME_2    -$5.99"
          "RETURN DISCOUNT         $2.00"
          "SUBTOTAL               -$83.00"
          "TOTAL REFUND           -$84.53"
          
          For Target returns:
          - Items are often on SAME line, separated by spaces
          - Each item has its own negative amount
          - "RETURN DISCOUNT" is a POSITIVE amount that reduces your refund
          - Carefully parse every item on every line

          CATEGORY SYSTEM (Use exact category names):
          1. "groceries" - Food items, beverages, fresh produce, dairy, meat, bakery items, canned goods, snacks, household food
          2. "electronics" - Phones, computers, TVs, cameras, headphones, cables, batteries, tech accessories, appliances
          3. "clothing" - Shirts, pants, dresses, shoes, accessories, jewelry, bags, fashion items, sportswear
          4. "personal-care" - Shampoo, soap, toothpaste, makeup, skincare, hygiene products, beauty items
          5. "household" - Cleaning supplies, laundry detergent, paper towels, trash bags, home maintenance items
          6. "entertainment" - Movies, games, books, magazines, streaming services, concert tickets, hobbies
          7. "food-drink" - Restaurant meals, takeout, coffee, alcohol, dining experiences (not groceries)
          8. "transportation" - Gas, parking, public transit, rideshare, car maintenance, automotive supplies
          9. "health" - Medicine, vitamins, medical supplies, health services, fitness, wellness products
          10. "stationery" - Pens, paper, notebooks, office supplies, school supplies, printing materials
          11. "home-garden" - Furniture, home decor, gardening supplies, tools, hardware, home improvement
          12. "other" - Items that don't fit other categories

          CONFIDENCE SCORING GUIDELINES:
          - 0.9-1.0: Crystal clear item name, obvious category match, no ambiguity
          - 0.7-0.89: Clear item but slight ambiguity (e.g., "organic cleaner" could be household or personal care)
          - 0.5-0.69: Readable item but unclear category or generic description
          - 0.3-0.49: Partially readable, significant uncertainty about item or category
          - 0.0-0.29: Unclear text, heavy OCR errors, guessing required

          Return ONLY a valid JSON object with this structure:
          {
            "storeName": "exact store name from receipt",
            "date": "YYYY-MM-DD format (if unclear, use today's date)",
            "subtotal": number (NEGATIVE if isReturn is true),
            "discounts": [{"description": "string", "amount": number}] (optional),
            "taxes": [{"description": "string", "rate": number, "amount": number}] (optional),
            "additionalCharges": [{"description": "string", "amount": number}] (optional),
            "total": number (NEGATIVE if isReturn is true),
            "isReturn": boolean (true if this is a return/refund receipt),
            "lineItems": [
              {
                "id": "item_1, item_2, etc.",
                "description": "exact item description from receipt",
                "quantity": number,
                "unitPrice": number (NEGATIVE if isReturn is true),
                "total": number (NEGATIVE if isReturn is true),
                "category": "category_slug_from_above_list",
                "confidence": number (0.0-1.0 based on guidelines above),
                "is_refund": boolean (true if this is a returned item)
              }
            ]
          }

          CRITICAL RULES:
          - Use EXACT category slugs from the list above (groceries, electronics, etc.)
          - Set confidence based on text clarity and categorization certainty
          - If item description is unclear, transcribe exactly what you can see
          - Ensure mathematical accuracy: subtotal - discounts + taxes + additionalCharges = total
          - For unclear dates, use reasonable estimates or today's date
          - Each line item must have realistic confidence score reflecting actual uncertainty
          - FOR RETURNS: All amounts MUST be negative, isReturn MUST be true, all line items MUST have is_refund: true
          - NEVER convert negative amounts to positive for returns - preserve the minus sign
          - NEVER miss items - if receipt shows 11 items, parse ALL 11 items
          - For compact/dense layouts, scan EVERY line multiple times to catch all items

          Return ONLY the JSON - no markdown, no explanations, no additional text.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this receipt and extract the structured data as specified.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  try {
    // Clean the content by removing markdown code block formatting
    let cleanContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Parsing cleaned content:', cleanContent);
    const parsedData = JSON.parse(cleanContent);
    
    // Validate required fields
    if (!parsedData.storeName || !parsedData.lineItems || !Array.isArray(parsedData.lineItems) || typeof parsedData.total !== 'number') {
      throw new Error('Invalid receipt data structure from AI response');
    }

    // Calculate subtotal if not provided
    if (typeof parsedData.subtotal !== 'number') {
      parsedData.subtotal = parsedData.lineItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    }

    // Ensure arrays exist for optional fields
    parsedData.discounts = parsedData.discounts || [];
    parsedData.taxes = parsedData.taxes || [];
    parsedData.additionalCharges = parsedData.additionalCharges || [];
    
    // Add unique IDs if missing
    parsedData.lineItems = parsedData.lineItems.map((item: any, index: number) => ({
      ...item,
      id: item.id || `item_${index + 1}`
    }));

    // Post-processing validation
    const validationResult = validateReceiptMath(parsedData);
    
    if (!validationResult.isValid) {
      console.warn('⚠️  VALIDATION FAILED - Math discrepancy detected:', validationResult);
      
      // If discrepancy is significant (> $1.00), attempt retry with focused prompt
      if (Math.abs(validationResult.discrepancy || 0) > 1.00) {
        console.log('🔄 Attempting retry with focused correction prompt...');
        
        try {
          const retryData = await retryWithFocusedPrompt(file, apiKey, parsedData, validationResult);
          
          // Validate retry result
          const retryValidation = validateReceiptMath(retryData);
          if (retryValidation.isValid || Math.abs(retryValidation.discrepancy || 0) < Math.abs(validationResult.discrepancy || 0)) {
            console.log('✅ Retry improved accuracy:', retryValidation);
            return retryData;
          } else {
            console.log('⚠️  Retry did not improve accuracy, using original parse');
          }
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          // Continue with original parse
        }
      }
    } else {
      console.log('✅ Validation passed - math checks out');
    }

    return parsedData;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response as JSON. Raw content:', content);
    console.error('Parse error:', parseError);
    throw new Error('Failed to parse receipt data from AI response - the AI response was not valid JSON');
  }
}

async function processCsvReceipt(file: File): Promise<ReceiptData> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const lineItems: LineItem[] = [];

  // Expected CSV format: description, quantity, unitPrice, total, category
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length >= 4) {
      lineItems.push({
        id: `csv_item_${i}`,
        description: values[0] || 'Unknown Item',
        quantity: parseFloat(values[1]) || 1,
        unitPrice: parseFloat(values[2]) || 0,
        total: parseFloat(values[3]) || 0,
        category: values[4] || 'Other',
        confidence: 1.0
      });
    }
  }

  const total = lineItems.reduce((sum, item) => sum + item.total, 0);

  return {
    storeName: 'CSV Import',
    date: new Date().toISOString().split('T')[0],
    subtotal: total,
    total,
    lineItems
  };
}