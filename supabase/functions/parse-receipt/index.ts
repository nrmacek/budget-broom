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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    let extractedData: ReceiptData;

    if (file.type.startsWith('image/')) {
      // Handle image files using OpenAI Vision API
      extractedData = await processImageReceipt(file, openAIApiKey);
    } else if (file.type === 'application/pdf') {
      // For PDF files, we'd need additional processing
      // For now, return an error asking user to use images
      throw new Error('PDF processing not yet implemented. Please use image files (JPG, PNG, WebP).');
    } else if (file.type === 'text/csv') {
      // Handle CSV files
      extractedData = await processCsvReceipt(file);
    } else {
      throw new Error('Unsupported file type. Please use image, PDF, or CSV files.');
    }

    console.log('Successfully parsed receipt:', extractedData);

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-receipt function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process receipt' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

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
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `You are a receipt parser that extracts comprehensive structured data from receipt images. 
          
          Analyze the receipt carefully and return ONLY a valid JSON object with this exact structure:
          {
            "storeName": "store name from receipt",
            "date": "YYYY-MM-DD format",
            "subtotal": number (sum of all line items before discounts/taxes),
            "discounts": [
              {
                "description": "discount description (e.g., Store Card 5%, Coupon, Sale)",
                "amount": number (positive number representing discount amount)
              }
            ],
            "taxes": [
              {
                "description": "tax description (e.g., Sales Tax, VAT)",
                "rate": number (optional tax rate as decimal, e.g., 0.0725 for 7.25%),
                "amount": number (tax amount)
              }
            ],
            "additionalCharges": [
              {
                "description": "additional charge description (e.g., Delivery Fee, Service Charge)",
                "amount": number
              }
            ],
            "total": number (final total amount paid),
            "lineItems": [
              {
                "id": "unique_id or item code from receipt",
                "description": "item description",
                "quantity": number,
                "unitPrice": number (price per unit),
                "total": number (quantity * unitPrice),
                "category": "category_name",
                "confidence": number (0.0 to 1.0)
              }
            ]
          }
          
          IMPORTANT INSTRUCTIONS:
          - Parse ALL sections of the receipt: line items, subtotal, discounts, taxes, and final total
          - For discounts array: only include if discounts are present, otherwise omit the field
          - For taxes array: only include if taxes are present, otherwise omit the field  
          - For additionalCharges array: only include if additional charges are present, otherwise omit the field
          - Subtotal should be the sum of all line items before any discounts or taxes
          - Total should match the final amount paid on the receipt
          - Categories should be one of: Groceries, Electronics, Clothing, Personal Care, Household, Entertainment, Food & Drink, Transportation, Health, Stationery & Office Supplies, Other
          - If you cannot clearly read certain values, use reasonable defaults and set confidence accordingly (lower confidence for unclear items)
          - Ensure the math is consistent: subtotal - discounts + taxes + additionalCharges = total
          
          Return ONLY the JSON object, no additional text, markdown formatting, or explanations.`
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