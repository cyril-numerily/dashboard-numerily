import React, { useState, useEffect, useCallback } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Dot } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const NotificationDropdown = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasUnread, setHasUnread] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!profile || !profile.created_at) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*, notification_reads!left(user_id, read_at)')
                .or(`target_segment.eq.${profile.role},user_id.eq.${profile.id},target_segment.is.null`)
                .gte('created_at', profile.created_at)
                .eq('notification_reads.user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            
            const enrichedNotifications = data.map(n => ({...n, is_read: n.notification_reads && n.notification_reads.length > 0 }));
            
            const unread = enrichedNotifications.some(n => !n.is_read);
            setNotifications(enrichedNotifications || []);
            setHasUnread(unread);

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erreur de chargement",
                description: "Impossible de charger les notifications.",
            });
        } finally {
            setLoading(false);
        }
    }, [profile, toast]);
    
    useEffect(() => {
        if (!profile) return;
    
        const fetchInitialAndSubscribe = async () => {
            await fetchNotifications();
    
            const channel = supabase.channel(`notifications-${profile.id}`)
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'notifications',
                }, payload => {
                    const targetSegment = payload.new.target_segment;
                    const targetUser = payload.new.user_id;
                    if (targetSegment === 'all' || targetSegment === profile.role || targetUser === profile.id) {
                        fetchNotifications();
                        toast({
                            title: payload.new.title,
                            description: payload.new.message,
                        });
                    }
                })
                .subscribe();
    
            return () => supabase.removeChannel(channel);
        };
    
        fetchInitialAndSubscribe();
    
    }, [profile, fetchNotifications, toast]);


    const markAsRead = async (notificationId) => {
        const { error } = await supabase
            .from('notification_reads')
            .upsert({ notification_id: notificationId, user_id: profile.id, read_at: new Date().toISOString() }, { onConflict: 'notification_id,user_id' });
        
        if (!error) {
           fetchNotifications();
        }
    };
    
    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }
        if (notification.link_url) {
            navigate(notification.link_url);
        }
    };

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.is_read);
        if (unreadNotifications.length === 0) return;

        const readsToInsert = unreadNotifications.map(n => ({
            notification_id: n.id,
            user_id: profile.id,
            read_at: new Date().toISOString()
        }));

        const { error } = await supabase
            .from('notification_reads')
            .upsert(readsToInsert, { onConflict: 'notification_id,user_id' });

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setHasUnread(false);
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => { if (!open && hasUnread) markAllAsRead(); }}>
            <DropdownMenuTrigger asChild>
                <button className="relative cursor-pointer focus:outline-none">
                    <Bell className="text-muted-foreground h-6 w-6" />
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center">
                           <Dot className="h-6 w-6 text-red-500 animate-ping absolute" />
                           <Dot className="h-6 w-6 text-red-500" />
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 md:w-96">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {hasUnread && <Badge variant="destructive">Nouveau</Badge>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {loading ? (
                    <div className="p-4 flex justify-center"><Loader size="sm" /></div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        Aucune notification pour le moment.
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.map(notification => (
                            <DropdownMenuItem key={notification.id} onClick={() => handleNotificationClick(notification)} className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.is_read ? 'bg-primary/10' : ''}`}>
                                <div className="w-full flex justify-between items-start">
                                    <p className="font-semibold text-foreground pr-2">{notification.title}</p>
                                    {!notification.is_read && <Dot className="h-6 w-6 text-red-500 flex-shrink-0" />}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 w-full">{notification.message}</p>
                                <span className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleString('fr-FR')}</span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationDropdown;