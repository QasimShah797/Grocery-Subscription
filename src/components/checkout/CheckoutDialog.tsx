import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, Building2, Loader2, MapPin } from 'lucide-react';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  amount: number;
}

const bankOptions = [
  { id: 'hbl', name: 'HBL - Habib Bank Limited', iban: 'PK36HABB0012345678901234' },
  { id: 'ubl', name: 'UBL - United Bank Limited', iban: 'PK36UBBL0012345678901234' },
  { id: 'mcb', name: 'MCB - Muslim Commercial Bank', iban: 'PK36MCBL0012345678901234' },
  { id: 'alfalah', name: 'Bank Alfalah', iban: 'PK36ALFH0012345678901234' },
  { id: 'meezan', name: 'Meezan Bank (Islamic)', iban: 'PK36MEZN0012345678901234' },
  { id: 'allied', name: 'Allied Bank', iban: 'PK36ABPL0012345678901234' },
  { id: 'askari', name: 'Askari Bank', iban: 'PK36ASCM0012345678901234' },
  { id: 'faysal', name: 'Faysal Bank', iban: 'PK36FAYS0012345678901234' },
  { id: 'standard', name: 'Standard Chartered Pakistan', iban: 'PK36SCBL0012345678901234' },
  { id: 'js', name: 'JS Bank', iban: 'PK36JSBL0012345678901234' },
];

const paymentMethods = [
  {
    id: 'easypaisa',
    name: 'EasyPaisa',
    icon: Smartphone,
    color: 'bg-green-500',
    description: 'Pay via EasyPaisa mobile wallet',
    accountNumber: '0345-1234567',
    accountTitle: 'Fresh Grocery PKR',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    icon: Smartphone,
    color: 'bg-red-500',
    description: 'Pay via JazzCash mobile wallet',
    accountNumber: '0300-9876543',
    accountTitle: 'Fresh Grocery PKR',
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: Building2,
    description: 'Select your bank for direct transfer',
    accountTitle: 'Fresh Grocery PKR',
  },
] as const;

