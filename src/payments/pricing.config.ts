// Grille tarifaire ArtistLinks (modèle freemium)
// Les montants sont en FCFA (XOF)

export const SUBSCRIPTION_PRICING: Record<string, { amount: number; commissionRate: number }> = {
  FREE: { amount: 0, commissionRate: 0 },
  PRO: { amount: 5000, commissionRate: 0.1 }, // 10% de commission plateforme
  PREMIUM: { amount: 15000, commissionRate: 0.07 }, // 7% au palier supérieur
};

export function getPricingForTier(tier: string) {
  const pricing = SUBSCRIPTION_PRICING[tier];
  if (!pricing) throw new Error(`Palier d'abonnement inconnu: ${tier}`);
  return pricing;
}

export function calculateCommission(amount: number, tier: string): number {
  const pricing = getPricingForTier(tier);
  return Math.round(amount * pricing.commissionRate);
}
