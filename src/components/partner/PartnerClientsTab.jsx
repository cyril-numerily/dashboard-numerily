import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Users, PlusCircle, Loader2, Unlink2 } from 'lucide-react';
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

const AddClientForm = ({ onClientAdded }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.functions.invoke('create-user', {
                body: {
                    name: name,
                    email: email,
                    password: password,
                    phone: phone,
                    role: 'user',
                    subscription: 'none'
                }
            });

            if (error) throw new Error(error.message);
            
            toast({ title: "Succès", description: "Client ajouté avec succès." });
            setName('');
            setEmail('');
            setPassword('');
            setPhone('');
            onClientAdded();

        } catch (error) {
             const errorMessage = error.message.includes("User already exists") 
                ? "Un client avec cet email existe déjà."
                : (error.message || "Impossible de créer le client.");
            toast({ variant: "destructive", title: "Erreur", description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-secondary mt-4">
            <CardHeader><CardTitle>Ajouter un nouveau client</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="client-name">Nom complet</Label>
                        <Input id="client-name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="client-email">Email</Label>
                        <Input id="client-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="client-phone">Téléphone</Label>
                        <Input id="client-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="client-password">Mot de passe temporaire</Label>
                        <Input id="client-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Ajouter le client</>}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

const PartnerClientsTab = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [unlinkingClientId, setUnlinkingClientId] = useState(null);

    const fetchClients = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email, subscription, created_at, phone')
                .eq('partner_id', profile.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les clients." });
        } finally {
            setLoading(false);
        }
    }, [profile, toast]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handleUnlinkClient = async (client) => {
        setUnlinkingClientId(client.id);
        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ partner_id: null })
                .eq('id', client.id);

            if (updateError) throw updateError;

            await supabase.from('user_activity_logs').insert({
                user_id: profile.id,
                activity_type: 'Client délié',
                details: { client_name: client.name, client_id: client.id }
            });

            toast({ title: "Succès", description: `Le client ${client.name} a été délié.` });
            fetchClients();
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de délier le client." });
        } finally {
            setUnlinkingClientId(null);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-white" />Mes Clients</CardTitle>
                            <CardDescription>Total : {clients.length}</CardDescription>
                        </div>
                        <Button onClick={() => setShowAddForm(!showAddForm)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un client
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {showAddForm && <AddClientForm onClientAdded={() => { setShowAddForm(false); fetchClients(); }} />}
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-sm text-left">
                            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Nom</th>
                                    <th className="px-4 py-3">Email & Téléphone</th>
                                    <th className="px-4 py-3">Abonnement</th>
                                    <th className="px-4 py-3">Date d'ajout</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((client) => (
                                    <tr key={client.id} className="border-b border-border hover:bg-secondary">
                                        <td className="px-4 py-3 font-medium text-foreground">{client.name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div>{client.email}</div>
                                            <div className="text-xs">{client.phone}</div>
                                        </td>
                                        <td className="px-4 py-3 capitalize text-muted-foreground">{client.subscription}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{new Date(client.created_at).toLocaleDateString('fr-FR')}</td>
                                        <td className="px-4 py-3 text-right">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" disabled={unlinkingClientId === client.id}>
                                                        {unlinkingClientId === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Délier le client ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cette action est irréversible. Le client {client.name} ne sera plus associé à votre compte partenaire.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleUnlinkClient(client)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Confirmer
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default PartnerClientsTab;