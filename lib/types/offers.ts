export interface PopupOffer {
  id: string;
  title: string;
  discount_text: string;
  description: string | null;
  expiry_date: string;
  cta_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PopupSettings {
  id: number;
  is_enabled: boolean;
  delay_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface OfferApiResponse {
  settings: {
    is_enabled: boolean;
    delay_seconds: number;
  };
  offers: PopupOffer[];
}
