import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Leaf, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShopifyProduct, STOREFRONT_PRODUCTS_QUERY, storefrontApiRequest } from '@/lib/shopify';
import { useCartStore } from '@/stores/cartStore';

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
      const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, {
        first: 6,
        query: "product_type:Tincture"
      });
        setProducts(data.data.products.edges);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (product: ShopifyProduct) => {
    const firstVariant = product.node.variants.edges[0]?.node;
    if (!firstVariant) return;

    const cartItem = {
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || []
    };
    
    addItem(cartItem);
    
    toast.success("Added to cart", {
      description: `${product.node.title} has been added to your cart.`,
    });
  };

  if (isLoading) {
    return (
      <section className="py-16 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-golden" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background via-card/30 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-playfair text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Featured <span className="text-golden italic">Tinctures</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore our premium botanical extracts
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {products.map((product) => {
            const firstVariant = product.node.variants.edges[0]?.node;
            const firstImage = product.node.images.edges[0]?.node;
            const isComingSoon = product.node.tags?.includes('coming-soon');
            
            return (
              <Card 
                key={product.node.id} 
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/product/${product.node.handle}`)}
              >
                <div className="aspect-square overflow-hidden bg-secondary/20">
                  {firstImage ? (
                    <img 
                      src={firstImage.url}
                      alt={firstImage.altText || product.node.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Leaf className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                
                <CardContent className="p-3">
                  <h3 className="text-sm font-semibold line-clamp-2 mb-2">{product.node.title}</h3>
                  
                  {!isComingSoon && (
                    <p className="text-base font-bold text-golden mb-2">
                      €{parseFloat(firstVariant?.price.amount || '0').toFixed(2)}
                    </p>
                  )}
                  
                  {!isComingSoon && (
                    <Button 
                      size="sm"
                      className="w-full h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={!firstVariant?.availableForSale}
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                      Add
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => navigate('/products')}
            className="bg-gradient-mystical hover:shadow-glow transition-all duration-500"
          >
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
