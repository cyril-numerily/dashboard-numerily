import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import Loader from '@/components/Loader';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
      }
      setLoading(false);
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      } else if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchProfile(session.user.id);
        setProfile(userProfile);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);
  
  const refreshUserProfile = useCallback(async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  }, [user, fetchProfile]);
  
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: error.message,
        });
    }
    return { error };
  };
  
  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.functions.invoke('public-signup', {
      body: { name, email, password },
    });
     if (error) {
        toast({
            variant: "destructive",
            title: "Erreur d'inscription",
            description: error.message,
        });
    }
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error && error.message !== 'Session from session_id claim in JWT does not exist') {
        toast({
            variant: "destructive",
            title: "Erreur de déconnexion",
            description: error.message,
        });
    }
    setUser(null);
    setProfile(null);
  };
  
  const updateProfileBetaStatus = async (isBeta) => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ beta_program: isBeta })
        .eq('id', profile.id)
        .select()
        .single();
      if (error) throw error;
      setProfile(data);
      toast({
        title: 'Statut mis à jour !',
        description: `Vous avez ${isBeta ? 'rejoint' : 'quitté'} le programme Bêta.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut du programme Bêta.',
      });
    }
  };

  const value = {
    user,
    profile,
    signIn,
    signUp,
    signOut,
    loading,
    refreshUserProfile,
    updateProfileBetaStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};