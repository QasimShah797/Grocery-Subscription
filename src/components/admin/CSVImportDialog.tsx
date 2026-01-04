import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface CSVProduct {
  name: string;
  description: string;
  price_pkr: number;
  category: string;
  image_url: string;
}

interface ParseResult {
  valid: CSVProduct[];
  errors: { row: number; message: string }[];
}

export function CSVImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = 'name,description,price_pkr,category,image_url';
    const example = 'Fresh Milk 1L,Pure fresh milk from local farms,250,Dairy,https://example.com/milk.jpg';
    const csv = `${headers}\n${example}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParseResult => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const requiredHeaders = ['name', 'price_pkr', 'category'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return {
        valid: [],
        errors: [{ row: 1, message: `Missing required columns: ${missingHeaders.join(', ')}` }]
      };
    }

    const nameIdx = headers.indexOf('name');
    const descIdx = headers.indexOf('description');
    const priceIdx = headers.indexOf('price_pkr');
    const catIdx = headers.indexOf('category');
    const imgIdx = headers.indexOf('image_url');

    const valid: CSVProduct[] = [];
    const errors: { row: number; message: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const rowNum = i + 1;

      const name = values[nameIdx]?.trim();
      const priceStr = values[priceIdx]?.trim();
      const category = values[catIdx]?.trim();

      if (!name) {
        errors.push({ row: rowNum, message: 'Missing product name' });
        continue;
      }

      const price = parseFloat(priceStr);
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, message: `Invalid price: ${priceStr}` });
        continue;
      }

      if (!category) {
        errors.push({ row: rowNum, message: 'Missing category' });
        continue;
      }

      valid.push({
        name,
        description: descIdx >= 0 ? values[descIdx]?.trim() || '' : '',
        price_pkr: price,
        category,
        image_url: imgIdx >= 0 ? values[imgIdx]?.trim() || '' : ''
      });
    }

    return { valid, errors };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setParseResult(null);

    try {
      const text = await selectedFile.text();
      const result = parseCSV(text);
      setParseResult(result);
    } catch (error) {
      toast({ title: 'Failed to parse CSV file', variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parseResult?.valid.length) return;

    setIsUploading(true);
    try {
      const productsToInsert = parseResult.valid.map(p => ({
        ...p,
        is_active: true
      }));

      const { error } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (error) throw error;

      toast({ title: `Successfully imported ${productsToInsert.length} products` });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      resetState();
    } catch (error: any) {
      toast({ title: error.message || 'Failed to import products', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-muted-foreground">
            <Download className="w-4 h-4 mr-2" /> Download Template
          </Button>

          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {isParsing ? (
              <Loader2 className="w-8 h-8 mx-auto text-muted-foreground animate-spin" />
            ) : file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              </>
            )}
          </div>

          {parseResult && (
            <div className="space-y-3">
              {parseResult.valid.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{parseResult.valid.length} products ready to import</span>
                </div>
              )}

              {parseResult.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{parseResult.errors.length} errors found</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-xs bg-muted p-2 rounded">
                    {parseResult.errors.slice(0, 10).map((err, i) => (
                      <p key={i}>Row {err.row}: {err.message}</p>
                    ))}
                    {parseResult.errors.length > 10 && (
                      <p className="text-muted-foreground mt-1">...and {parseResult.errors.length - 10} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setOpen(false); resetState(); }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleImport}
              disabled={!parseResult?.valid.length || isUploading}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Import ${parseResult?.valid.length || 0} Products`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
