import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FeatureCard = ({ icon: Icon, title, description, onClick, notificationCount, beta }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      className="h-full"
    >
      <Card
        onClick={onClick}
        className="apple-card h-full cursor-pointer flex flex-col justify-between p-4 hover:border-white/20"
      >
        <div>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-secondary rounded-lg">
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              {beta && <Badge variant="outline" className="border-primary text-primary text-xs">BÊTA</Badge>}
            </div>
            {notificationCount > 0 && (
              <div className="relative">
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {notificationCount}
                </div>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-11">{description}</p>
        </div>
        <div className="flex justify-end items-center mt-3">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  );
};

export default FeatureCard;