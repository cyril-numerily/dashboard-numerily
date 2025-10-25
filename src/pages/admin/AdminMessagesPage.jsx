import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

const AdminMessagesPage = () => {
    const { profile: adminProfile } = useAuth();
    const { toast } = useToast();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const debouncedNewMessage = useDebounce(newMessage, 500);
    const channelRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    const fetchConversations = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_conversations');
        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les conversations.' });
        } else {
            setConversations(data);
        }
        setLoading(false);
    }, [toast]);

    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;
        setLoadingMessages(true);
        const { data, error } = await supabase
            .from('admin_messages')
            .select('*, sender:sender_id(id, name, avatar_url)')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les messages.' });
        } else {
            setMessages(data || []);
        }
        setLoadingMessages(false);
    }, [toast]);
    
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000); // Refresh conversations list
        return () => clearInterval(interval);
    }, [fetchConversations]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.conversation_id);
            const interval = setInterval(() => {
                fetchMessages(selectedConversation.conversation_id);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedConversation, fetchMessages]);

    useEffect(() => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current).catch(()=>{});
            channelRef.current = null;
        }

        if (selectedConversation && adminProfile) {
            const conversationId = selectedConversation.conversation_id;
            const newChannel = supabase.channel(`admin_messages_typing_${conversationId}`);
            
            newChannel
                .on('broadcast', { event: 'typing' }, (payload) => {
                    if (payload.senderId !== adminProfile.id) {
                        setIsTyping(true);
                        setTimeout(() => setIsTyping(false), 3000);
                    }
                })
                .subscribe();
            
            channelRef.current = newChannel;

            return () => {
                if (channelRef.current) {
                    supabase.removeChannel(channelRef.current).catch(() => {});
                    channelRef.current = null;
                }
            };
        }
    }, [selectedConversation, adminProfile]);

    useEffect(() => {
        if (debouncedNewMessage && channelRef.current && adminProfile) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { senderId: adminProfile.id },
            });
        }
    }, [debouncedNewMessage, adminProfile]);


    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSelectConversation = (conv) => {
        setMessages([]);
        setSelectedConversation(conv);
    };
    
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !adminProfile) return;
        const content = newMessage;
        setNewMessage('');
        
        const { data: insertedMessage, error } = await supabase.from('admin_messages').insert({
            sender_id: adminProfile.id,
            conversation_id: selectedConversation.conversation_id,
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
            <Helmet><title>Messagerie - Admin</title></Helmet>
            <Card className="h-[80vh] flex overflow-hidden">
                <div className={`w-full md:w-1/3 border-r border-border flex flex-col ${selectedConversation && 'hidden md:flex'}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageSquare /> Messagerie</CardTitle>
                        <CardDescription>Toutes les conversations avec les utilisateurs.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto">
                        {loading ? <Loader /> : (
                            <ul className="space-y-2">
                                {conversations.map(conv => (
                                    <li key={conv.conversation_id} 
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedConversation?.conversation_id === conv.conversation_id ? 'bg-primary/10' : 'hover:bg-secondary'}`}
                                    >
                                        <Avatar>
                                            <AvatarImage src={conv.participant_avatar_url} />
                                            <AvatarFallback>{conv.participant_name?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-semibold text-foreground">{conv.participant_name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{conv.last_message_content}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </div>
                <div className={`w-full md:w-2/3 flex flex-col ${!selectedConversation && 'hidden md:flex'}`}>
                    <AnimatePresence>
                        {selectedConversation ? (
                            <motion.div key={selectedConversation.conversation_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                                <CardHeader className="flex-row items-center gap-4 border-b border-border">
                                     <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                                        <ArrowLeft />
                                    </Button>
                                    <Avatar>
                                        <AvatarImage src={selectedConversation.participant_avatar_url} />
                                        <AvatarFallback>{selectedConversation.participant_name.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle>{selectedConversation.participant_name}</CardTitle>
                                        <CardDescription>{selectedConversation.participant_role}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
                                     {loadingMessages && messages.length === 0 ? <Loader /> : messages.map(msg => (
                                        <div key={msg.id} className={`flex items-end gap-3 ${msg.sender_id === adminProfile.id ? 'justify-end' : 'justify-start'}`}>
                                            {msg.sender_id !== adminProfile.id && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={msg.sender?.avatar_url} />
                                                    <AvatarFallback>{msg.sender?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={`rounded-2xl px-4 py-2 max-w-lg ${msg.sender_id === adminProfile.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-foreground rounded-bl-none'}`}>
                                                <p>{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
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
                                            placeholder={`Répondre à ${selectedConversation.participant_name}...`}
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
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                                <MessageSquare className="w-16 h-16 mb-4" />
                                <h3 className="text-xl font-semibold">Sélectionnez une conversation</h3>
                                <p>Choisissez une conversation dans la liste de gauche pour afficher les messages.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </>
    );
};

export default AdminMessagesPage;