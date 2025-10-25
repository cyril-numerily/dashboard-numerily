import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/components/ui/use-toast';
import { Truck, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

const statusVariant = {
  'Nouvelle': 'default',
  'En cours': 'secondary',
  'Validée': 'outline',
  'Annulée': 'destructive',
};

const ServiceRequestDetails = ({ request }) => {
    return (
        <DialogContent className="sm:max-w-[525px] bg-background text-foreground">
            <DialogHeader>
                <DialogTitle>Détails de la demande</DialogTitle>
                <DialogDescription>
                    Informations complètes pour la demande de service de {request.user_name}.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-semibold">Client</span>
                    <span className="col-span-3">{request.user_name} ({request.user_email})</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-semibold">Service</span>
                    <span className="col-span-3">{request.service_title}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-semibold">Date</span>
                    <span className="col-span-3">{new Date(request.created_at).toLocaleString('fr-FR')}</span>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-semibold">Statut</span>
                    <div className="col-span-3"><Badge variant={statusVariant[request.status]}>{request.status}</Badge></div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-right font-semibold">Prix Final</span>
                    <span className="col-span-3">{request.final_price} €</span>
                </div>
                {request.promo_code && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold">Code Promo</span>
                        <span className="col-span-3 font-mono bg-muted px-2 py-1 rounded">{request.promo_code}</span>
                    </div>
                )}
                {request.details && (
                    <div className="grid grid-cols-1 gap-2">
                        <span className="font-semibold">Détails supplémentaires</span>
                        <p className="col-span-3 p-3 bg-muted rounded-md text-sm">{request.details}</p>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => { /* Close logic is handled by Dialog's internals */ }}>Fermer</Button>
            </DialogFooter>
        </DialogContent>
    );
};


const PartnerServiceTrackingTab = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const fetchRequests = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        try {
            // Fetch requests where the partner is the requester
            const { data, error } = await supabase
                .from('service_requests')
                .select('*')
                .eq('requested_by_id', profile.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger le suivi des services." });
        } finally {
            setLoading(false);
        }
    }, [profile, toast]);

    useEffect(() => {
        fetchRequests();
        const channel = supabase.channel('partner-tracking-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `requested_by_id=eq.${profile?.id}` }, fetchRequests)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [fetchRequests, profile]);

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
                <Card className="bg-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-white" />Suivi des Services Commandés</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {requests.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">Client</th>
                                            <th className="px-4 py-3">Service</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3 text-center">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map((req) => (
                                            <DialogTrigger asChild key={req.id}>
                                                <tr 
                                                    onClick={() => setSelectedRequest(req)}
                                                    className="border-b border-border hover:bg-secondary cursor-pointer"
                                                >
                                                    <td className="px-4 py-3 font-medium text-foreground">{req.user_name || 'N/A'}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{req.service_title}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{new Date(req.created_at).toLocaleDateString('fr-FR')}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge variant={statusVariant[req.status] || 'default'}>{req.status}</Badge>
                                                    </td>
                                                </tr>
                                            </DialogTrigger>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-10">Aucun service commandé pour le moment.</p>
                        )}
                    </CardContent>
                </Card>
                {selectedRequest && <ServiceRequestDetails request={selectedRequest} />}
            </Dialog>
        </motion.div>
    );
};

export default PartnerServiceTrackingTab;