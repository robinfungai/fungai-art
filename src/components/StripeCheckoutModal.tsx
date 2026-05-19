import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cartStore';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

function CheckoutForm({
  totalPrice,
  onSuccess,
}: {
  totalPrice: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          metadata: {
            name,
            email,
            address,
            items: items.map((i) => `${i.product.node.title} x${i.quantity}`).join(', '),
          },
        }),
      });

      const { clientSecret, error: intentError } = await res.json();
      if (intentError) throw new Error(intentError);

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name, email, address: { line1: address } },
        },
      });

      if (error) throw new Error(error.message);
      if (paymentIntent?.status === 'succeeded') {
        setPaid(true);
        clearCart();
        setTimeout(onSuccess, 2500);
      }
    } catch (err: unknown) {
      toast.error('Payment failed', {
        description: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-400" />
        <h3 className="text-lg font-semibold">Payment successful!</h3>
        <p className="text-sm text-muted-foreground">
          Thank you, {name}. A receipt will be sent to {email}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="stripe-name">Name</Label>
          <Input
            id="stripe-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stripe-email">Email</Label>
          <Input
            id="stripe-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@email.com"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="stripe-address">Shipping address</Label>
        <Input
          id="stripe-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="Street, city, country"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Card details</Label>
        <div
          className="rounded-md border px-3 py-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#f6f3ea',
                  fontFamily: 'inherit',
                  '::placeholder': { color: '#7a766c' },
                },
                invalid: { color: '#ff8b8b' },
              },
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full mt-1"
        size="lg"
        disabled={loading || !stripe}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay €${totalPrice.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

export function StripeCheckoutModal({
  open,
  onOpenChange,
  totalPrice,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  totalPrice: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete your order</DialogTitle>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <CheckoutForm totalPrice={totalPrice} onSuccess={() => onOpenChange(false)} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
