import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Trash2, Ticket, Gift, Server, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const PromoCodesManagementTab = () => {
    const { toast } = useToast();
    const [promoCodes, setPromoCodes] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newCode, setNewCode] = useState({
        code: '',
        type: 'percentage',
        value: '',
        expires_at: '',
        applicable_service_id: null,
        max_uses: ''
    });

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: codesData, error: codesError } = await supabase
                .from('promo_codes')
                .select('*, services(title)')
                .order('created_at', { ascending: false });
            if (codesError) throw codesError;
            setPromoCodes(codesData || []);

            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('id, title');
            if (servicesError) throw servicesError;
            setServices(servicesData || []);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données.' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleCreateCode = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const codeToInsert = {
            ...newCode,
            value: parseFloat(newCode.value),
            expires_at: newCode.expires_at || null,
            applicable_service_id: newCode.applicable_service_id === 'all' ? null : newCode.applicable_service_id,
            max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
        };

        const { data, error } = await supabase.from('promo_codes').insert(codeToInsert).select().single();

        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        } else {
            toast({ title: 'Succès', description: `Le code "${newCode.code}" a été créé.` });
            
            // Send notification
            const { error: notifError } = await supabase.from('notifications').insert({
                title: 'Nouveau code promo disponible !',
                message: `Utilisez le code ${data.code} pour obtenir une réduction.`,
                target_segment: 'user',
                link_url: '/promocodes'
            });
            if (notifError) {
                 toast({ variant: 'destructive', title: 'Erreur de notification', description: "Le code a été créé, mais la notification n'a pas pu être envoyée." });
            }

            setNewCode({ code: '', type: 'percentage', value: '', expires_at: '', applicable_service_id: null, max_uses: '' });
            fetchInitialData();
        }
        setSubmitting(false);
    };

    const handleDeleteCode = async (id) => {
        const { error } = await supabase.from('promo_codes').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de supprimer le code.' });
        } else {
            toast({ title: 'Succès', description: 'Code promo supprimé.' });
            fetchInitialData();
        }
    };

    return (
        <div className="space-y-8">
            <Card className="border-none shadow-none">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-2">
                        <Gift className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Créer un Code Promo</CardTitle>
                    <CardDescription>Offrez des réductions à vos clients pour booster vos ventes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateCode} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end max-w-6xl mx-auto">
                        <div className="space-y-1">
                            <Label htmlFor="code-input">Code</Label>
                            <Input id="code-input" value={newCode.code} onChange={(e) => setNewCode({...newCode, code: e.target.value.toUpperCase()})} required placeholder="EX: SUMMER25" />
                        </div>
                        <div className="space-y-1">
                            <Label>Type</Label>
                            <Select value={newCode.type} onValueChange={(type) => setNewCode({...newCode, type})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                                    <SelectItem value="fixed">Montant Fixe (€)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="value-input">Valeur</Label>
                            <Input id="value-input" type="number" step="0.01" value={newCode.value} onChange={(e) => setNewCode({...newCode, value: e.target.value})} required placeholder="Ex: 25 ou 10.50" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="service-select">Service Applicable</Label>
                            <Select onValueChange={(value) => setNewCode({...newCode, applicable_service_id: value})} value={newCode.applicable_service_id || 'all'}>
                                <SelectTrigger><SelectValue placeholder="Sélectionner un service" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les services</SelectItem>
                                    {services.map(service => (
                                        <SelectItem key={service.id} value={service.id}>{service.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="max-uses-input">Utilisations Max</Label>
                            <Input id="max-uses-input" type="number" value={newCode.max_uses} onChange={(e) => setNewCode({...newCode, max_uses: e.target.value})} placeholder="Laisser vide pour illimité" />
                        </div>
                        <Button type="submit" disabled={submitting} className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4" /> {submitting ? 'Création...' : 'Créer le Code'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            
            <Card className="border-none shadow-none mt-8">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Codes Existants</CardTitle>
                    <CardDescription>Gérez tous les codes promo actuellement actifs ou expirés.</CardDescription>
                </CardHeader>
                <CardContent className="max-w-4xl mx-auto">
                    {loading ? <div className="flex justify-center py-8"><Loader /></div> : (
                        promoCodes.length > 0 ? (
                            <motion.ul layout className="space-y-3">
                                <AnimatePresence>
                                {promoCodes.map(code => (
                                    <motion.li 
                                        key={code.id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                        className="flex justify-between items-center p-4 bg-secondary rounded-lg"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Ticket className="h-6 w-6 text-primary" />
                                            <div>
                                                <p className="font-bold text-lg text-foreground font-mono">{code.code}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Réduction de {code.type === 'percentage' ? `${code.value}%` : `${code.value}€`}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    {code.applicable_service_id ? <Server className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                                    <span>{code.services?.title || 'Tous les services'}</span>
                                                    <span className="mx-1">|</span>
                                                    <span>{code.current_uses}/{code.max_uses || '∞'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCode(code.id)}>
                                            <Trash2 className="h-5 w-5 text-destructive" />
                                        </Button>
                                    </motion.li>
                                ))}
                                </AnimatePresence>
                            </motion.ul>
                        ) : (
                             <p className="text-center text-muted-foreground py-8">Aucun code promo créé pour le moment.</p>
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PromoCodesManagementTab;