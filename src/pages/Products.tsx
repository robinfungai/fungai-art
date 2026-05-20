import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import botanicalFooter from '@/assets/botanical-footer-bg.jpg';
import { ShopifyProduct, STOREFRONT_PRODUCTS_QUERY, storefrontApiRequest } from '@/lib/shopify';
import { useCartStore } from '@/stores/cartStore';

const Products = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const addItem = useCartStore(state => state.addItem);

  const categories = [
    { id: "all", name: "All Products" },
    { id: "Tinctures", name: "Tinctures" },
    { id: "Composition", name: "Compositions" },
    { id: "Flower", name: "Flowers" },
    { id: "Herbal Mix", name: "Herbal Mix" },
    { id: "Essential Oil", name: "Essential Oils" },
    { id: "Mushroom", name: "Mushrooms" },
    { id: "Special", name: "Special" },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 50 });
        setProducts(data.data.products.edges);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        toast.error("Failed to load products", {
          description: "Please try again later"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.node.productType === selectedCategory);

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-righteous text-5xl md:text-7xl mb-4 bg-gradient-to-r from-mystical via-golden to-primary-glow bg-clip-text text-transparent tracking-wide animate-glow-pulse">
            Magick Potions
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover our full spectrum tinctures and indigenous herbs
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="rounded-full"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-golden mx-auto mb-4" />
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md">
              <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No products found</h2>
              <p className="text-muted-foreground mb-6">
                Your store is ready, but there are no products yet. Create your first product to get started!
              </p>
              <p className="text-sm text-muted-foreground">
                Tell me what product you'd like to create, including the name, description, and price.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => {
              const firstVariant = product.node.variants.edges[0]?.node;
              const firstImage = product.node.images.edges[0]?.node;
              const isComingSoon = product.node.tags?.includes('coming-soon');
              
              return (
                <Card 
                  key={product.node.id} 
                  className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => window.location.href = `/product/${product.node.handle}`}
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
                  
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm line-clamp-2 leading-tight">{product.node.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-2">
                      {!isComingSoon && (
                        <p className="text-lg font-bold text-golden">
                          €{parseFloat(firstVariant?.price.amount || '0').toFixed(2)}
                        </p>
                      )}
                      
                      {isComingSoon ? (
                        <Badge variant="secondary" className="w-full justify-center py-1">
                          Coming Soon
                        </Badge>
                      ) : (
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
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer 
        className="relative mt-20 py-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${botanicalFooter})` }}
      >
        <div className="absolute inset-0 bg-background/90"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <Leaf className="w-12 h-12 text-golden mx-auto mb-4" />
          <p className="text-muted-foreground">
            © 2024 fungai art. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Products;
