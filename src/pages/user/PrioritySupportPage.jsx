import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import Loader from '@/components/Loader';
import { useDebounce } from '@/hooks/useDebounce';
import { motion } from 'framer-motion';

const PrioritySupportPage = () => {
    const { profile: userProfile } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [adminProfile, setAdminProfile] = useState(null);
    const messagesEndRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const debouncedNewMessage = useDebounce(newMessage, 500);
    const channelRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const fetchAdminProfile = useCallback(async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('role', 'admin')
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row expected, but 0 rows were found"
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de trouver le profil administrateur.' });
        } else if (data) {
            setAdminProfile(data);
        } else {
             setAdminProfile({ id: 'admin-placeholder', name: 'Support Numerily', avatar_url: '' });
        }
    }, [toast]);
    
    const fetchMessages = useCallback(async () => {
        if (!userProfile) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('admin_messages')
            .select('*, sender:sender_id(id, name, avatar_url)')
            .eq('conversation_id', userProfile.id)
            .order('created_at', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les messages.' });
        } else {
             setMessages(data || []);
        }
        setLoading(false);
    }, [userProfile, toast]);

    useEffect(() => {
        fetchAdminProfile();
    }, [fetchAdminProfile]);

    useEffect(() => {
        if (userProfile) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [userProfile, fetchMessages]);

    useEffect(() => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current).catch(()=>{});
            channelRef.current = null;
        }

        if (userProfile && adminProfile) {
            const conversationId = userProfile.id;
            const newChannel = supabase.channel(`user-support-channel-typing-${conversationId}`);
            newChannel
                .on('broadcast', { event: 'typing' }, (payload) => {
                    if (payload.senderId !== userProfile.id) {
                        setIsTyping(true);
                        setTimeout(() => setIsTyping(false), 3000);
                    }
                })
                .subscribe();

            channelRef.current = newChannel;

            return () => {
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current).catch(()=>{});
                    channelRef.current = null;
                }
            };
        }
    }, [userProfile, adminProfile]);

    useEffect(() => {
        if (debouncedNewMessage && channelRef.current && userProfile) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { senderId: userProfile.id },
            });
        }
    }, [debouncedNewMessage, userProfile]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !userProfile) return;
        const content = newMessage;
        setNewMessage('');
            
        const { data: insertedMessage, error } = await supabase.from('admin_messages').insert({
            sender_id: userProfile.id,
            conversation_id: userProfile.id,
            content: content,
        }).select('*, sender:sender_id(id, name, avatar_url)').single();

        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'envoyer le message." });
            setNewMessage(content);
        } else {
            setMessages(currentMessages => [...currentMessages, insertedMessage]);
        }
    };

    return (
        <>
            <Helmet><title>Support Prioritaire</title></Helmet>
            <Card className="max-w-4xl mx-auto h-[80vh] flex flex-col">
                <CardHeader>
                    <CardTitle>Support Prioritaire</CardTitle>
                    <CardDescription>Contactez notre équipe de support pour une aide rapide.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
                    {loading && messages.length === 0 ? <Loader /> : (
                        messages.map(msg => (
                            <div key={msg.id} className={`flex items-end gap-3 ${msg.sender_id === userProfile.id ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender_id !== userProfile.id && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={adminProfile?.avatar_url} />
                                        <AvatarFallback>{adminProfile?.name?.charAt(0).toUpperCase() || 'S'}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`rounded-2xl px-4 py-2 max-w-lg ${msg.sender_id === userProfile.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-foreground rounded-bl-none'}`}>
                                    <p>{msg.content}</p>
                                </div>
                            </div>
                        ))
                    )}
                    {isTyping && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Est en train d'écrire...</span>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                <div className="p-4 border-t border-border bg-background">
                    <div className="flex gap-2">
                        <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Écrivez votre message..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            rows={1}
                            className="resize-none"
                        />
                        <Button onClick={handleSendMessage} size="icon"><Send /></Button>
                    </div>
                </div>
            </Card>
        </>
    );
};

export default PrioritySupportPage;