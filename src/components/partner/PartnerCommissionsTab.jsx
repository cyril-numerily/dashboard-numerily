import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/components/ui/use-toast';
import { PieChart, Landmark, History } from 'lucide-react';

const statusVariant = {
  validated: 'secondary',
  paid: 'outline',
};
const statusText = {
  validated: 'Validée',
  paid: 'Payée',
};

const PartnerCommissionsTab = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [commissions, setCommissions] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalAvailable, setTotalAvailable] = useState(0);

    const fetchData = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const [commissionsRes, payoutsRes] = await Promise.all([
                supabase
                    .from('partner_commissions')
                    .select('*, request:service_request_id(service_title, user_id(name))')
                    .eq('partner_id', profile.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('commission_payouts')
                    .select('*')
                    .eq('partner_id', profile.id)
                    .order('payout_date', { ascending: false })
            ]);

            if (commissionsRes.error) throw commissionsRes.error;
            if (payoutsRes.error) throw payoutsRes.error;
            
            const commissionData = commissionsRes.data || [];
            setCommissions(commissionData);
            setPayouts(payoutsRes.data || []);
            
            const total = commissionData.reduce((acc, com) => {
                return com.status === 'validated' ? acc + com.amount : acc;
            }, 0);
            setTotalAvailable(total);

        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données de commissions." });
        } finally {
            setLoading(false);
        }
    }, [profile, toast]);

    useEffect(() => {
        if (!profile) return;
        fetchData();
        const channel = supabase.channel(`partner-commissions-payouts-${profile.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_commissions', filter: `partner_id=eq.${profile.id}` }, fetchData)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'commission_payouts', filter: `partner_id=eq.${profile.id}` }, fetchData)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [profile, fetchData]);

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card className="bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Landmark /> Solde Disponible</CardTitle>
                    <CardDescription>Commissions validées prêtes pour le paiement.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-primary">{totalAvailable.toFixed(2)} €</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PieChart /> Historique des Commissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {commissions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">Service</th>
                                            <th className="px-4 py-3">Montant</th>
                                            <th className="px-4 py-3 text-center">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {commissions.map((com) => (
                                            <tr key={com.id} className="border-b border-border hover:bg-secondary">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-foreground">{com.request?.service_title || 'N/A'}</p>
                                                    <p className="text-xs text-muted-foreground">Client: {com.request?.user_id?.name || 'N/A'}</p>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{com.amount.toFixed(2)} €</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant={statusVariant[com.status] || 'default'} className="capitalize">{statusText[com.status] || com.status}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-10">Aucune commission générée pour le moment.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History /> Historique des Paiements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payouts.length > 0 ? (
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3 text-right">Montant Payé</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.map((payout) => (
                                            <tr key={payout.id} className="border-b border-border hover:bg-secondary">
                                                <td className="px-4 py-3 text-muted-foreground">{new Date(payout.payout_date).toLocaleDateString('fr-FR')}</td>
                                                <td className="px-4 py-3 text-right font-medium text-primary">{payout.amount_paid.toFixed(2)} €</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-10">Aucun paiement reçu pour le moment.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
};

export default PartnerCommissionsTab;