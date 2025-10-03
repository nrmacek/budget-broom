// Core application types

export interface LineItem {
  name?: string;
  description?: string;
  original_name?: string;
  raw_text?: string;
  quantity?: number;
  price?: number;
  unit_price?: number;
  total?: number;
  discount?: number;
  tax?: number;
  is_refund?: boolean;
  category?: string;
}

export interface Receipt {
  id: string;
  store_name?: string;
  date?: string;
  total?: number;
  subtotal?: number;
  line_items?: LineItem[];
  discounts?: number;
  taxes?: number;
  additional_charges?: number;
  original_filename?: string;
  created_at?: string;
  processed_at?: string;
  currency?: string;
  user_id?: string;
  is_return?: boolean;
}

export interface CategoryAssignment {
  id?: string;
  receipt_id: string;
  line_item_index: number;
  category_id: string;
  source: 'user' | 'rule' | 'ai';
  confidence?: number;
  created_at?: string;
  updated_at?: string;
  categories?: {
    display_name: string;
    icon: string;
  };
  receipts?: Receipt;
}

// Database-specific types that match Supabase return structure
export interface CategoryAssignmentFromDB {
  category_id: string;
  line_item_index: number;
  confidence?: number;
  source: string;
  receipt_id?: string;
  id?: string;
  created_at?: string;
  updated_at?: string;
  categories?: {
    display_name: string;
    icon: string;
  };
  receipts?: {
    id: string;
    line_items: any;
    created_at: string;
    user_id: string;
  };
}

export interface ReceiptWithAssignments extends Receipt {
  category_assignments?: CategoryAssignment[];
}

export interface FileUploadResult {
  success: boolean;
  receiptId?: string;
  error?: string;
  data?: Receipt;
  // Raw processing data fields
  storeName?: string;
  date?: string;
  subtotal?: number;
  total?: number;
  lineItems?: LineItem[];
  discounts?: number[];
  taxes?: number[];
  additionalCharges?: number[];
  originalFilename?: string;
}

export interface ProcessingProgress {
  total: number;
  completed: number;
  percentage: number;
  currentFile?: string;
}

// Auth types
export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface AuthResponse {
  error: AuthError | null;
}

// CSV Export types
export type CSVValue = string | number | boolean | null | undefined;

export interface CSVExtractFunction {
  (receipt: Receipt, lineItem?: LineItem, index?: number): CSVValue;
}

export interface CSVFormatFunction {
  (value: CSVValue): string;
}

export interface CSVValidateFunction {
  (value: CSVValue): boolean;
}

// Category types
export interface CategoryWithData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  totalAmount: number;
  itemCount: number;
  receiptCount: number;
}

// Smart suggestions types
export interface HistoricalAssignment {
  category_id: string;
  line_item_index: number;
  created_at?: string;
  receipts?: {
    id: string;
    line_items: LineItem[];
    user_id: string;
  };
  categories?: {
    display_name: string;
    icon: string;
  };
}

// API Response types
export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export type ApiResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: DatabaseError;
};