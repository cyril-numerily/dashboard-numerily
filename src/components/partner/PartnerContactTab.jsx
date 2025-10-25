import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Loader from '@/components/Loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send, MessageSquare, PlusCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/useDebounce';

const PartnerContactTab = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const messagesEndRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const debouncedNewMessage = useDebounce(newMessage, 300);
    const channelRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = useCallback(async () => {
        if (!profile) return;
        setLoading(true);
        const partnerConvoId = profile.id;
        setConversations([partnerConvoId]);
        setSelectedConversationId(partnerConvoId);
        setLoading(false);
    }, [profile]);

    const fetchMessages = useCallback(async () => {
        if (!selectedConversationId) return;
        try {
            const { data, error } = await supabase
                .from('admin_messages')
                .select('*, sender:sender_id(id, name, avatar_url, role)')
                .eq('conversation_id', selectedConversationId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: error.message });
        }
    }, [selectedConversationId, toast]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);
    
    useEffect(() => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current).catch(() => {});
            channelRef.current = null;
        }

        if(!selectedConversationId || !profile) {
            return;
        }

        fetchMessages();
        
        const newChannel = supabase.channel(`admin_messages:conversation_id=eq.${selectedConversationId}`, {
            config: {
                broadcast: {
                    self: true,
                },
            },
        });

        newChannel
            .on('postgres_changes', {
                event: 'INSERT', 
                schema: 'public', 
                table: 'admin_messages',
                filter: `conversation_id=eq.${selectedConversationId}`
            }, async (payload) => {
                    if (payload.new.sender_id === profile.id) return;
                
                    const { data: senderData, error } = await supabase
                    .from('profiles')
                    .select('id, name, avatar_url, role')
                    .eq('id', payload.new.sender_id)
                    .single();
                
                if (!error && senderData) {
                    setMessages(currentMessages => {
                        if (!currentMessages.some(m => m.id === payload.new.id)) {
                            return [...currentMessages, { ...payload.new, sender: senderData }];
                        }
                        return currentMessages;
                    });
                }
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.senderId !== profile.id) {
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
    }, [selectedConversationId, fetchMessages, profile]);

    useEffect(() => {
        if (channelRef.current && debouncedNewMessage && profile) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing',
                payload: { senderId: profile.id },
            });
        }
    }, [debouncedNewMessage, profile]);


    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !profile || !selectedConversationId) return;
        const messageContent = newMessage;
        setNewMessage('');
        
        const optimisticMessage = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            content: messageContent,
            sender_id: profile.id,
            conversation_id: selectedConversationId,
            is_read: false,
            sender: {
                id: profile.id,
                name: profile.name,
                avatar_url: profile.avatar_url,
                role: profile.role
            }
        };
        
        setMessages(current => [...current, optimisticMessage]);

        const { error } = await supabase.from('admin_messages').insert({
            sender_id: profile.id,
            conversation_id: selectedConversationId,
            content: messageContent,
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Erreur', description: "Impossible d'envoyer le message." });
            setNewMessage(messageContent);
            setMessages(current => current.filter(m => m.id !== optimisticMessage.id));
        }
    };
    
    const startNewConversation = () => {
        const newConvoId = profile.id;
        setSelectedConversationId(newConvoId);
        setMessages([]);
    }

    if (loading) return <div className="flex justify-center items-center h-64"><Loader /></div>;
    
    const adminProfile = messages.find(m => m.sender?.role === 'admin')?.sender;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <Card className="h-[80vh] flex overflow-hidden">
                 <div className={`w-full md:w-1/3 border-r border-border flex flex-col ${selectedConversationId && 'hidden md:flex'}`}>
                     <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2"><MessageSquare /> Conversations</CardTitle>
                            <Button size="icon" variant="ghost" onClick={startNewConversation}><PlusCircle className="h-5 w-5"/></Button>
                        </div>
                     </CardHeader>
                     <CardContent className="flex-grow overflow-y-auto">
                        <ul className="space-y-2">
                           <li onClick={startNewConversation} className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedConversationId === profile.id ? 'bg-primary/10' : 'hover:bg-secondary'}`}>
                               <Avatar>
                                   <AvatarFallback>A</AvatarFallback>
                               </Avatar>
                               <div className="flex-grow">
                                   <p className="font-semibold text-foreground">Support Admin</p>
                                   <p className="text-sm text-muted-foreground truncate">Contacter le support</p>
                               </div>
                           </li>
                        </ul>
                     </CardContent>
                </div>
                 <div className={`w-full md:w-2/3 flex flex-col ${!selectedConversationId && 'hidden md:flex'}`}>
                    <AnimatePresence>
                    {selectedConversationId ? (
                         <motion.div key={selectedConversationId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                             <CardHeader className="flex-row items-center gap-4 border-b border-border">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversationId(null)}><ArrowLeft /></Button>
                                <Avatar>
                                    <AvatarImage src={adminProfile?.avatar_url} />
                                    <AvatarFallback>A</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle>{adminProfile?.name || 'Support Admin'}</CardTitle>
                                    <CardDescription>En ligne</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex items-end gap-3 ${msg.sender.id === profile.id ? 'justify-end' : 'justify-start'}`}>
                                        {msg.sender.id !== profile.id && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={msg.sender?.avatar_url} />
                                                <AvatarFallback>A</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={`rounded-2xl px-4 py-2 max-w-lg ${msg.sender.id === profile.id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-foreground rounded-bl-none'}`}>
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
                            <div className="p-4 border-t border-border">
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
                                />
                                <Button onClick={handleSendMessage} size="icon"><Send /></Button>
                                </div>
                            </div>
                         </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                            <MessageSquare className="w-16 h-16 mb-4" />
                            <h3 className="text-xl font-semibold">Messagerie Partenaire</h3>
                            <p>Sélectionnez une conversation ou démarrez-en une nouvelle avec le support.</p>
                        </div>
                    )}
                    </AnimatePresence>
                </div>
            </Card>
        </motion.div>
    );
};

export default PartnerContactTab;