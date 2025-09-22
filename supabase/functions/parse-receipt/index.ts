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

interface ReceiptData {
  storeName: string;
  date: string;
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
  // Convert image to base64
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
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
          content: `You are a receipt parser that extracts structured data from receipt images. 
          
          Analyze the receipt and return ONLY a valid JSON object with this exact structure:
          {
            "storeName": "store name from receipt",
            "date": "YYYY-MM-DD format",
            "total": number (total amount),
            "lineItems": [
              {
                "id": "unique_id",
                "description": "item description",
                "quantity": number,
                "unitPrice": number,
                "total": number,
                "category": "category_name",
                "confidence": number (0.0 to 1.0)
              }
            ]
          }
          
          Categories should be one of: Groceries, Electronics, Clothing, Personal Care, Household, Entertainment, Food & Drink, Transportation, Health, Other.
          
          If you cannot clearly read certain values, use reasonable defaults and set confidence accordingly (lower confidence for unclear items).
          
          Return ONLY the JSON object, no additional text or formatting.`
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
    const parsedData = JSON.parse(content);
    
    // Add unique IDs if missing
    parsedData.lineItems = parsedData.lineItems.map((item: any, index: number) => ({
      ...item,
      id: item.id || `item_${index + 1}`
    }));

    return parsedData;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response as JSON:', content);
    throw new Error('Failed to parse receipt data from AI response');
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
    total,
    lineItems
  };
}