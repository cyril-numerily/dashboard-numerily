import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { Wrench, History, Loader2, Info, ArrowRight, X, Check } from 'lucide-react';
import { getSubscriptionDetails } from '@/config/subscriptions';
import { useNavigate } from 'react-router-dom';

const troubleshootingCategories = [
    "Problèmes de démarrage",
    "Lenteurs et performances",
    "Virus et sécurité",
    "Problèmes de connexion Internet",
    "Périphériques (imprimante, etc.)",
    "Logiciels et applications",
    "Mises à jour",
    "Autre"
];

const TicketStatusBadge = ({ status }) => {
    const statusStyles = {
        'Ouvert': 'bg-green-100 text-green-800',
        'En cours': 'bg-yellow-100 text-yellow-800',
        'Fermé': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const CalEmbed = () => {
    useEffect(() => {
        const scriptId = 'cal-embed-script-depannage-gratuit';
        if (document.getElementById(scriptId)) {
            if (window.Cal) {
                window.Cal.ns["depannage-gratuit"]("inline", {
                    elementOrSelector: "#my-cal-inline-depannage-gratuit",
                    config: { "layout": "month_view", "theme": "dark" },
                    calLink: "numerily/depannage-gratuit",
                });
                window.Cal.ns["depannage-gratuit"]("ui", { "theme": "dark", "cssVarsPerTheme": { "light": { "cal-brand": "#8C00FF" }, "dark": { "cal-brand": "#0046ff" } }, "hideEventTypeDetails": true, "layout": "month_view" });
            }
            return;
        }

        (function (C, A, L) {
            let p = function (a, ar) { a.q.push(ar); };
            let d = C.document;
            C.Cal = C.Cal || function () {
                let cal = C.Cal;
                let ar = arguments;
                if (!cal.loaded) {
                    cal.ns = {};
                    cal.q = cal.q || [];
                    const script = d.createElement("script");
                    script.src = A;
                    script.id = scriptId;
                    d.head.appendChild(script);
                    cal.loaded = true;
                }
                if (ar[0] === L) {
                    const api = function () { p(api, arguments); };
                    const namespace = ar[1];
                    api.q = api.q || [];
                    if (typeof namespace === "string") {
                        cal.ns[namespace] = cal.ns[namespace] || api;
                        p(cal.ns[namespace], ar);
                        p(cal, ["initNamespace", namespace]);
                    } else p(cal, ar);
                    return;
                }
                p(cal, ar);
            };
        })(window, "https://app.cal.com/embed/embed.js", "init");

        window.Cal("init", "depannage-gratuit", { origin: "https://app.cal.com" });

        window.Cal.ns["depannage-gratuit"]("inline", {
            elementOrSelector: "#my-cal-inline-depannage-gratuit",
            config: { "layout": "month_view", "theme": "dark" },
            calLink: "numerily/depannage-gratuit",
        });

        window.Cal.ns["depannage-gratuit"]("ui", { "theme": "dark", "cssVarsPerTheme": { "light": { "cal-brand": "#8C00FF" }, "dark": { "cal-brand": "#0046ff" } }, "hideEventTypeDetails": true, "layout": "month_view" });

    }, []);

    return <div style={{ width: '102%', height: '600px', overflow: 'scroll' }} id="my-cal-inline-depannage-gratuit"></div>;
};


const TroubleshootingPage = () => {
    const { profile, loading: authLoading, refreshUserProfile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState({ form: false, tickets: true, booking: false });
    const [showCalendar, setShowCalendar] = useState(false);
    const [createdTicketId, setCreatedTicketId] = useState(null);

    const subscriptionDetails = getSubscriptionDetails(profile?.subscription);
    const usageLimit = subscriptionDetails.troubleshootingQuota;
    const isUnlimited = usageLimit === Infinity;
    const ticketsThisMonth = profile?.troubleshooting_usage?.count || 0;
    const canCreateTicket = isUnlimited || ticketsThisMonth < usageLimit;

    useEffect(() => {
        if (profile) {
            setDevices(profile.devices || []);
            fetchTickets();
        }
    }, [profile]);

    const fetchTickets = async () => {
        if (!profile) return;
        setLoading(prev => ({ ...prev, tickets: true }));
        const { data, error } = await supabase
            .from('troubleshooting_tickets')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger vos tickets de dépannage.' });
        } else {
            setTickets(data);
        }
        setLoading(prev => ({ ...prev, tickets: false }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedDevice || !category || !description) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez remplir tous les champs.' });
            return;
        }
        setLoading(prev => ({ ...prev, form: true }));

        const { data, error } = await supabase.from('troubleshooting_tickets').insert({
            user_id: profile.id,
            device: selectedDevice,
            category,
            description,
            status: 'Ouvert'
        }).select().single();

        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de créer le ticket." });
            setLoading(prev => ({ ...prev, form: false }));
            return;
        }
        
        setCreatedTicketId(data.id);
        toast({ title: 'Étape suivante', description: 'Veuillez maintenant prendre rendez-vous.' });
        setShowCalendar(true);
        setLoading(prev => ({ ...prev, form: false }));
    };

    const handleBookingConfirmation = async () => {
        setLoading(prev => ({ ...prev, booking: true }));
        
        const newCount = (profile.troubleshooting_usage?.count || 0) + 1;
        const { error: profileError } = await supabase.from('profiles').update({ 
            troubleshooting_usage: {
                ...profile.troubleshooting_usage,
                count: newCount,
                last_ticket_at: new Date().toISOString()
            }
        }).eq('id', profile.id);

        if (profileError) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre à jour votre quota. Veuillez réessayer." });
            setLoading(prev => ({ ...prev, booking: false }));
            return;
        }

        await refreshUserProfile();
        await fetchTickets();
        toast({ title: 'Succès', description: 'Votre rendez-vous est confirmé et votre ticket a été comptabilisé.' });
        setLoading(prev => ({ ...prev, booking: false }));
        navigate('/dashboard');
    };

    const handleBookingCancellation = async () => {
        if (createdTicketId) {
            await supabase.from('troubleshooting_tickets').delete().eq('id', createdTicketId);
            setCreatedTicketId(null);
        }
        setShowCalendar(false);
        toast({ title: 'Annulé', description: 'La création du ticket a été annulée.' });
    };
    
    const usageText = isUnlimited
        ? "Vous bénéficiez de dépannages gratuits illimités."
        : `Vous avez utilisé ${ticketsThisMonth} sur ${usageLimit} dépannages gratuits ce mois-ci.`;


    if (authLoading || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (showCalendar) {
        return (
            <>
                <Helmet><title>Prendre Rendez-vous - Numerily</title></Helmet>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-4xl mx-auto space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-foreground">Planifier votre session de dépannage</h1>
                        <p className="text-lg text-muted-foreground mt-2">Choisissez un créneau qui vous convient pour votre session d'assistance à distance.</p>
                    </div>
                    <Card>
                        <CardContent className="p-2 md:p-6">
                            <CalEmbed />
                        </CardContent>
                    </Card>
                    <div className="flex justify-between items-center">
                        <Button variant="outline" onClick={handleBookingCancellation} disabled={loading.booking}>
                            <X className="mr-2 h-4 w-4" />
                            Annuler
                        </Button>
                        <Button onClick={handleBookingConfirmation} disabled={loading.booking}>
                            {loading.booking ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2 h-4 w-4" />}
                            J'ai réservé
                        </Button>
                    </div>
                </motion.div>
            </>
        );
    }

    return (
        <>
            <Helmet><title>Dépannage Gratuit - Numerily</title></Helmet>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <Wrench className="mx-auto h-12 w-12 text-foreground mb-4" />
                    <h1 className="text-4xl font-bold text-foreground">Dépannage PC à Distance</h1>
                    <p className="text-lg text-muted-foreground mt-2">Un problème avec votre ordinateur ? Soumettez un ticket et nous vous aiderons.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Nouveau Ticket de Dépannage</CardTitle>
                        <CardDescription>
                           {usageText}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {canCreateTicket ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select onValueChange={setSelectedDevice} value={selectedDevice} disabled={devices.length === 0}>
                                        <SelectTrigger><SelectValue placeholder="Sélectionnez un PC" /></SelectTrigger>
                                        <SelectContent>
                                            {devices.length > 0 ? devices.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>) : <SelectItem value="none" disabled>Aucun PC enregistré</SelectItem>}
                                        </SelectContent>
                                    </Select>
                                    <Select onValueChange={setCategory} value={category}>
                                        <SelectTrigger><SelectValue placeholder="Catégorie du problème" /></SelectTrigger>
                                        <SelectContent>
                                            {troubleshootingCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Textarea
                                    placeholder="Décrivez précisément le problème que vous rencontrez avec votre PC..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                />
                                <Button type="submit" disabled={loading.form}>
                                    {loading.form ? <Loader2 className="animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                    Continuer
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground bg-secondary rounded-lg">
                                <Info className="mx-auto h-8 w-8 mb-2" />
                                <p>Vous avez atteint votre limite de dépannages pour ce mois.</p>
                                <p className="text-sm">Passez à un abonnement supérieur pour plus de dépannages.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><History/> Historique de vos tickets</CardTitle>
                        <CardDescription>Suivez l'état de vos demandes de dépannage.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading.tickets ? <Loader /> : (
                            tickets.length > 0 ? (
                                <ul className="space-y-3">
                                    {tickets.map(ticket => (
                                        <li key={ticket.id} className="p-4 bg-secondary rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-foreground">{ticket.category} sur {ticket.device}</p>
                                                <p className="text-sm text-muted-foreground truncate max-w-md">{ticket.description}</p>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <TicketStatusBadge status={ticket.status} />
                                                <span className="text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Info className="mx-auto h-8 w-8 mb-2" />
                                    <p>Vous n'avez encore créé aucun ticket de dépannage.</p>
                                </div>
                            )
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </>
    );
};

export default TroubleshootingPage;