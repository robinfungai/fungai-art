import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X, Plus, Minus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  category: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemoveItem }) => {
  const { toast } = useToast();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    toast({
      title: "Sacred Journey Begins!",
      description: "Redirecting to WhatsApp to complete your order with our botanical experts.",
    });
    
    const message = encodeURIComponent(
      `Hello! I'd like to order these sacred botanicals:\n\n${items.map(item => 
        `${item.name} (${item.price}) - Quantity: ${item.quantity}`
      ).join('\n')}\n\nPlease let me know the total cost and next steps.`
    );
    
    window.open(`https://wa.me/4917616212061?text=${message}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={onClose} />
      
      {/* Cart Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border/50 z-50 animate-slide-in-right shadow-mystical">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20 text-primary">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-inter text-xl font-semibold text-foreground">Sacred Cart</h2>
                <p className="text-sm text-muted-foreground">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full hover:bg-muted/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Your sacred cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Add some botanical treasures to begin</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-card/50 rounded-lg p-4 border border-border/30">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{item.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1 border-primary/30 text-primary/80">
                          {item.category}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-accent">{item.price}</span>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border/50 p-6 bg-card/30 backdrop-blur-sm">
              <Button 
                onClick={handleCheckout}
                className="w-full bg-gradient-mystical hover:shadow-glow transition-all duration-500 font-inter font-medium"
                size="lg"
              >
                Complete Sacred Order
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Continue via WhatsApp for personalized guidance
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;