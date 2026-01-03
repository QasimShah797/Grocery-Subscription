import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAllOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useAvailableRiders } from '@/hooks/useRiders';
import { useDeliveryAssignments, useCreateDeliveryAssignment, useAssignRider } from '@/hooks/useDeliveryAssignments';
import { Loader2, Eye, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function AdminOrders() {
  const { data: orders, isLoading } = useAllOrders();
  const { data: riders } = useAvailableRiders();
  const { data: deliveryAssignments } = useDeliveryAssignments();
  const updateOrderStatus = useUpdateOrderStatus();
  const createDeliveryAssignment = useCreateDeliveryAssignment();
  const assignRider = useAssignRider();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [transactionId, setTransactionId] = useState('');
  const [selectedRider, setSelectedRider] = useState('');

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

  const handleAssignRider = async (orderId: string) => {
    if (!selectedRider) {
      toast({ title: 'Please select a rider', variant: 'destructive' });
      return;
    }
    
    try {
      // Check if delivery assignment exists for this order
      const existingAssignment = deliveryAssignments?.find((a: any) => a.order_id === orderId);
      
      if (existingAssignment) {
        await assignRider.mutateAsync({ id: existingAssignment.id, rider_id: selectedRider });
      } else {
        await createDeliveryAssignment.mutateAsync({ order_id: orderId, rider_id: selectedRider });
      }
      
      toast({ title: 'Rider assigned successfully' });
      setSelectedRider('');
      setSelectedOrder(null);
    } catch {
      toast({ title: 'Failed to assign rider', variant: 'destructive' });
    }
  };

  const getDeliveryStatus = (orderId: string) => {
    const assignment = deliveryAssignments?.find((a: any) => a.order_id === orderId);
    return assignment?.status || null;
  };

  const getAssignedRider = (orderId: string) => {
    const assignment = deliveryAssignments?.find((a: any) => a.order_id === orderId);
    return assignment?.riders;
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

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'picked_up': return 'bg-blue-100 text-blue-700';
      case 'assigned': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
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
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => {
                  const deliveryStatus = getDeliveryStatus(order.id);
                  const assignedRider = getAssignedRider(order.id);
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-medium">
                        {order.user_id.slice(0, 8)}...
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
                      <TableCell>
                        {deliveryStatus ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(deliveryStatus)}`}>
                            {deliveryStatus}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => setSelectedOrder(order)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono text-xs">{selectedOrder.id}</p>
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
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Sender Details:</p>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> {selectedOrder.payment_details.sender_name}</p>
                    <p><span className="text-muted-foreground">Account:</span> {selectedOrder.payment_details.sender_account}</p>
                    {selectedOrder.payment_details.sender_mobile && (
                      <p><span className="text-muted-foreground">Mobile:</span> {selectedOrder.payment_details.sender_mobile}</p>
                    )}
                  </div>
                  {selectedOrder.payment_details.delivery_address && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium">Delivery Address:</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.payment_details.delivery_address}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rider Assignment Section */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Delivery Assignment</h3>
                </div>
                
                {getAssignedRider(selectedOrder.id) ? (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Assigned to:</span>{' '}
                      <span className="font-medium">{(getAssignedRider(selectedOrder.id) as any)?.profiles?.full_name || 'Rider'}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Status:</span>{' '}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDeliveryStatusColor(getDeliveryStatus(selectedOrder.id) || 'pending')}`}>
                        {getDeliveryStatus(selectedOrder.id)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Assign Rider</Label>
                    <div className="flex gap-2">
                      <Select value={selectedRider} onValueChange={setSelectedRider}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a rider" />
                        </SelectTrigger>
                        <SelectContent>
                          {riders?.map((rider: any) => (
                            <SelectItem key={rider.id} value={rider.id}>
                              {rider.phone} - {rider.vehicle_type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => handleAssignRider(selectedOrder.id)}
                        disabled={!selectedRider || assignRider.isPending || createDeliveryAssignment.isPending}
                      >
                        {(assignRider.isPending || createDeliveryAssignment.isPending) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Assign'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Transaction ID (optional)</Label>
                  <Input 
                    value={transactionId} 
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction ID after verification"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Update Payment Status</Label>
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