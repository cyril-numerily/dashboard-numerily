import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Monitor, Laptop, Server, PlusCircle, ShieldAlert, Loader2, Hash } from 'lucide-react';
import Loader from '@/components/Loader';
import { getSubscriptionDetails } from '@/config/subscriptions';

const deviceIcons = {
    desktop: <Monitor className="w-8 h-8 text-primary" />,
    laptop: <Laptop className="w-8 h-8 text-primary" />,
    server: <Server className="w-8 h-8 text-primary" />,
    other: <Monitor className="w-8 h-8 text-primary" />,
};

const AddDeviceForm = ({ onDeviceAdded }) => {
    const { toast } = useToast();
    const { profile, refreshUserProfile } = useAuth();
    const [name, setName] = useState('');
    const [type, setType] = useState('desktop');
    const [serialNumber, setSerialNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const newDevice = { id: crypto.randomUUID(), name, type, serialNumber };
        const currentDevices = profile.devices || [];
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ devices: [...currentDevices, newDevice] })
                .eq('id', profile.id);

            if (error) throw error;
            toast({ title: "Succès", description: "Appareil ajouté avec succès." });
            await refreshUserProfile();
            onDeviceAdded();
            setIsOpen(false);
            setName('');
            setType('desktop');
            setSerialNumber('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'ajouter l'appareil." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Ajouter un appareil</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter un nouvel appareil</DialogTitle>
                    <DialogDescription>Entrez les informations de votre appareil, y compris son numéro de série.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="deviceName">Nom de l'appareil</Label>
                        <Input id="deviceName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: PC de bureau" required />
                    </div>
                     <div>
                        <Label htmlFor="serialNumber">Numéro de série</Label>
                        <Input id="serialNumber" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="S/N" required />
                        <p className="text-xs text-muted-foreground mt-1">
                            Pour les portables, le numéro de série est souvent sous l'appareil. Pour les fixes, sur une étiquette latérale ou arrière.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="deviceType">Type d'appareil</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desktop">Ordinateur de bureau</SelectItem>
                                <SelectItem value="laptop">Ordinateur portable</SelectItem>
                                <SelectItem value="server">Serveur</SelectItem>
                                <SelectItem value="other">Autre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Ajouter'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const DeviceCard = ({ device }) => (
    <Card className="bg-secondary/50 border-border/50 transition-all hover:border-primary/50">
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                {deviceIcons[device.type] || deviceIcons.other}
                <div>
                    <p className="font-semibold text-lg text-foreground">{device.name}</p>
                    <p className="text-sm capitalize text-muted-foreground">{device.type}</p>
                    {device.serialNumber && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Hash className="h-3 w-3"/> {device.serialNumber}
                        </p>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
);


const DevicesPage = () => {
    const { profile, loading } = useAuth();
    const [devices, setDevices] = useState([]);
    
    useEffect(() => {
        if (profile) {
            setDevices(profile.devices || []);
        }
    }, [profile]);
    
    const handleDeviceAdded = useCallback(() => {
        if (profile) {
            setDevices(profile.devices || []);
        }
    }, [profile]);

    const subscriptionDetails = getSubscriptionDetails(profile?.subscription);
    const hasSubscription = profile?.subscription && profile.subscription !== 'none';

    if (loading) {
        return <div className="h-screen flex items-center justify-center"><Loader size="lg" /></div>;
    }

    if (!hasSubscription) {
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="text-3xl font-bold text-foreground">Accès Premium Requis</h1>
                <p className="text-lg text-muted-foreground mt-2">Cette fonctionnalité est réservée aux abonnés.</p>
                <Button onClick={() => window.open('https://numerily.fr/prime', '_blank')} className="mt-6">Voir les abonnements</Button>
            </motion.div>
        );
    }

    const canAddMoreDevices = devices.length < subscriptionDetails.maxDevices;

    return (
        <>
            <Helmet>
                <title>Mes PC - Numerily</title>
                <meta name="description" content="Gérez vos appareils enregistrés pour le dépannage rapide." />
            </Helmet>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground">Mes PC</h1>
                        <p className="text-lg text-muted-foreground">
                            Gérez vos appareils enregistrés. Vous avez {devices.length} / {subscriptionDetails.maxDevices} appareil(s) enregistré(s).
                        </p>
                    </div>
                    {canAddMoreDevices && <AddDeviceForm onDeviceAdded={handleDeviceAdded} />}
                </div>

                {!canAddMoreDevices && devices.length > 0 && (
                     <Card className="bg-primary/10 border-primary/20">
                        <CardContent className="p-4 text-center text-primary">
                            Vous avez atteint le nombre maximum d'appareils pour votre abonnement.
                        </CardContent>
                    </Card>
                )}

                {devices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {devices.map((device) => (
                             <motion.div 
                                key={device.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: parseInt(device.id.substring(0, 2), 16) * 0.01 }}
                            >
                                <DeviceCard device={device} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-20 bg-secondary/30">
                        <CardContent>
                            <Monitor className="mx-auto h-16 w-16 text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold text-foreground">Aucun appareil enregistré</h3>
                            <p className="mt-1 text-muted-foreground">Ajoutez votre premier appareil pour commencer.</p>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </>
    );
};

export default DevicesPage;