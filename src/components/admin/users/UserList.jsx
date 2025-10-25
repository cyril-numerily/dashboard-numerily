import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Trash2, Loader2, Link as LinkIcon, User as UserIcon } from 'lucide-react';

const roleVariant = { admin: 'destructive', partner: 'secondary', user: 'outline' };

const UserList = ({ users, deletingId, onDelete }) => {
    const navigate = useNavigate();

    const handleRowClick = (userId) => {
        navigate(`/admin/users/${userId}`);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                    <tr>
                        <th className="px-4 py-3">Utilisateur</th>
                        <th className="px-4 py-3">Rôle</th>
                        <th className="px-4 py-3">Abonnement</th>
                        <th className="px-4 py-3">Partenaire Lié</th>
                        <th className="px-4 py-3">Crée le</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-secondary cursor-pointer" onClick={() => handleRowClick(user.id)}>
                            <td className="px-4 py-3 font-medium text-foreground">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar_url} alt={user.name} />
                                        <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={18} />}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{user.name || 'N/A'}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <Badge variant={roleVariant[user.role] || 'default'} className="capitalize">{user.role}</Badge>
                            </td>
                            <td className="px-4 py-3">
                                <span className="capitalize text-muted-foreground">{user.subscription}</span>
                            </td>
                            <td className="px-4 py-3">
                                {user.partner ? (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <LinkIcon className="h-3 w-3" />
                                        <span>{user.partner.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground/50">Aucun</span>
                                )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-1 justify-center">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost" disabled={deletingId === user.id}>
                                                {deletingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Cette action est irréversible et supprimera toutes les données associées à {user.name}.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDelete(user.id)}>Supprimer</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserList;