import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Users, PlusCircle, Search } from 'lucide-react';
import UserList from './users/UserList';
import CreateUserForm from './users/CreateUserForm';

const UserManagementTab = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateUserOpen, setCreateUserOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*, partner:partner_id(id, name)').order('created_at', { ascending: false });
            if (error) throw error;
            setUsers(data || []);
            setFilteredUsers(data || []);
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les utilisateurs." });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = users.filter(item =>
            (item.name?.toLowerCase().includes(lowercasedFilter)) ||
            (item.email?.toLowerCase().includes(lowercasedFilter))
        );
        setFilteredUsers(filteredData);
    }, [searchTerm, users]);
    
    const handleDeleteUser = async (userId) => {
        setDeletingId(userId);
        try {
            const { error } = await supabase.functions.invoke('delete-user', {
                body: { user_id_to_delete: userId },
            });

            if (error) throw error;

            toast({ title: "Succès", description: "Utilisateur supprimé." });
            fetchUsers();
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: `Impossible de supprimer l'utilisateur: ${error.message}` });
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-white" />Gestion des Utilisateurs</CardTitle>
                            <CardDescription>Total : {filteredUsers.length} / {users.length}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Rechercher par nom, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Dialog open={isCreateUserOpen} onOpenChange={setCreateUserOpen}>
                                <DialogTrigger asChild>
                                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Créer</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                                        <DialogDescription>
                                            Remplissez les détails ci-dessous pour créer un nouveau compte. Le nom est obligatoire.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <CreateUserForm onUserCreated={fetchUsers} setOpen={setCreateUserOpen} />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <UserList
                        users={filteredUsers}
                        deletingId={deletingId}
                        onDelete={handleDeleteUser}
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default UserManagementTab;