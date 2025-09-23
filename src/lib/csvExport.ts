import { format } from 'date-fns';

export interface ReceiptData {
  id: string;
  store_name?: string;
  date?: string;
  total?: number;
  line_items?: any[];
  original_filename?: string;
  created_at?: string;
  currency?: string;
}

export interface CSVColumn {
  key: string;
  header: string;
  extract: (receipt: ReceiptData, lineItem?: any, index?: number) => any;
  format?: (value: any) => string;
  validate?: (value: any) => boolean;
}

export interface CSVExportConfig {
  version: string;
  name: string;
  columns: CSVColumn[];
}

// Utility functions
const sanitizeCSVValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  let str = String(value);
  
  // CSV injection prevention
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    str = "'" + str;
  }
  
  return str;
};

const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

const formatDateTime = (dateStr: string): string => {
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return '';
  }
};

const calculateLineTotal = (quantity: number, unitPrice: number, discount: number = 0, tax: number = 0): number => {
  return Math.round((quantity * unitPrice - discount + tax) * 100) / 100;
};

// Export configurations
export const CSV_EXPORT_CONFIGS: Record<string, CSVExportConfig> = {
  'v2-production': {
    version: '2.0',
    name: 'Production Export',
    columns: [
      {
        key: 'receipt_id',
        header: 'receipt_id',
        extract: (receipt) => receipt.id
      },
      {
        key: 'line_item_seq',
        header: 'line_item_seq',
        extract: (_, __, index) => (index || 0) + 1
      },
      {
        key: 'line_item_id',
        header: 'line_item_id',
        extract: (receipt, lineItem, index) => `${receipt.id}_${(index || 0) + 1}`
      },
      {
        key: 'purchase_date',
        header: 'purchase_date',
        extract: (receipt) => receipt.date,
        format: formatDate
      },
      {
        key: 'purchase_datetime',
        header: 'purchase_datetime',
        extract: (receipt) => receipt.date,
        format: formatDateTime
      },
      {
        key: 'store',
        header: 'store',
        extract: (receipt) => receipt.store_name || 'Unknown'
      },
      {
        key: 'item_name',
        header: 'item_name',
        extract: (_, lineItem) => lineItem?.name || lineItem?.description || 'Unknown Item'
      },
      {
        key: 'item_name_raw',
        header: 'item_name_raw',
        extract: (_, lineItem) => lineItem?.original_name || lineItem?.raw_text || lineItem?.name || ''
      },
      {
        key: 'quantity',
        header: 'quantity',
        extract: (_, lineItem) => {
          const qty = lineItem?.quantity || 1;
          return lineItem?.is_refund ? -Math.abs(qty) : qty;
        }
      },
      {
        key: 'unit_price',
        header: 'unit_price',
        extract: (_, lineItem) => lineItem?.price || lineItem?.unit_price || 0,
        format: formatCurrency
      },
      {
        key: 'line_total',
        header: 'line_total',
        extract: (_, lineItem) => {
          const quantity = lineItem?.quantity || 1;
          const unitPrice = lineItem?.price || lineItem?.unit_price || 0;
          const discount = lineItem?.discount || 0;
          const tax = lineItem?.tax || 0;
          const total = calculateLineTotal(quantity, unitPrice, discount, tax);
          return lineItem?.is_refund ? -Math.abs(total) : total;
        },
        format: formatCurrency
      },
      {
        key: 'discount_amount',
        header: 'discount_amount',
        extract: (_, lineItem) => lineItem?.discount || 0,
        format: formatCurrency
      },
      {
        key: 'tax_amount',
        header: 'tax_amount',
        extract: (_, lineItem) => lineItem?.tax || 0,
        format: formatCurrency
      },
      {
        key: 'is_refund',
        header: 'is_refund',
        extract: (_, lineItem) => lineItem?.is_refund ? 'true' : 'false'
      },
      {
        key: 'category',
        header: 'category',
        extract: (_, lineItem) => lineItem?.category || 'Uncategorized'
      },
      {
        key: 'category_confidence',
        header: 'category_confidence',
        extract: (_, lineItem) => lineItem?.category_confidence || 0.5,
        format: (value) => value.toFixed(2)
      },
      {
        key: 'currency',
        header: 'currency',
        extract: (receipt) => receipt.currency || 'USD'
      },
      {
        key: 'source_file',
        header: 'source_file',
        extract: (receipt) => receipt.original_filename || 'unknown'
      },
      {
        key: 'parser_version',
        header: 'parser_version',
        extract: () => '1.0'
      },
      {
        key: 'export_datetime',
        header: 'export_datetime',
        extract: () => new Date().toISOString()
      }
    ]
  },
  'v1-legacy': {
    version: '1.0',
    name: 'Legacy Export',
    columns: [
      {
        key: 'receipt_id',
        header: 'Receipt ID',
        extract: (receipt) => receipt.id
      },
      {
        key: 'store',
        header: 'Store',
        extract: (receipt) => receipt.store_name || 'Unknown'
      },
      {
        key: 'date',
        header: 'Date',
        extract: (receipt) => receipt.date,
        format: formatDate
      },
      {
        key: 'item',
        header: 'Item',
        extract: (_, lineItem) => lineItem?.name || 'Unknown Item'
      },
      {
        key: 'quantity',
        header: 'Quantity',
        extract: (_, lineItem) => lineItem?.quantity || 1
      },
      {
        key: 'price',
        header: 'Price',
        extract: (_, lineItem) => lineItem?.price || 0,
        format: formatCurrency
      },
      {
        key: 'total',
        header: 'Total',
        extract: (receipt) => receipt.total || 0,
        format: formatCurrency
      }
    ]
  },
  'accounting': {
    version: '2.0',
    name: 'Accounting Export',
    columns: [
      {
        key: 'transaction_id',
        header: 'transaction_id',
        extract: (receipt) => receipt.id
      },
      {
        key: 'date',
        header: 'date',
        extract: (receipt) => receipt.date,
        format: formatDate
      },
      {
        key: 'vendor',
        header: 'vendor',
        extract: (receipt) => receipt.store_name || 'Unknown'
      },
      {
        key: 'description',
        header: 'description',
        extract: (_, lineItem) => lineItem?.name || 'Unknown Item'
      },
      {
        key: 'category',
        header: 'category',
        extract: (_, lineItem) => lineItem?.category || 'Uncategorized'
      },
      {
        key: 'amount',
        header: 'amount',
        extract: (_, lineItem) => {
          const quantity = lineItem?.quantity || 1;
          const unitPrice = lineItem?.price || lineItem?.unit_price || 0;
          const discount = lineItem?.discount || 0;
          const tax = lineItem?.tax || 0;
          return calculateLineTotal(quantity, unitPrice, discount, tax);
        },
        format: formatCurrency
      },
      {
        key: 'tax_amount',
        header: 'tax_amount',
        extract: (_, lineItem) => lineItem?.tax || 0,
        format: formatCurrency
      }
    ]
  }
};

