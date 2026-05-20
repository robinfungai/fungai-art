import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Sparkles, Droplets, Flower2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
// Import category background images
import tinctures from '@/assets/tinctures-bg.jpg';
import powders from '@/assets/powders-bg.jpg';
import extracts from '@/assets/extracts-bg.jpg';
import flowers from '@/assets/flowers-bg.jpg';
import compounds from '@/assets/compounds-bg.jpg';
import oils from '@/assets/oils-bg.jpg';
import mushrooms from '@/assets/mushrooms-bg.jpg';
import special from '@/assets/special-bg.jpg';
import lipospagyrics from '@/assets/lipospagyrics-bg.jpg';

const SacredOfferingsSection = () => {

  const categories = [
    { 
      id: 'tinctures', 
      name: 'Tinctures', 
      icon: <Droplets className="h-6 w-6" />,
      description: '30ml bottle with pipette easy for dosing, UV protected mirrored glass',
      image: tinctures,
      productCount: '14+ products'
    },
    { 
      id: 'powders', 
      name: 'Powders', 
      icon: <Sparkles className="h-6 w-6" />,
      description: 'Sold in 33g or 111g packs',
      image: powders,
      productCount: '10+ products'
    },
    { 
      id: 'extracts', 
      name: 'Extracts', 
      icon: <Leaf className="h-6 w-6" />,
      description: 'High-potency standardized plant extracts',
      image: extracts,
      productCount: '3+ products'
    },
    { 
      id: 'flowers', 
      name: 'Flowers / Leaves', 
      icon: <Flower2 className="h-6 w-6" />,
      description: 'Sold individually 11g, 33g, 111g, 1000g',
      image: flowers,
      productCount: '25+ products'
    },
    { 
      id: 'compounds', 
      name: 'Compounds', 
      icon: <Sparkles className="h-6 w-6" />,
      description: '25ml bottle with pipette, UV protected mirrored glass',
      image: compounds,
      productCount: '14+ products'
    },
    { 
      id: 'oils', 
      name: 'Essential Oils', 
      icon: <Droplets className="h-6 w-6" />,
      description: '5ml bottle with pipette, UV protected mirrored glass',
      image: oils,
      productCount: '8+ products'
    },
    { 
      id: 'mushrooms', 
      name: 'Mushrooms', 
      icon: <Leaf className="h-6 w-6" />,
      description: 'Gathered from all around the world - sold individually per request',
      image: mushrooms,
      productCount: '13+ products'
    },
    { 
      id: 'special', 
      name: 'Special', 
      icon: <Sparkles className="h-6 w-6" />,
      description: 'Gathered from all around the world - all sold individually',
      image: special,
      productCount: '15+ products'
    },
    { 
      id: 'lipo-spagyrics', 
      name: 'Lipospagyrics', 
      icon: <Flower2 className="h-6 w-6" />,
      description: 'Advanced liposomal spagyric preparations using ultrasonic technology',
      image: lipospagyrics,
      productCount: '4+ products'
    }
  ];


  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Organic Background Flow */}
      <div className="absolute inset-0 bg-gradient-to-br from-earth to-mushroom">
        <svg viewBox="0 0 1200 600" className="w-full h-full">
          <path
            d="M0,0 Q300,150 600,100 T1200,200 L1200,600 L0,600 Z"
            fill="url(#flow-gradient-1)"
          />
          <path
            d="M0,100 Q400,250 800,150 T1200,300 L1200,600 L0,600 Z"
            fill="url(#flow-gradient-2)"
          />
          <defs>
            <linearGradient id="flow-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--forest-deep))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--mystical-purple))" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="flow-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
              <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-semibold text-foreground mb-6">
            Discover Our 
            <span className="text-golden italic"> Collections</span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our carefully curated collection of botanical treasures, 
            each chosen for their unique properties and connection to nature's wisdom.
          </p>
        </div>

        {/* Categories Carousel */}
        <div className="relative mb-12">
          <Carousel 
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {categories.map((category, index) => (
                 <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                   <Card className="relative h-full bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-mystical transition-all duration-500 group overflow-hidden">
                     {/* Background Image */}
                     <div 
                       className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-45 transition-opacity duration-500"
                       style={{
                         backgroundImage: `url(${category.image})`,
                         filter: 'sepia(30%) hue-rotate(90deg) saturate(80%) brightness(0.8)'
                       }}
                     />
                     
                     {/* Content Overlay */}
                     <CardContent className="relative z-10 p-6 h-full flex flex-col bg-gradient-to-br from-background/30 via-background/40 to-background/60 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-full bg-primary/20 text-primary group-hover:bg-primary/30 transition-colors">
                          {category.icon}
                        </div>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {category.productCount}
                        </Badge>
                      </div>
                      
                      <h3 className="font-inter text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm mb-6 flex-grow leading-relaxed">
                        {category.description}
                      </p>
                      
                      <div className="flex justify-between items-center mt-auto">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-primary/50 text-primary hover:bg-primary/10 w-full"
                          onClick={() => window.location.href = `/products?category=${category.id}`}
                        >
                          Browse {category.name}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-primary/30 hover:bg-primary/10" />
            <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-primary/30 hover:bg-primary/10" />
          </Carousel>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-gradient-mystical hover:shadow-glow transition-all duration-500 font-inter font-medium px-12"
            style={{ borderRadius: '30px' }}
            onClick={() => window.location.href = '/products'}
          >
            Explore Full Collection
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Discover over 20+ botanical treasures and sacred plant medicines
          </p>
        </div>
      </div>
    </section>
  );
};

export default SacredOfferingsSection;