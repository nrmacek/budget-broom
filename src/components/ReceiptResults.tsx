import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Edit3, Check, X, Store, Calendar, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

interface ReceiptResultsProps {
  receiptData: ReceiptData;
  onStartOver: () => void;
}

const CATEGORIES = [
  'Groceries',
  'Dining',
  'Transportation',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Gas',
  'Other'
];

export function ReceiptResults({ receiptData, onStartOver }: ReceiptResultsProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [items, setItems] = useState<LineItem[]>(receiptData.lineItems);

  const handleEditItem = (itemId: string, field: string, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  const exportToCSV = () => {
    const headers = ['Description', 'Quantity', 'Unit Price', 'Total', 'Category'];
    const csvData = [
      headers.join(','),
      ...items.map(item => [
        `"${item.description}"`,
        item.quantity,
        item.unitPrice.toFixed(2),
        item.total.toFixed(2),
        item.category
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receiptData.storeName}-${receiptData.date}.csv`;
    a.click();
    
    toast({
      title: "CSV exported successfully",
      description: "Your receipt data has been downloaded.",
    });
  };

  const getCategoryStats = () => {
    const stats = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.total;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Receipt Header */}
      <Card className="p-6 bg-gradient-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Receipt Processed</h2>
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <Check className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Store</p>
              <p className="font-medium">{receiptData.storeName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{receiptData.date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-medium text-lg">${receiptData.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {getCategoryStats().map(([category, amount]) => (
            <div key={category} className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">{category}</p>
              <p className="text-lg font-semibold">${amount.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Line Items Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Line Items ({items.length})</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onStartOver}>
                Process Another
              </Button>
              <Button onClick={exportToCSV} className="bg-gradient-accent hover:scale-105 transition-transform">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-center p-4 font-medium">Qty</th>
                <th className="text-right p-4 font-medium">Unit Price</th>
                <th className="text-right p-4 font-medium">Total</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-center p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={`border-b hover:bg-muted/25 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}>
                  <td className="p-4">
                    {editingItem === item.id ? (
                      <Input
                        value={item.description}
                        onChange={(e) => handleEditItem(item.id, 'description', e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <div>
                        <p className="font-medium">{item.description}</p>
                        {item.confidence < 0.8 && (
                          <Badge variant="outline" className="mt-1 text-xs bg-warning/10 text-warning border-warning/20">
                            Low confidence
                          </Badge>
                        )}
                      </div>
                    )}
                  </td>
                  
                  <td className="p-4 text-center">
                    {editingItem === item.id ? (
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleEditItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="h-8 w-16 text-center"
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>
                  
                  <td className="p-4 text-right">
                    {editingItem === item.id ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleEditItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="h-8 w-20 text-right"
                      />
                    ) : (
                      `$${item.unitPrice.toFixed(2)}`
                    )}
                  </td>
                  
                  <td className="p-4 text-right font-medium">
                    ${item.total.toFixed(2)}
                  </td>
                  
                  <td className="p-4">
                    {editingItem === item.id ? (
                      <Select 
                        value={item.category} 
                        onValueChange={(value) => handleEditItem(item.id, 'category', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{item.category}</Badge>
                    )}
                  </td>
                  
                  <td className="p-4 text-center">
                    {editingItem === item.id ? (
                      <div className="flex justify-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingItem(null)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingItem(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setEditingItem(item.id)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}