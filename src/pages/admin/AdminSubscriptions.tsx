import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllSubscriptions, useUpdateSubscription } from '@/hooks/useSubscription';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminSubscriptions() {
  const { data: subscriptions, isLoading } = useAllSubscriptions();
  const updateSubscription = useUpdateSubscription();
  const { toast } = useToast();

  const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR', 
    minimumFractionDigits: 0 
  }).format(price);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateSubscription.mutateAsync({ id, status: status as any });
      toast({ title: 'Subscription status updated' });
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'paused': return 'warning';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Subscriptions</h1>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Next Renewal</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.profiles?.full_name || sub.profiles?.email || sub.user_id.slice(0, 8) + '...'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(sub.status) as any}>{sub.status}</Badge>
                    </TableCell>
                    <TableCell>{formatPrice(sub.total_pkr || 0)}</TableCell>
                    <TableCell>
                      {sub.next_renewal_date ? new Date(sub.next_renewal_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Select value={sub.status} onValueChange={(value) => handleStatusChange(sub.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
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