export class CSVExporter {
  private config: CSVExportConfig;

  constructor(configKey: string = 'v2-production') {
    this.config = CSV_EXPORT_CONFIGS[configKey];
    if (!this.config) {
      throw new Error(`CSV export configuration '${configKey}' not found`);
    }
  }

  generateCSV(receipts: ReceiptData[]): string {
    const headers = this.config.columns.map(col => col.header);
    const rows: string[] = [headers.join(',')];

    receipts.forEach(receipt => {
      const lineItems = receipt.line_items || [{}];
      
      lineItems.forEach((lineItem, index) => {
        const rowData = this.config.columns.map(column => {
          try {
            let value = column.extract(receipt, lineItem, index);
            
            if (column.format && value !== null && value !== undefined) {
              value = column.format(value);
            }
            
            if (column.validate && !column.validate(value)) {
              console.warn(`Validation failed for column ${column.key}:`, value);
            }
            
            return `"${sanitizeCSVValue(value)}"`;
          } catch (error) {
            console.error(`Error processing column ${column.key}:`, error);
            return '""';
          }
        });
        
        rows.push(rowData.join(','));
      });
    });

    return '\ufeff' + rows.join('\r\n'); // UTF-8 BOM + CRLF
  }

  getAvailableConfigs(): string[] {
    return Object.keys(CSV_EXPORT_CONFIGS);
  }

  getConfigInfo(): { version: string; name: string; columnCount: number } {
    return {
      version: this.config.version,
      name: this.config.name,
      columnCount: this.config.columns.length
    };
  }
}