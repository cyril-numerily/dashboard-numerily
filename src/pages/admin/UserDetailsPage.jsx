import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, User, Monitor, Activity, Link as LinkIcon } from 'lucide-react';
import ManageDevicesDialog from '@/components/admin/users/ManageDevicesDialog';

const UserDetailsPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [user, setUser] = useState(null);
    const [partners, setPartners] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [managingDevices, setManagingDevices] = useState(false);

    const fetchUserData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('*, partner:partner_id(id, name)')
                .eq('id', userId)
                .single();
            if (userError) throw userError;
            setUser(userData);

            const { data: partnersData, error: partnersError } = await supabase
                .from('profiles')
                .select('id, name')
                .eq('role', 'partner');
            if (partnersError) throw partnersError;
            setPartners(partnersData);

            const { data: activityData, error: activityError } = await supabase
                .from('user_activity_logs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);
            if (activityError) throw activityError;
            setActivityLogs(activityData);

        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données de l'utilisateur." });
            navigate('/admin/users');
        } finally {
            setLoading(false);
        }
    }, [userId, navigate, toast]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const { name, email, phone, role, subscription, partner_id } = user;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ name, email, phone, role, subscription, partner_id: partner_id === 'none' ? null : partner_id })
                .eq('id', userId);
            if (error) throw error;
            toast({ title: "Succès", description: "Informations mises à jour." });
            fetchUserData();
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour l'utilisateur." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDevicesUpdated = (userId, updatedDevices) => {
        setUser(currentUser => ({ ...currentUser, devices: updatedDevices }));
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader size="lg" /></div>;
    }

    if (!user) {
        return (
            <div className="text-center">
                <p>Utilisateur non trouvé.</p>
                <Button onClick={() => navigate('/admin/users')} className="mt-4">Retour à la liste</Button>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Détails de {user.name || 'l\'utilisateur'} - Admin</title>
            </Helmet>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate('/admin/users')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à la liste
                    </Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations Générales</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom complet</Label>
                                    <Input id="name" name="name" value={user.name || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" value={user.email || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <Input id="phone" name="phone" type="tel" value={user.phone || ''} onChange={handleInputChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date de création</Label>
                                    <Input value={new Date(user.created_at).toLocaleString('fr-FR')} disabled />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Rôle & Abonnement</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Rôle</Label>
                                    <Select value={user.role} onValueChange={(value) => handleSelectChange('role', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="partner">Partner</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subscription">Abonnement</Label>
                                    <Select value={user.subscription} onValueChange={(value) => handleSelectChange('subscription', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="silver">Silver</SelectItem>
                                            <SelectItem value="gold">Gold</SelectItem>
                                            <SelectItem value="black">Black</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="partner_id">Partenaire Lié</Label>
                                    <Select value={user.partner_id || 'none'} onValueChange={(value) => handleSelectChange('partner_id', value)}>
                                        <SelectTrigger><SelectValue placeholder="Lier à un partenaire..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Aucun</SelectItem>
                                            {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader className="items-center text-center">
                                <Avatar className="h-24 w-24 mb-4">
                                    <AvatarImage src={user.avatar_url} alt={user.name} />
                                    <AvatarFallback className="text-4xl">{user.name ? user.name.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                                </Avatar>
                                <CardTitle>{user.name}</CardTitle>
                                <CardDescription>{user.email}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                {user.role === 'user' && (
                                    <Button variant="outline" onClick={() => setManagingDevices(true)}>
                                        <Monitor className="mr-2 h-4 w-4" />
                                        Gérer les appareils
                                    </Button>
                                )}
                                {user.partner && (
                                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground p-2 bg-secondary rounded-md">
                                        <LinkIcon className="h-4 w-4" />
                                        <span>Partenaire: {user.partner.name}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Activity /> Activité Récente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activityLogs.length > 0 ? (
                                    <ul className="space-y-3">
                                        {activityLogs.map(log => (
                                            <li key={log.id} className="text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground">{log.activity_type}</p>
                                                <p>{new Date(log.created_at).toLocaleString('fr-FR')}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Aucune activité récente.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </motion.div>
            {managingDevices && (
                <ManageDevicesDialog
                    user={user}
                    onDevicesUpdated={handleDevicesUpdated}
                    open={managingDevices}
                    setOpen={setManagingDevices}
                />
            )}
        </>
    );
};

export default UserDetailsPage;