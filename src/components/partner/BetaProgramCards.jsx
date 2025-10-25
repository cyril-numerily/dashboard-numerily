import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

export const BetaProgramCard = ({ onJoin }) => (
  <Card className="bg-gradient-to-br from-black to-[#1a1a1a] border-[#1a1a1a] h-full shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-xl text-foreground">
        <Sparkles className="w-6 h-6 text-cyan-400" />
        Rejoignez le Programme Bêta
      </CardTitle>
      <CardDescription className="text-base text-muted-foreground">
        Accédez aux nouvelles fonctionnalités en avant-première et aidez-nous à améliorer nos services.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button 
        onClick={onJoin} 
        className="w-full text-base py-3"
      >
        Rejoindre maintenant
      </Button>
    </CardContent>
  </Card>
);

export const BetaProgramStatusCard = ({ onLeave }) => (
  <Card className="bg-gradient-to-br from-black to-[#1a1a1a] border-[#1a1a1a] h-full shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-xl text-foreground">
        <CheckCircle className="w-6 h-6 text-cyan-400" />
        Vous êtes Bêta-Testeur !
      </CardTitle>
      <CardDescription className="text-base text-muted-foreground">
        Merci de nous aider à construire le futur de Numerily.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button 
        onClick={onLeave} 
        variant="destructive" 
        className="w-full text-base py-3"
      >
        Quitter le programme
      </Button>
    </CardContent>
  </Card>
);