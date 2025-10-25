import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { DollarSign, Loader2, User, Landmark } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminCommissionsTab = () => {
    const { toast } = useToast();
    const [partnersSummary, setPartnersSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingPartnerId, setPayingPartnerId] = useState(null);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_partners_commission_summary');
            if (error) throw error;
            setPartnersSummary(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger le résumé des commissions." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchSummary();
        const channel = supabase.channel('admin-commissions-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_commissions' }, fetchSummary)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchSummary]);

    const handlePayPartner = async (partnerId) => {
        setPayingPartnerId(partnerId);
        try {
            const { data, error } = await supabase.rpc('mark_partner_commissions_paid', { p_partner_id: partnerId });
            if (error) throw error;
            
            if (data.success) {
                toast({ title: "Succès", description: `Paiement de ${data.amount_paid.toFixed(2)} € enregistré.` });
                fetchSummary();
            } else {
                toast({ variant: "destructive", title: "Action impossible", description: data.message });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur RPC", description: "Une erreur est survenue lors du paiement." });
        } finally {
            setPayingPartnerId(null);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;

    const totalAvailableToPay = partnersSummary.reduce((acc, partner) => acc + parseFloat(partner.available_balance), 0);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Landmark /> Solde Global à Payer</CardTitle>
                    <CardDescription>Montant total des commissions validées en attente de paiement.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold text-primary">{totalAvailableToPay.toFixed(2)} €</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><DollarSign /> Paiement des Partenaires</CardTitle>
                    <CardDescription>Validez les paiements des commissions pour chaque partenaire.</CardDescription>
                </CardHeader>
                <CardContent>
                    {partnersSummary.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Partenaire</th>
                                        <th className="px-4 py-3 text-right">Solde Disponible</th>
                                        <th className="px-4 py-3 text-right">Total Gagné</th>
                                        <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {partnersSummary.map((partner) => (
                                        <tr key={partner.partner_id} className="border-b border-border hover:bg-secondary">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-secondary rounded-full">
                                                        <User className="w-4 h-4 text-foreground"/>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{partner.partner_name}</p>
                                                        <p className="text-xs text-muted-foreground">{partner.partner_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-primary">{parseFloat(partner.available_balance).toFixed(2)} €</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">{parseFloat(partner.total_earned).toFixed(2)} €</td>
                                            <td className="px-4 py-3 text-center">
                                                {parseFloat(partner.available_balance) > 0 ? (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" disabled={payingPartnerId === partner.partner_id}>
                                                                {payingPartnerId === partner.partner_id ? <Loader2 className="animate-spin" /> : 'Payer'}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirmer le paiement ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Vous êtes sur le point de marquer toutes les commissions validées de <strong>{partner.partner_name}</strong> comme payées, pour un total de <strong>{parseFloat(partner.available_balance).toFixed(2)} €</strong>. Cette action est irréversible.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handlePayPartner(partner.partner_id)}>Confirmer</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Aucun paiement</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-10">Aucun partenaire avec des commissions à afficher.</p>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default AdminCommissionsTab;