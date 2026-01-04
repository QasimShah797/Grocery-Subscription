import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CSVImportDialog } from '@/components/admin/CSVImportDialog';

interface ProductForm {
  name: string;
  description: string;
  price_pkr: number;
  category: string;
  image_url: string;
  is_active: boolean;
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  price_pkr: 0,
  category: '',
  image_url: '',
  is_active: true,
};

export default function AdminProducts() {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR', 
    minimumFractionDigits: 0 
  }).format(price);

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price_pkr: product.price_pkr,
      category: product.category,
      image_url: product.image_url || '',
      is_active: product.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct.mutateAsync(id);
        toast({ title: 'Product deleted successfully' });
      } catch {
        toast({ title: 'Failed to delete product', variant: 'destructive' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...form });
        toast({ title: 'Product updated successfully' });
      } else {
        await createProduct.mutateAsync(form);
        toast({ title: 'Product created successfully' });
      }
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch {
      toast({ title: 'Failed to save product', variant: 'destructive' });
    }
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold">Products</h1>
        <div className="flex gap-2">
          <CSVImportDialog />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (PKR)</Label>
                  <Input id="price" type="number" value={form.price_pkr} onChange={(e) => setForm({ ...form, price_pkr: Number(e.target.value) })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input id="image_url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch id="is_active" checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
              </div>
              <Button type="submit" className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>
                {(createProduct.isPending || updateProduct.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Update' : 'Create')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img src={product.image_url || '/placeholder.svg'} alt={product.name} className="w-12 h-12 rounded object-cover" />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{formatPrice(product.price_pkr)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