export function CheckoutDialog({ open, onOpenChange, subscriptionId, amount }: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank_transfer'>('easypaisa');
  const [selectedBank, setSelectedBank] = useState('hbl');
  const [senderAccount, setSenderAccount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [senderMobile, setSenderMobile] = useState('');
  const [step, setStep] = useState<'select' | 'details' | 'confirm' | 'success'>('select');
  const [errors, setErrors] = useState<{ name?: string; account?: string; mobile?: string; address?: string }>({});
  const createOrder = useCreateOrder();
  const { toast } = useToast();
  const { user } = useAuth();

  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod)!;
  const selectedBankInfo = bankOptions.find(b => b.id === selectedBank);

  // Auto-fill from user profile
  useEffect(() => {
    if (user && open) {
      const fetchProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, address')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          if (profile.full_name) setSenderName(profile.full_name);
          if (profile.phone) setSenderMobile(profile.phone);
          if (profile.address) setDeliveryAddress(profile.address);
        }
      };
      fetchProfile();
    }
  }, [user, open]);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-PK', { 
    style: 'currency', 
    currency: 'PKR', 
    minimumFractionDigits: 0 
  }).format(price);

  // Validation: Only alphabets and spaces allowed for name
  const handleNameChange = (value: string) => {
    const sanitized = value.replace(/[^a-zA-Z\s]/g, '');
    setSenderName(sanitized);
    if (sanitized && !/^[a-zA-Z\s]+$/.test(sanitized)) {
      setErrors(prev => ({ ...prev, name: 'Only alphabets are allowed' }));
    } else {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  // Validation: Only numbers allowed for account/IBAN (bank transfer allows alphanumeric for IBAN)
  const handleAccountChange = (value: string) => {
    if (paymentMethod === 'bank_transfer') {
      // IBAN can have alphanumeric
      setSenderAccount(value.toUpperCase());
      setErrors(prev => ({ ...prev, account: undefined }));
    } else {
      // Mobile wallets: only numbers and dashes
      const sanitized = value.replace(/[^0-9-]/g, '');
      setSenderAccount(sanitized);
      if (value !== sanitized) {
        setErrors(prev => ({ ...prev, account: 'Only numbers are allowed' }));
      } else {
        setErrors(prev => ({ ...prev, account: undefined }));
      }
    }
  };

  // Validation: Only numbers allowed for mobile number
  const handleMobileChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    setSenderMobile(sanitized);
    if (value !== sanitized) {
      setErrors(prev => ({ ...prev, mobile: 'Only numbers are allowed' }));
    } else {
      setErrors(prev => ({ ...prev, mobile: undefined }));
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after dialog closes
    setTimeout(() => {
      setStep('select');
      setSenderAccount('');
      setSenderName('');
      setDeliveryAddress('');
      setSenderMobile('');
      setErrors({});
    }, 300);
  };

  const validateDetailsStep = () => {
    const newErrors: typeof errors = {};
    
    if (!senderName.trim()) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(senderName)) {
      newErrors.name = 'Only alphabets are allowed';
    }

    if (!senderAccount.trim()) {
      newErrors.account = 'Account number is required';
    } else if (paymentMethod !== 'bank_transfer' && !/^[0-9-]+$/.test(senderAccount)) {
      newErrors.account = 'Only numbers are allowed';
    }

    if (!senderMobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]+$/.test(senderMobile)) {
      newErrors.mobile = 'Only numbers are allowed';
    } else if (senderMobile.length < 10 || senderMobile.length > 11) {
      newErrors.mobile = 'Enter a valid mobile number (10-11 digits)';
    }

    if (!deliveryAddress.trim()) {
      newErrors.address = 'Delivery address is required';
    } else if (deliveryAddress.trim().length < 10) {
      newErrors.address = 'Please enter a complete address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToConfirm = () => {
    if (validateDetailsStep()) {
      setStep('confirm');
    }
  };

  const handleSubmit = async () => {
    try {
      await createOrder.mutateAsync({
        subscription_id: subscriptionId,
        amount_pkr: amount,
        payment_method: paymentMethod,
        payment_details: {
          sender_account: senderAccount,
          sender_name: senderName,
          sender_mobile: senderMobile,
          delivery_address: deliveryAddress,
        },
      });
      
      setStep('success');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={step === 'success' ? handleClose : onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            {step === 'select' && 'Select Payment Method'}
            {step === 'details' && 'Payment Details'}
            {step === 'confirm' && 'Confirm Payment'}
            {step === 'success' && 'Order Placed Successfully!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">{formatPrice(amount)}</p>
            </div>

            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
              {paymentMethods.map((method) => (
                <Card 
                  key={method.id} 
                  className={`cursor-pointer transition-all ${paymentMethod === method.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <RadioGroupItem value={method.id} id={method.id} />
                    <div className={`w-10 h-10 rounded-full ${'color' in method ? method.color : 'bg-primary'} flex items-center justify-center`}>
                      <method.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={method.id} className="font-semibold cursor-pointer">{method.name}</Label>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>

            <Button className="w-full" onClick={() => setStep('details')}>
              Continue
            </Button>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-2">
                <Label>Select Your Bank</Label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankOptions.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <selectedMethod.icon className="w-5 h-5" />
                  {selectedMethod.name} Payment Details
                </h3>
                <div className="text-sm space-y-1">
                  {paymentMethod === 'bank_transfer' ? (
                    <>
                      <p><span className="text-muted-foreground">Our Bank:</span> {selectedBankInfo?.name}</p>
                      <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{selectedBankInfo?.iban}</span></p>
                    </>
                  ) : (
                    <p><span className="text-muted-foreground">Account Number:</span> <span className="font-mono">{'accountNumber' in selectedMethod ? selectedMethod.accountNumber : ''}</span></p>
                  )}
                  <p><span className="text-muted-foreground">Account Title:</span> {selectedMethod.accountTitle}</p>
                  <p className="font-semibold text-primary">Amount: {formatPrice(amount)}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="senderName">Your Name (alphabets only)</Label>
                <Input 
                  id="senderName" 
                  value={senderName} 
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderAccount">
                  Your {paymentMethod === 'bank_transfer' ? 'Account/IBAN' : 'Mobile'} Number
                </Label>
                <Input 
                  id="senderAccount" 
                  value={senderAccount} 
                  onChange={(e) => handleAccountChange(e.target.value)}
                  placeholder={paymentMethod === 'bank_transfer' ? 'Enter your IBAN' : 'e.g., 03451234567'}
                  className={errors.account ? 'border-destructive' : ''}
                />
                {errors.account && <p className="text-sm text-destructive">{errors.account}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderMobile">Your Mobile Number (for delivery updates)</Label>
                <Input 
                  id="senderMobile" 
                  value={senderMobile} 
                  onChange={(e) => handleMobileChange(e.target.value)}
                  placeholder="e.g., 03001234567"
                  maxLength={11}
                  className={errors.mobile ? 'border-destructive' : ''}
                />
                {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryAddress" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </Label>
                <Textarea 
                  id="deliveryAddress" 
                  value={deliveryAddress} 
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your complete delivery address including area, city"
                  rows={3}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleContinueToConfirm}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <Card className="bg-accent/20">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Order Summary</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Payment Method:</span> {selectedMethod.name}</p>
                  <p><span className="text-muted-foreground">Amount:</span> {formatPrice(amount)}</p>
                  <p><span className="text-muted-foreground">Sender Name:</span> {senderName}</p>
                  <p><span className="text-muted-foreground">Sender Account:</span> {senderAccount}</p>
                  <p><span className="text-muted-foreground">Mobile:</span> {senderMobile}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Delivery Address
                </h3>
                <p className="text-sm">{deliveryAddress}</p>
              </CardContent>
            </Card>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">Important:</p>
              <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-1 mt-1">
                <li>Please transfer the exact amount to the account shown above</li>
                <li>Your order will be confirmed after payment verification</li>
                <li>Verification usually takes 1-2 hours during business hours</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <>Confirm Order</>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold">Your order has been placed!</p>
              <p className="text-muted-foreground">
                Please transfer <span className="font-semibold text-primary">{formatPrice(amount)}</span> to complete your payment.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg text-sm text-left">
              <p className="font-semibold mb-2">What's next?</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Transfer the amount using {selectedMethod.name}</li>
                <li>We'll verify your payment within 1-2 hours</li>
                <li>Your order will be confirmed via notification</li>
              </ol>
            </div>

            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
