import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Server, Edit, Trash2, PlusCircle, Save, X, Tag, MoveUp, MoveDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const ServiceForm = ({ service, categories, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: service?.title || '',
        short_description: service?.short_description || '',
        price: service?.price || '',
        icon: service?.icon || 'Tool',
        features: service?.features || [],
        subscription_discount_enabled: service?.subscription_discount_enabled ?? true,
        category_id: service?.category_id || null,
        custom_banner_config: service?.custom_banner_config || { enabled: false, steps: [] },
        is_for_individuals: service?.is_for_individuals ?? true,
        is_for_professionals: service?.is_for_professionals ?? true,
    });
    const [newFeature, setNewFeature] = useState('');

    useEffect(() => {
        setFormData({
            title: service?.title || '',
            short_description: service?.short_description || '',
            price: service?.price || '',
            icon: service?.icon || 'Tool',
            features: service?.features || [],
            subscription_discount_enabled: service?.subscription_discount_enabled ?? true,
            category_id: service?.category_id || null,
            custom_banner_config: service?.custom_banner_config || { enabled: false, steps: [{ status: 'Nouvelle', title: '', description: '' }] },
            is_for_individuals: service?.is_for_individuals ?? true,
            is_for_professionals: service?.is_for_professionals ?? true,
        });
    }, [service]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleCategoryChange = (value) => {
        setFormData(prev => ({ ...prev, category_id: value }));
    };

    const handleAddFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
            setNewFeature('');
        }
    };

    const handleRemoveFeature = (index) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    };

    const handleBannerConfigChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            custom_banner_config: {
                ...prev.custom_banner_config,
                [field]: value
            }
        }));
    };

    const handleBannerStepChange = (index, field, value) => {
        const newSteps = [...formData.custom_banner_config.steps];
        newSteps[index][field] = value;
        handleBannerConfigChange('steps', newSteps);
    };

    const addBannerStep = () => {
        const newSteps = [...formData.custom_banner_config.steps, { status: '', title: '', description: '' }];
        handleBannerConfigChange('steps', newSteps);
    };

    const removeBannerStep = (index) => {
        const newSteps = formData.custom_banner_config.steps.filter((_, i) => i !== index);
        handleBannerConfigChange('steps', newSteps);
    };

    const moveBannerStep = (index, direction) => {
        const newSteps = [...formData.custom_banner_config.steps];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newSteps.length) return;
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        handleBannerConfigChange('steps', newSteps);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, price: parseFloat(formData.price) });
    };

    return (
        <Card className="bg-secondary mt-4">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input name="title" value={formData.title} onChange={handleChange} placeholder="Titre du service" required />
                    <Textarea name="short_description" value={formData.short_description} onChange={handleChange} placeholder="Description courte" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Prix" required />
                      <Select onValueChange={handleCategoryChange} value={formData.category_id || ''}>
                          <SelectTrigger>
                              <SelectValue placeholder="Choisir une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                              {categories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                    </div>
                    <Input name="icon" value={formData.icon} onChange={handleChange} placeholder="Nom de l'icône (Lucide)" />
                    <div>
                        <Label>Caractéristiques</Label>
                        <div className="flex gap-2 mb-2">
                            <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Nouvelle caractéristique" />
                            <Button type="button" onClick={handleAddFeature}><PlusCircle className="h-4 w-4" /></Button>
                        </div>
                        <ul className="space-y-1">
                            {formData.features.map((feat, i) => (
                                <li key={i} className="flex justify-between items-center text-sm bg-background p-1 rounded">
                                    <span>{feat}</span>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveFeature(i)}><X className="h-4 w-4" /></Button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border">
                        <Label className="text-lg font-semibold">Audience</Label>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id={`is_for_individuals_${service?.id || 'new'}`} checked={formData.is_for_individuals} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_for_individuals: checked }))} />
                                <Label htmlFor={`is_for_individuals_${service?.id || 'new'}`}>Pour les particuliers</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id={`is_for_professionals_${service?.id || 'new'}`} checked={formData.is_for_professionals} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_for_professionals: checked }))} />
                                <Label htmlFor={`is_for_professionals_${service?.id || 'new'}`}>Pour les professionnels</Label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                         <Switch id={`sub_discount_${service?.id || 'new'}`} checked={formData.subscription_discount_enabled} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, subscription_discount_enabled: checked }))} />
                        <Label htmlFor={`sub_discount_${service?.id || 'new'}`}>Activer la réduction pour les abonnés</Label>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <Label className="text-lg font-semibold">Bannière Personnalisée</Label>
                            <Switch
                                checked={formData.custom_banner_config.enabled}
                                onCheckedChange={(checked) => handleBannerConfigChange('enabled', checked)}
                            />
                        </div>
                        {formData.custom_banner_config.enabled && (
                            <div className="space-y-4 pl-4 border-l-2 border-primary">
                                {formData.custom_banner_config.steps.map((step, index) => (
                                    <div key={index} className="p-3 bg-background/50 rounded-lg space-y-2 relative">
                                        <div className="flex items-center justify-between">
                                            <Label>Étape {index + 1}</Label>
                                            <div className="flex items-center">
                                                <Button type="button" size="icon" variant="ghost" onClick={() => moveBannerStep(index, -1)} disabled={index === 0}><MoveUp className="h-4 w-4" /></Button>
                                                <Button type="button" size="icon" variant="ghost" onClick={() => moveBannerStep(index, 1)} disabled={index === formData.custom_banner_config.steps.length - 1}><MoveDown className="h-4 w-4" /></Button>
                                                <Button type="button" size="icon" variant="ghost" onClick={() => removeBannerStep(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        </div>
                                        <Input value={step.status} onChange={(e) => handleBannerStepChange(index, 'status', e.target.value)} placeholder="Statut (ex: En cours)" />
                                        <Input value={step.title} onChange={(e) => handleBannerStepChange(index, 'title', e.target.value)} placeholder="Titre de l'étape" />
                                        <Textarea value={step.description} onChange={(e) => handleBannerStepChange(index, 'description', e.target.value)} placeholder="Description de l'étape" />
                                    </div>
                                ))}
                                <Button type="button" variant="outline" onClick={addBannerStep}>Ajouter une étape</Button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit"><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
                        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

const CategoriesManager = ({ categories, onCategoriesChange }) => {
    const { toast } = useToast();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        const { data, error } = await supabase.from('service_categories').insert({ name: newCategoryName }).select().single();
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'ajouter la catégorie." });
        } else {
            onCategoriesChange([...categories, data]);
            setNewCategoryName('');
            toast({ title: 'Succès', description: 'Catégorie ajoutée.' });
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory || !editingCategory.name.trim()) return;
        const { data, error } = await supabase.from('service_categories').update({ name: editingCategory.name }).eq('id', editingCategory.id).select().single();
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre à jour la catégorie." });
        } else {
            onCategoriesChange(categories.map(c => c.id === data.id ? data : c));
            setEditingCategory(null);
            toast({ title: 'Succès', description: 'Catégorie mise à jour.' });
        }
    };
    
    const handleDeleteCategory = async (categoryId) => {
        const { count, error: checkError } = await supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', categoryId);

        if (checkError) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de vérifier l\'utilisation de la catégorie.' });
            return;
        }

        if (count > 0) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer la catégorie, car elle est utilisée par un ou plusieurs services.' });
            return;
        }

        const { error } = await supabase.from('service_categories').delete().eq('id', categoryId);
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer la catégorie.' });
        } else {
            onCategoriesChange(categories.filter(c => c.id !== categoryId));
            toast({ title: 'Succès', description: 'Catégorie supprimée.' });
        }
    };
    
    return (
        <Card className="bg-card mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5 text-foreground" />Gestion des Catégories</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-4">
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nom de la nouvelle catégorie" />
                    <Button onClick={handleAddCategory}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter</Button>
                </div>
                <div className="space-y-2">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                             {editingCategory?.id === cat.id ? (
                                <Input value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} />
                             ) : (
                                <span className="text-foreground">{cat.name}</span>
                             )}
                            <div className="flex gap-1">
                                {editingCategory?.id === cat.id ? (
                                    <>
                                        <Button size="icon" variant="ghost" onClick={handleUpdateCategory}><Save className="h-4 w-4 text-green-500" /></Button>
                                        <Button size="icon" variant="ghost" onClick={() => setEditingCategory(null)}><X className="h-4 w-4 text-red-500" /></Button>
                                    </>
                                ) : (
                                    <>
                                        <Button size="icon" variant="ghost" onClick={() => setEditingCategory(cat)}><Edit className="h-4 w-4 text-foreground" /></Button>
                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};


const AdminServicesTab = () => {
    const { toast } = useToast();
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingService, setEditingService] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [servicesRes, categoriesRes] = await Promise.all([
                supabase.from('services').select('*, service_categories(name)').order('title'),
                supabase.from('service_categories').select('*').order('name'),
            ]);
            
            if (servicesRes.error) throw servicesRes.error;
            if (categoriesRes.error) throw categoriesRes.error;
            
            setServices(servicesRes.data || []);
            setCategories(categoriesRes.data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données." });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    
    const handleCategoriesChange = useCallback((newCategories) => {
        setCategories(newCategories);
    }, []);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveService = async (serviceData) => {
        const { service_categories, ...upsertData } = serviceData;
        if (editingService?.id) {
            upsertData.id = editingService.id;
        }

        const { error } = await supabase.from('services').upsert(upsertData, { onConflict: 'id' });
        if (error) {
            toast({ variant: "destructive", title: "Erreur", description: `Impossible de sauvegarder le service: ${error.message}` });
        } else {
            toast({ title: "Succès", description: "Service sauvegardé." });
            setEditingService(null);
            setIsCreating(false);
            fetchData();
        }
    };

    const handleDeleteService = async (serviceId) => {
        const { error } = await supabase.from('services').delete().eq('id', serviceId);
        if (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le service." });
        } else {
            toast({ title: "Succès", description: "Service supprimé." });
            setServices(services.filter(s => s.id !== serviceId));
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5 text-foreground" />Gestion des Services</CardTitle>
                        <Button onClick={() => { setIsCreating(true); setEditingService(null); }}><PlusCircle className="mr-2 h-4 w-4" /> Ajouter Service</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isCreating && <ServiceForm service={null} categories={categories} onSave={handleSaveService} onCancel={() => setIsCreating(false)} />}
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-sm text-left">
                            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Titre</th>
                                    <th className="px-4 py-3">Catégorie</th>
                                    <th className="px-4 py-3">Prix</th>
                                    <th className="px-4 py-3">Audience</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((service) => (
                                    <React.Fragment key={service.id}>
                                        <tr className="border-b border-border hover:bg-secondary">
                                            <td className="px-4 py-3 font-medium text-foreground">{service.title}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{service.service_categories?.name || 'N/A'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{service.price} €</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <div className="flex flex-col">
                                                    {service.is_for_individuals && <span>Particuliers</span>}
                                                    {service.is_for_professionals && <span>Professionnels</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Button size="icon" variant="ghost" onClick={() => { setEditingService(service); setIsCreating(false); }}><Edit className="h-4 w-4 text-foreground" /></Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteService(service.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            </td>
                                        </tr>
                                        {editingService?.id === service.id && (
                                            <tr>
                                                <td colSpan="5">
                                                    <ServiceForm service={editingService} categories={categories} onSave={handleSaveService} onCancel={() => setEditingService(null)} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <CategoriesManager categories={categories} onCategoriesChange={handleCategoriesChange} />
        </motion.div>
    );
};

export default AdminServicesTab;