import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { getSubscriptionDetails } from '@/config/subscriptions';
import * as LucideIcons from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ServiceCard = ({ service, isPartner, partnerId, subscriptionDiscount }) => {
  const ServiceIcon = service.icon ? LucideIcons[service.icon] || LucideIcons.Package : LucideIcons.Package;
  const navigate = useNavigate();

  const handleOrderClick = () => {
    let path = `/book-service/${service.id}`;
    if (isPartner) {
      path += `?partner_id=${partnerId}`;
    }
    navigate(path);
  };
  
  const originalPrice = service.price;
  const hasDiscount = subscriptionDiscount > 0 && service.subscription_discount_enabled;
  const discountedPrice = hasDiscount ? originalPrice * (1 - subscriptionDiscount / 100) : originalPrice;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col bg-card hover:border-primary/50 transition-colors duration-300 border border-border/50">
        <CardHeader className="flex-row items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <ServiceIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">{service.title}</CardTitle>
            <CardDescription>{service.short_description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {service.features?.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <LucideIcons.Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4 pt-6">
            <div className="text-center">
                {hasDiscount && (
                    <span className="text-lg text-muted-foreground line-through mr-2">{originalPrice.toFixed(2)}€</span>
                )}
                <span className="text-4xl font-bold text-foreground">{discountedPrice.toFixed(2)}€</span>
                 {hasDiscount && (
                    <p className="text-sm text-primary font-semibold">(-{subscriptionDiscount}%)</p>
                )}
            </div>
            <Button onClick={handleOrderClick} className="w-full">
                Commander
            </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const ServiceGrid = ({ services, isPartner, partnerId, subscriptionDiscount }) => {
    if (services.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 col-span-full"
            >
                <LucideIcons.XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">Aucun service trouvé</h3>
                <p className="mt-1 text-sm text-muted-foreground">Essayez de modifier vos filtres ou votre recherche.</p>
            </motion.div>
        );
    }

    return (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
                {services.map(service => (
                    <ServiceCard 
                        key={service.id} 
                        service={service} 
                        isPartner={isPartner}
                        partnerId={partnerId}
                        subscriptionDiscount={subscriptionDiscount}
                    />
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

const ServiceCatalogPage = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const subscriptionDetails = getSubscriptionDetails(profile?.subscription);
  const subscriptionDiscount = subscriptionDetails.discountPercentage;

  const fetchServicesAndCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*, service_categories(name)')
        .order('price');
      if (servicesError) throw servicesError;
      setServices(servicesData);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*');
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Impossible de charger les données : ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServicesAndCategories();
  }, [fetchServicesAndCategories]);

  const filteredServices = useMemo(() => {
    return services
      .filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.short_description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(service =>
        selectedCategory === 'all' || service.service_categories?.name === selectedCategory
      );
  }, [services, searchTerm, selectedCategory]);

  const individualServices = useMemo(() => filteredServices.filter(s => s.is_for_individuals), [filteredServices]);
  const professionalServices = useMemo(() => filteredServices.filter(s => s.is_for_professionals), [filteredServices]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader size="lg" /></div>;
  }

  return (
    <>
      <Helmet>
        <title>Catalogue des Services - Numerily</title>
        <meta name="description" content="Découvrez tous les services proposés par Numerily. Dépannage, connectivité, cloud et plus encore." />
      </Helmet>
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-foreground tracking-tight">Catalogue des Services</h1>
          <p className="text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">Trouvez la solution parfaite pour vos besoins numériques. Simple, rapide et efficace.</p>
        </motion.div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
                <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Rechercher un service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                />
            </div>
            <Select onValueChange={setSelectedCategory} defaultValue="all">
                <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                            {category.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {profile?.role === 'user' && (
                <Button onClick={() => navigate('/service-requests')} className="w-full sm:w-auto">
                    <LucideIcons.ListChecks className="mr-2 h-4 w-4" />
                    Mes demandes
                </Button>
            )}
        </div>

        {searchTerm || selectedCategory !== 'all' ? (
            <ServiceGrid 
                services={filteredServices}
                isPartner={profile?.role === 'partner'}
                partnerId={profile?.id}
                subscriptionDiscount={subscriptionDiscount}
            />
        ) : (
            <Tabs defaultValue="individuals" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="individuals">Pour les Particuliers</TabsTrigger>
                    <TabsTrigger value="professionals">Pour les Professionnels</TabsTrigger>
                </TabsList>
                <TabsContent value="individuals">
                    <ServiceGrid 
                        services={individualServices}
                        isPartner={profile?.role === 'partner'}
                        partnerId={profile?.id}
                        subscriptionDiscount={subscriptionDiscount}
                    />
                </TabsContent>
                <TabsContent value="professionals">
                    <ServiceGrid 
                        services={professionalServices}
                        isPartner={profile?.role === 'partner'}
                        partnerId={profile?.id}
                        subscriptionDiscount={subscriptionDiscount}
                    />
                </TabsContent>
            </Tabs>
        )}
      </div>
    </>
  );
};

export default ServiceCatalogPage;