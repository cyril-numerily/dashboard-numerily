import { ShieldCheck, Zap, Gem } from 'lucide-react';

export const subscriptionConfig = {
  none: {
    name: 'Aucun',
    price: 0,
    iconUrl: null,
    features: [
      'Accès au catalogue de services',
      'Support par e-mail',
    ],
    maxDevices: 0,
    troubleshootingQuota: 0,
    discountPercentage: 0,
    access: {
      promoCodes: false,
      assistlyIA: false,
      prioritySupport: false,
    }
  },
  silver: {
    name: 'Silver',
    price: 9.99,
    iconUrl: 'https://horizons-cdn.hostinger.com/1dfec302-4fd6-4f8b-a330-41699fd1c70b/694ebcbbd9dfcf532293a588edf2ccb1.png',
    features: [
      '-20% sur les services',
      '1 dépannage gratuit / mois',
      '3 appareils enregistrés',
    ],
    maxDevices: 3,
    troubleshootingQuota: 1,
    discountPercentage: 20,
    access: {
      promoCodes: false,
      assistlyIA: false,
      prioritySupport: false,
    }
  },
  black: {
    name: 'Black',
    price: 29.99,
    iconUrl: 'https://horizons-cdn.hostinger.com/1dfec302-4fd6-4f8b-a330-41699fd1c70b/31905d36e6bd0e5fdbcd5a8dfcb164a8.png',
    features: [
        '-30% sur les services',
        '3 dépannages gratuits / mois',
        '3 appareils enregistrés',
        'Accès à Assistly IA',
        'Accès au Support Prioritaire',
        'Accès aux codes promos'
    ],
    maxDevices: 3,
    troubleshootingQuota: 3,
    discountPercentage: 30,
    access: {
      promoCodes: true,
      assistlyIA: true,
      prioritySupport: true,
    }
  },
  gold: {
    name: 'Gold',
    price: 19.99,
    iconUrl: 'https://horizons-cdn.hostinger.com/1dfec302-4fd6-4f8b-a330-41699fd1c70b/4d492da49d03c1478800ba1f64b13cbe.png',
    features: [
      '-40% sur les services',
      'Dépannages gratuits illimités',
      '5 appareils enregistrés',
      'Accès à Assistly IA',
      'Accès au Support Prioritaire',
      'Accès aux codes promos'
    ],
    maxDevices: 5,
    troubleshootingQuota: Infinity,
    discountPercentage: 40,
    access: {
      promoCodes: true,
      assistlyIA: true,
      prioritySupport: true,
    }
  },
};

export const getSubscriptionDetails = (subscriptionKey) => {
  return subscriptionConfig[subscriptionKey] || subscriptionConfig.none;
};