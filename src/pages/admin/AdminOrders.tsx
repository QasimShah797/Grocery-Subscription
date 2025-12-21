import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAllOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { Loader2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function AdminOrders() {
  const { data: orders, isLoading } = useAllOrders();
  const updateOrderStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');

  const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR', 
    minimumFractionDigits: 0 
  }).format(price);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateOrderStatus.mutateAsync({ id, payment_status: status, transaction_id: transactionId || undefined });
      toast({ title: 'Order status updated' });
      setSelectedOrder(null);
      setTransactionId('');
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'default';
      case 'failed': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'easypaisa': return 'bg-green-100 text-green-700';
      case 'jazzcash': return 'bg-red-100 text-red-700';
      case 'bank_transfer': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Orders</h1>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">
                      {(order as any).profiles?.full_name || (order as any).profiles?.email || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(order.payment_method)}`}>
                        {order.payment_method.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">{formatPrice(order.amount_pkr)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(order.payment_status) as any}>{order.payment_status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => setSelectedOrder(order)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">{formatPrice(selectedOrder.amount_pkr)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <p className="capitalize">{selectedOrder.payment_method.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Status</p>
                  <Badge variant={getStatusColor(selectedOrder.payment_status) as any}>{selectedOrder.payment_status}</Badge>
                </div>
              </div>

              {selectedOrder.payment_details && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Sender Details:</p>
                  <p className="text-sm">Name: {selectedOrder.payment_details.sender_name}</p>
                  <p className="text-sm">Account: {selectedOrder.payment_details.sender_account}</p>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction ID (optional)</label>
                  <Input 
                    value={transactionId} 
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID after verification"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Update Status</label>
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
