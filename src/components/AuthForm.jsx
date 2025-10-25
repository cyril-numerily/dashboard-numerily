import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus, Mail, Lock, Loader2, User, Check } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const AuthForm = ({ mode, setMode }) => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(mode === 'login');

  useEffect(() => {
    setIsLogin(mode === 'login');
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && !name.trim()) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Le nom est obligatoire.",
        });
        return;
    }
    
    if (!isLogin && !agreedToTerms) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Vous devez accepter les conditions générales.",
        });
        return;
    }

    setLoading(true);
    
    let error;
    if (isLogin) {
        const result = await signIn(email, password);
        error = result.error;
    } else {
        const result = await signUp(email, password, name);
        error = result.error;
    }

    setLoading(false);

    if (!error) {
      toast({
        title: isLogin ? '✅ Connexion réussie !' : '✅ Inscription réussie !',
        description: isLogin ? 'Heureux de vous revoir.' : 'Veuillez vérifier vos e-mails pour confirmer votre compte.',
      });
      setMode(null);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setAgreedToTerms(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => setMode(null)}
      >
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className="relative w-full max-w-md bg-glass rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 sm:p-10">
            <button onClick={() => setMode(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-ring">
              <X size={20} />
            </button>
            
            <div className="text-center mb-8">
               <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-2">{isLogin ? 'Bon retour' : 'Créer un compte'}</h2>
                <p className="text-muted-foreground">
                  {isLogin ? 'Accédez à votre espace client.' : 'Rejoignez-nous en quelques secondes.'}
                </p>
              </motion.div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Nom complet"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pl-11 h-12 text-base"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-11 h-12 text-base"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                  className="pl-11 h-12 text-base"
                />
              </div>
              {!isLogin && (
                <div className="flex items-start space-x-2 pt-2">
                    <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms} />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground">
                        J'accepte les <a href="https://numerily.fr/conditions-generales" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">conditions générales</a> de Numerily.
                    </Label>
                </div>
              )}
              <Button type="submit" disabled={loading || (!isLogin && !agreedToTerms)} className="w-full h-12 text-base font-bold">
                {loading ? <Loader2 className="animate-spin" /> : (isLogin ? <><LogIn className="mr-2 h-5 w-5"/>Se connecter</> : <><UserPlus className="mr-2 h-5 w-5"/>Créer mon compte</>)}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Vous n'avez pas de compte ?" : 'Vous avez déjà un compte ?'}
                <button onClick={switchMode} className="font-semibold text-primary hover:underline ml-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-sm">
                  {isLogin ? "S'inscrire" : 'Se connecter'}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthForm;