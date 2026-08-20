"use client";

import { useEffect, useState } from "react";

const META_PIXEL_ID = "1050963361185572";
const META_CONSENT_KEY = "sopa-meta-consent";

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  loaded?: boolean;
  push?: MetaPixelFunction;
  queue?: unknown[][];
  version?: string;
};

declare global {
  interface Window {
    _fbq?: MetaPixelFunction;
    fbq?: MetaPixelFunction;
  }
}

const MAX_CART_ITEMS = 4;
const MAX_KITCHEN_RESULTS = 1;

const CHECKOUT_URLS: Record<string, string> = {
  "1-0": "https://paylume.fans/c/sopa-boa-1-tradicional",
  "0-1": "https://paylume.fans/c/sopa-boa-1-especial",
  "2-0": "https://paylume.fans/c/sopa-boa-2-tradicionais",
  "1-1": "https://paylume.fans/c/sopa-boa-1-tradicional-1-especial",
  "0-2": "https://paylume.fans/c/sopa-boa-2-especiais",
  "3-0": "https://paylume.fans/c/sopa-boa-3-tradicionais",
  "2-1": "https://paylume.fans/c/sopa-boa-2-tradicionais-1-especial",
  "1-2": "https://paylume.fans/c/sopa-boa-1-tradicional-2-especiais",
  "0-3": "https://paylume.fans/c/sopa-boa-3-especiais",
  "4-0": "https://paylume.fans/c/sopa-boa-4-tradicionais",
  "3-1": "https://paylume.fans/c/sopa-boa-3-tradicionais-1-especial",
  "2-2": "https://paylume.fans/c/sopa-boa-2-tradicionais-2-especiais",
  "1-3": "https://paylume.fans/c/sopa-boa-1-tradicional-3-especiais",
  "0-4": "https://paylume.fans/c/sopa-boa-4-especiais",
};

type DeliveryDetails = {
  name: string;
  whatsapp: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  reference: string;
  notes: string;
};

const emptyDeliveryDetails: DeliveryDetails = {
  name: "",
  whatsapp: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  reference: "",
  notes: "",
};

const partnerKitchens = [
  { id: "bento-ribeiro", name: "Cozinha parceira", neighborhood: "Bento Ribeiro", city: "Rio de Janeiro", latitude: -22.867, longitude: -43.361, radiusKm: 7, eta: "25–35 min" },
  { id: "vila-da-penha", name: "Cozinha parceira", neighborhood: "Vila da Penha", city: "Rio de Janeiro", latitude: -22.847, longitude: -43.313, radiusKm: 7, eta: "25–35 min" },
  { id: "cordovil", name: "Cozinha parceira", neighborhood: "Cordovil", city: "Rio de Janeiro", latitude: -22.826, longitude: -43.307, radiusKm: 7, eta: "25–35 min" },
  { id: "penha", name: "Cozinha parceira", neighborhood: "Penha", city: "Rio de Janeiro", latitude: -22.835, longitude: -43.272, radiusKm: 7, eta: "25–35 min" },
  { id: "manguinhos", name: "Cozinha parceira", neighborhood: "Manguinhos", city: "Rio de Janeiro", latitude: -22.873, longitude: -43.254, radiusKm: 7, eta: "25–35 min" },
  { id: "ramos", name: "Cozinha parceira", neighborhood: "Ramos", city: "Rio de Janeiro", latitude: -22.853, longitude: -43.253, radiusKm: 7, eta: "25–35 min" },
  { id: "bonsucesso", name: "Cozinha parceira", neighborhood: "Bonsucesso", city: "Rio de Janeiro", latitude: -22.867, longitude: -43.251, radiusKm: 7, eta: "25–35 min" },
  { id: "portuguesa", name: "Cozinha parceira", neighborhood: "Portuguesa", city: "Rio de Janeiro", latitude: -22.8, longitude: -43.207, radiusKm: 7, eta: "25–35 min" },
  { id: "centro", name: "Cozinha parceira", neighborhood: "Centro", city: "Rio de Janeiro", latitude: -22.905, longitude: -43.177, radiusKm: 7, eta: "25–35 min" },
  { id: "saude", name: "Cozinha parceira", neighborhood: "Saúde", city: "Rio de Janeiro", latitude: -22.897, longitude: -43.182, radiusKm: 7, eta: "25–35 min" },
  { id: "estacio", name: "Cozinha parceira", neighborhood: "Estácio", city: "Rio de Janeiro", latitude: -22.919, longitude: -43.204, radiusKm: 7, eta: "25–35 min" },
  { id: "santa-teresa", name: "Cozinha parceira", neighborhood: "Santa Teresa", city: "Rio de Janeiro", latitude: -22.923, longitude: -43.188, radiusKm: 7, eta: "25–35 min" },
  { id: "flamengo", name: "Cozinha parceira", neighborhood: "Flamengo", city: "Rio de Janeiro", latitude: -22.935, longitude: -43.175, radiusKm: 7, eta: "25–35 min" },
  { id: "botafogo", name: "Cozinha parceira", neighborhood: "Botafogo", city: "Rio de Janeiro", latitude: -22.951, longitude: -43.184, radiusKm: 7, eta: "25–35 min" },
  { id: "copacabana", name: "Cozinha parceira", neighborhood: "Copacabana", city: "Rio de Janeiro", latitude: -22.969, longitude: -43.186, radiusKm: 7, eta: "25–35 min" },
  { id: "ipanema", name: "Cozinha parceira", neighborhood: "Ipanema", city: "Rio de Janeiro", latitude: -22.983, longitude: -43.205, radiusKm: 7, eta: "25–35 min" },
  { id: "leblon", name: "Cozinha parceira", neighborhood: "Leblon", city: "Rio de Janeiro", latitude: -22.985, longitude: -43.224, radiusKm: 7, eta: "25–35 min" },
  { id: "gavea", name: "Cozinha parceira", neighborhood: "Gávea", city: "Rio de Janeiro", latitude: -22.977, longitude: -43.231, radiusKm: 7, eta: "25–35 min" },
  { id: "vidigal", name: "Cozinha parceira", neighborhood: "Vidigal", city: "Rio de Janeiro", latitude: -22.996, longitude: -43.24, radiusKm: 7, eta: "25–35 min" },
  { id: "gavea-2", name: "Cozinha parceira", neighborhood: "Gávea", city: "Rio de Janeiro", latitude: -22.983, longitude: -43.242, radiusKm: 7, eta: "25–35 min" },
  { id: "tijuca", name: "Cozinha parceira", neighborhood: "Tijuca", city: "Rio de Janeiro", latitude: -22.94, longitude: -43.248, radiusKm: 7, eta: "25–35 min" },
  { id: "tijuca-2", name: "Cozinha parceira", neighborhood: "Tijuca", city: "Rio de Janeiro", latitude: -22.918, longitude: -43.214, radiusKm: 7, eta: "25–35 min" },
  { id: "maracana", name: "Cozinha parceira", neighborhood: "Maracanã", city: "Rio de Janeiro", latitude: -22.912, longitude: -43.231, radiusKm: 7, eta: "25–35 min" },
  { id: "benfica", name: "Cozinha parceira", neighborhood: "Benfica", city: "Rio de Janeiro", latitude: -22.893, longitude: -43.235, radiusKm: 7, eta: "25–35 min" },
  { id: "jacare", name: "Cozinha parceira", neighborhood: "Jacaré", city: "Rio de Janeiro", latitude: -22.894, longitude: -43.252, radiusKm: 7, eta: "25–35 min" },
  { id: "vila-isabel", name: "Cozinha parceira", neighborhood: "Vila Isabel", city: "Rio de Janeiro", latitude: -22.917, longitude: -43.251, radiusKm: 7, eta: "25–35 min" },
  { id: "grajau", name: "Cozinha parceira", neighborhood: "Grajaú", city: "Rio de Janeiro", latitude: -22.924, longitude: -43.261, radiusKm: 7, eta: "25–35 min" },
  { id: "andarai", name: "Cozinha parceira", neighborhood: "Andaraí", city: "Rio de Janeiro", latitude: -22.927, longitude: -43.251, radiusKm: 7, eta: "25–35 min" },
  { id: "meier", name: "Cozinha parceira", neighborhood: "Méier", city: "Rio de Janeiro", latitude: -22.905, longitude: -43.28, radiusKm: 7, eta: "25–35 min" },
  { id: "cachambi", name: "Cozinha parceira", neighborhood: "Cachambi", city: "Rio de Janeiro", latitude: -22.889, longitude: -43.275, radiusKm: 7, eta: "25–35 min" },
  { id: "piedade", name: "Cozinha parceira", neighborhood: "Piedade", city: "Rio de Janeiro", latitude: -22.89, longitude: -43.31, radiusKm: 7, eta: "25–35 min" },
  { id: "quintino-bocaiuva", name: "Cozinha parceira", neighborhood: "Quintino Bocaiúva", city: "Rio de Janeiro", latitude: -22.89, longitude: -43.322, radiusKm: 7, eta: "25–35 min" },
  { id: "madureira", name: "Cozinha parceira", neighborhood: "Madureira", city: "Rio de Janeiro", latitude: -22.872, longitude: -43.337, radiusKm: 7, eta: "25–35 min" },
  { id: "bento-ribeiro-2", name: "Cozinha parceira", neighborhood: "Bento Ribeiro", city: "Rio de Janeiro", latitude: -22.866, longitude: -43.36, radiusKm: 7, eta: "25–35 min" },
  { id: "marechal-hermes", name: "Cozinha parceira", neighborhood: "Marechal Hermes", city: "Rio de Janeiro", latitude: -22.857, longitude: -43.366, radiusKm: 7, eta: "25–35 min" },
  { id: "rocha-miranda", name: "Cozinha parceira", neighborhood: "Rocha Miranda", city: "Rio de Janeiro", latitude: -22.85, longitude: -43.347, radiusKm: 7, eta: "25–35 min" },
  { id: "coelho-neto", name: "Cozinha parceira", neighborhood: "Coelho Neto", city: "Rio de Janeiro", latitude: -22.831, longitude: -43.347, radiusKm: 7, eta: "25–35 min" },
  { id: "iraja", name: "Cozinha parceira", neighborhood: "Irajá", city: "Rio de Janeiro", latitude: -22.835, longitude: -43.324, radiusKm: 7, eta: "25–35 min" },
  { id: "jardim-america", name: "Cozinha parceira", neighborhood: "Jardim América", city: "Rio de Janeiro", latitude: -22.808, longitude: -43.323, radiusKm: 7, eta: "25–35 min" },
  { id: "vigario-geral", name: "Cozinha parceira", neighborhood: "Vigário Geral", city: "Rio de Janeiro", latitude: -22.811, longitude: -43.314, radiusKm: 7, eta: "25–35 min" },
  { id: "pavuna", name: "Cozinha parceira", neighborhood: "Pavuna", city: "Rio de Janeiro", latitude: -22.817, longitude: -43.37, radiusKm: 7, eta: "25–35 min" },
  { id: "pavuna-2", name: "Cozinha parceira", neighborhood: "Pavuna", city: "Rio de Janeiro", latitude: -22.812, longitude: -43.359, radiusKm: 7, eta: "25–35 min" },
  { id: "vila-zulmira", name: "Cozinha parceira", neighborhood: "Vila Zulmira", city: "São João de Meriti", latitude: -22.785, longitude: -43.367, radiusKm: 7, eta: "25–35 min" },
  { id: "coelho-da-rocha", name: "Cozinha parceira", neighborhood: "Coelho da Rocha", city: "São João de Meriti", latitude: -22.776, longitude: -43.382, radiusKm: 7, eta: "25–35 min" },
  { id: "parque-cruz-alta", name: "Cozinha parceira", neighborhood: "Parque Cruz Alta", city: "São João de Meriti", latitude: -22.773, longitude: -43.359, radiusKm: 7, eta: "25–35 min" },
  { id: "anchieta", name: "Cozinha parceira", neighborhood: "Anchieta", city: "Rio de Janeiro", latitude: -22.823, longitude: -43.399, radiusKm: 7, eta: "25–35 min" },
  { id: "anchieta-2", name: "Cozinha parceira", neighborhood: "Anchieta", city: "Rio de Janeiro", latitude: -22.836, longitude: -43.409, radiusKm: 7, eta: "25–35 min" },
  { id: "centro-2", name: "Cozinha parceira", neighborhood: "Centro", city: "Nilópolis", latitude: -22.807, longitude: -43.424, radiusKm: 7, eta: "25–35 min" },
  { id: "cabuis", name: "Cozinha parceira", neighborhood: "Cabuís", city: "Nilópolis", latitude: -22.808, longitude: -43.404, radiusKm: 7, eta: "25–35 min" },
  { id: "centro-3", name: "Cozinha parceira", neighborhood: "Centro", city: "Mesquita", latitude: -22.784, longitude: -43.428, radiusKm: 7, eta: "25–35 min" },
  { id: "sao-francisco-de-assis", name: "Cozinha parceira", neighborhood: "São Francisco de Assis", city: "Belford Roxo", latitude: -22.73, longitude: -43.41, radiusKm: 7, eta: "25–35 min" },
  { id: "parque-sao-bernardo", name: "Cozinha parceira", neighborhood: "Parque São Bernardo", city: "Belford Roxo", latitude: -22.727, longitude: -43.383, radiusKm: 7, eta: "25–35 min" },
  { id: "wona", name: "Cozinha parceira", neighborhood: "Wona", city: "Belford Roxo", latitude: -22.723, longitude: -43.348, radiusKm: 7, eta: "25–35 min" },
  { id: "cabucu", name: "Cozinha parceira", neighborhood: "Cabuçu", city: "Nova Iguaçu", latitude: -22.773, longitude: -43.539, radiusKm: 7, eta: "25–35 min" },
  { id: "jardim-palmares", name: "Cozinha parceira", neighborhood: "Jardim Palmares", city: "Nova Iguaçu", latitude: -22.759, longitude: -43.451, radiusKm: 7, eta: "25–35 min" },
  { id: "ouro-preto", name: "Cozinha parceira", neighborhood: "Ouro Preto", city: "Nova Iguaçu", latitude: -22.753, longitude: -43.493, radiusKm: 7, eta: "25–35 min" },
  { id: "centro-4", name: "Cozinha parceira", neighborhood: "Centro", city: "Nova Iguaçu", latitude: -22.759, longitude: -43.447, radiusKm: 7, eta: "25–35 min" },
  { id: "jardim-tropical", name: "Cozinha parceira", neighborhood: "Jardim Tropical", city: "Nova Iguaçu", latitude: -22.753, longitude: -43.429, radiusKm: 7, eta: "25–35 min" },
  { id: "vila-anita", name: "Cozinha parceira", neighborhood: "Vila Anita", city: "Nova Iguaçu", latitude: -22.759, longitude: -43.451, radiusKm: 7, eta: "25–35 min" },
  { id: "austin", name: "Cozinha parceira", neighborhood: "Austin", city: "Rio de Janeiro", latitude: -22.72, longitude: -43.523, radiusKm: 7, eta: "25–35 min" },
  { id: "jardim-sao-vicente", name: "Cozinha parceira", neighborhood: "Jardim São Vicente", city: "Nova Iguaçu", latitude: -22.716, longitude: -43.438, radiusKm: 7, eta: "25–35 min" },
  { id: "vila-iguacuana", name: "Cozinha parceira", neighborhood: "Vila Iguacuana", city: "Nova Iguaçu", latitude: -22.685, longitude: -43.461, radiusKm: 7, eta: "25–35 min" },
  { id: "cidade-jardim-parque-estoril", name: "Cozinha parceira", neighborhood: "Cidade Jardim Parque Estoril", city: "Nova Iguaçu", latitude: -22.759, longitude: -43.451, radiusKm: 7, eta: "25–35 min" },
  { id: "sion", name: "Cozinha parceira", neighborhood: "Sion", city: "Queimados", latitude: -22.72, longitude: -43.576, radiusKm: 7, eta: "25–35 min" },
  { id: "primavera", name: "Cozinha parceira", neighborhood: "Primavera", city: "Queimados", latitude: -22.711, longitude: -43.562, radiusKm: 7, eta: "25–35 min" },
  { id: "realengo", name: "Cozinha parceira", neighborhood: "Realengo", city: "Rio de Janeiro", latitude: -22.888, longitude: -43.432, radiusKm: 7, eta: "25–35 min" },
  { id: "realengo-2", name: "Cozinha parceira", neighborhood: "Realengo", city: "Rio de Janeiro", latitude: -22.864, longitude: -43.434, radiusKm: 7, eta: "25–35 min" },
  { id: "bangu", name: "Cozinha parceira", neighborhood: "Bangu", city: "Rio de Janeiro", latitude: -22.887, longitude: -43.469, radiusKm: 7, eta: "25–35 min" },
  { id: "bangu-2", name: "Cozinha parceira", neighborhood: "Bangu", city: "Rio de Janeiro", latitude: -22.862, longitude: -43.472, radiusKm: 7, eta: "25–35 min" },
  { id: "bangu-3", name: "Cozinha parceira", neighborhood: "Bangu", city: "Rio de Janeiro", latitude: -22.85, longitude: -43.468, radiusKm: 7, eta: "25–35 min" },
  { id: "anil", name: "Cozinha parceira", neighborhood: "Anil", city: "Rio de Janeiro", latitude: -22.956, longitude: -43.338, radiusKm: 7, eta: "25–35 min" },
  { id: "pechincha", name: "Cozinha parceira", neighborhood: "Pechincha", city: "Rio de Janeiro", latitude: -22.926, longitude: -43.346, radiusKm: 7, eta: "25–35 min" },
  { id: "tanque", name: "Cozinha parceira", neighborhood: "Tanque", city: "Rio de Janeiro", latitude: -22.915, longitude: -43.347, radiusKm: 7, eta: "25–35 min" },
  { id: "taquara", name: "Cozinha parceira", neighborhood: "Taquara", city: "Rio de Janeiro", latitude: -22.915, longitude: -43.381, radiusKm: 7, eta: "25–35 min" },
  { id: "taquara-2", name: "Cozinha parceira", neighborhood: "Taquara", city: "Rio de Janeiro", latitude: -22.916, longitude: -43.386, radiusKm: 7, eta: "25–35 min" },
  { id: "tanque-2", name: "Cozinha parceira", neighborhood: "Tanque", city: "Rio de Janeiro", latitude: -22.917, longitude: -43.358, radiusKm: 7, eta: "25–35 min" },
  { id: "vila-valqueire", name: "Cozinha parceira", neighborhood: "Vila Valqueire", city: "Rio de Janeiro", latitude: -22.889, longitude: -43.359, radiusKm: 7, eta: "25–35 min" },
  { id: "osvaldo-cruz", name: "Cozinha parceira", neighborhood: "Osvaldo Cruz", city: "Rio de Janeiro", latitude: -22.873, longitude: -43.352, radiusKm: 7, eta: "25–35 min" },
  { id: "bento-ribeiro-3", name: "Cozinha parceira", neighborhood: "Bento Ribeiro", city: "Rio de Janeiro", latitude: -22.866, longitude: -43.359, radiusKm: 7, eta: "25–35 min" },
  { id: "marechal-hermes-2", name: "Cozinha parceira", neighborhood: "Marechal Hermes", city: "Rio de Janeiro", latitude: -22.868, longitude: -43.375, radiusKm: 7, eta: "25–35 min" },
  { id: "rocha-miranda-2", name: "Cozinha parceira", neighborhood: "Rocha Miranda", city: "Rio de Janeiro", latitude: -22.85, longitude: -43.347, radiusKm: 7, eta: "25–35 min" },
  { id: "coelho-neto-2", name: "Cozinha parceira", neighborhood: "Coelho Neto", city: "Rio de Janeiro", latitude: -22.832, longitude: -43.35, radiusKm: 7, eta: "25–35 min" },
  { id: "curicica", name: "Cozinha parceira", neighborhood: "Curicica", city: "Rio de Janeiro", latitude: -22.952, longitude: -43.385, radiusKm: 7, eta: "25–35 min" },
  { id: "barra-olimpica", name: "Cozinha parceira", neighborhood: "Barra Olímpica", city: "Rio de Janeiro", latitude: -22.973, longitude: -43.397, radiusKm: 7, eta: "25–35 min" },
  { id: "vargem-pequena", name: "Cozinha parceira", neighborhood: "Vargem Pequena", city: "Rio de Janeiro", latitude: -22.99, longitude: -43.46, radiusKm: 7, eta: "25–35 min" },
  { id: "vargem-grande", name: "Cozinha parceira", neighborhood: "Vargem Grande", city: "Rio de Janeiro", latitude: -22.98, longitude: -43.494, radiusKm: 7, eta: "25–35 min" },
  { id: "recreio-dos-bandeirantes", name: "Cozinha parceira", neighborhood: "Recreio dos Bandeirantes", city: "Rio de Janeiro", latitude: -23.016, longitude: -43.466, radiusKm: 7, eta: "25–35 min" },
  { id: "dr-laureano", name: "Cozinha parceira", neighborhood: "Dr. Laureano", city: "Duque de Caxias", latitude: -22.766, longitude: -43.3, radiusKm: 7, eta: "25–35 min" },
  { id: "parque-sao-bento", name: "Cozinha parceira", neighborhood: "Parque São Bento", city: "Duque de Caxias", latitude: -22.743, longitude: -43.309, radiusKm: 7, eta: "25–35 min" },
  { id: "vila-actura", name: "Cozinha parceira", neighborhood: "Vila Actura", city: "Duque de Caxias", latitude: -22.704, longitude: -43.255, radiusKm: 7, eta: "25–35 min" },
  { id: "vila-urussai", name: "Cozinha parceira", neighborhood: "Vila Urussai", city: "Duque de Caxias", latitude: -22.674, longitude: -43.259, radiusKm: 7, eta: "25–35 min" },
  { id: "taquara-3", name: "Cozinha parceira", neighborhood: "Taquara", city: "Duque de Caxias", latitude: -22.625, longitude: -43.23, radiusKm: 7, eta: "25–35 min" },
  { id: "vila-do-sase", name: "Cozinha parceira", neighborhood: "Vila do Sase", city: "Duque de Caxias", latitude: -22.603, longitude: -43.302, radiusKm: 7, eta: "25–35 min" },
  { id: "campo-grande", name: "Cozinha parceira", neighborhood: "Campo Grande", city: "Rio de Janeiro", latitude: -22.928, longitude: -43.562, radiusKm: 7, eta: "25–35 min" },
  { id: "campo-grande-2", name: "Cozinha parceira", neighborhood: "Campo Grande", city: "Rio de Janeiro", latitude: -22.898, longitude: -43.57, radiusKm: 7, eta: "25–35 min" },
  { id: "campo-grande-3", name: "Cozinha parceira", neighborhood: "Campo Grande", city: "Rio de Janeiro", latitude: -22.883, longitude: -43.583, radiusKm: 7, eta: "25–35 min" },
  { id: "campo-grande-4", name: "Cozinha parceira", neighborhood: "Campo Grande", city: "Rio de Janeiro", latitude: -22.837, longitude: -43.556, radiusKm: 7, eta: "25–35 min" },
  { id: "campo-grande-5", name: "Cozinha parceira", neighborhood: "Campo Grande", city: "Rio de Janeiro", latitude: -22.914, longitude: -43.524, radiusKm: 7, eta: "25–35 min" },
];

type NearbyKitchen = (typeof partnerKitchens)[number] & { distanceKm: number };
type LocationStatus = "idle" | "locating" | "found" | "outside" | "denied" | "unavailable";

function getDistanceKm(latitude: number, longitude: number, kitchenLatitude: number, kitchenLongitude: number) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDifference = toRadians(kitchenLatitude - latitude);
  const longitudeDifference = toRadians(kitchenLongitude - longitude);
  const startLatitude = toRadians(latitude);
  const endLatitude = toRadians(kitchenLatitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDifference / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

const soups = [
  {
    id: "caldo-verde-calabresa",
    name: "Caldo Verde com Calabresa",
    description: "Batata cremosa, couve fresquinha e calabresa dourada. O clássico que combina com qualquer noite.",
    price: "R$ 19,90",
    size: "500 ml",
    category: "Mais pedido",
    image: "/sopas/caldo-verde-com-calabresa.jpg",
    imageAlt: "Caldo verde cremoso com couve e rodelas de calabresa",
    featured: true,
    checkoutTier: "traditional",
  },
  {
    id: "feijao-bacon-calabresa",
    name: "Caldo de Feijão com Bacon e Calabresa",
    description: "Feijão bem temperado, bacon crocante e calabresa em um caldo cremoso e cheio de sabor.",
    price: "R$ 19,90",
    size: "500 ml",
    category: "Mais pedido",
    image: "/sopas/caldo-de-feijao-com-bacon-e-calabresa.jpg",
    imageAlt: "Caldo de feijão cremoso com bacon e rodelas de calabresa",
    featured: true,
    checkoutTier: "traditional",
  },
  {
    id: "ervilha-bacon-calabresa",
    name: "Creme de Ervilha com Bacon e Calabresa",
    description: "Ervilha cremosa com bacon e calabresa dourada. Encorpado, quentinho e muito bem servido.",
    price: "R$ 19,90",
    size: "500 ml",
    category: "Tradicional",
    image: "/sopas/creme-de-ervilha-com-bacon-e-calabresa.jpg",
    imageAlt: "Creme de ervilha com pedaços de bacon e calabresa",
    featured: false,
    checkoutTier: "traditional",
  },
  {
    id: "frango-legumes",
    name: "Sopa de Frango com Legumes",
    description: "Frango desfiado, legumes selecionados e tempero caseiro em uma sopa leve e reconfortante.",
    price: "R$ 19,90",
    size: "500 ml",
    category: "Leve",
    image: "/sopas/sopa-de-frango-com-legumes.jpg",
    imageAlt: "Sopa de frango desfiado com cenoura, batata e tempero verde",
    featured: false,
    checkoutTier: "traditional",
  },
  {
    id: "aipim-carne-seca",
    name: "Caldo de Aipim com Carne-Seca",
    description: "Aipim bem cremoso com carne-seca desfiada e tempero caseiro. Sabor brasileiro em cada colherada.",
    price: "R$ 23,90",
    size: "500 ml",
    category: "Especial",
    image: "/sopas/caldo-de-aipim-com-carne-seca.jpg",
    imageAlt: "Caldo cremoso de aipim com carne-seca desfiada",
    featured: false,
    checkoutTier: "special",
  },
  {
    id: "abobora-carne-seca",
    name: "Creme de Abóbora com Carne-Seca",
    description: "Creme aveludado de abóbora com carne-seca desfiada, equilibrando cremosidade e muito sabor.",
    price: "R$ 23,90",
    size: "500 ml",
    category: "Especial",
    image: "/sopas/creme-de-abobora-com-carne-seca.jpg",
    imageAlt: "Creme de abóbora com carne-seca desfiada e cebolinha",
    featured: false,
    checkoutTier: "special",
  },
] as const;

export default function Home() {
  const [notice, setNotice] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [nearbyKitchens, setNearbyKitchens] = useState<NearbyKitchen[]>([]);
  const [trackingConsent, setTrackingConsent] = useState<"pending" | "accepted" | "declined">("pending");
  const [cart, setCart] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>(emptyDeliveryDetails);

  const cartItems = soups
    .map((soup) => ({ soup, quantity: cart.filter((id) => id === soup.id).length }))
    .filter((item) => item.quantity > 0);
  const traditionalCount = cart.filter((id) => soups.find((soup) => soup.id === id)?.checkoutTier === "traditional").length;
  const specialCount = cart.length - traditionalCount;
  const cartTotal = traditionalCount * 19.9 + specialCount * 23.9;
  const selectedCheckoutUrl = CHECKOUT_URLS[`${traditionalCount}-${specialCount}`];

  useEffect(() => {
    const savedConsent = window.localStorage.getItem(META_CONSENT_KEY);
    setTrackingConsent(savedConsent === "accepted" ? "accepted" : savedConsent === "declined" ? "declined" : "pending");
  }, []);

  useEffect(() => {
    if (trackingConsent !== "accepted") return;

    if (!window.fbq) {
      const fbq: MetaPixelFunction = (...args: unknown[]) => {
        if (fbq.callMethod) fbq.callMethod(...args);
        else fbq.queue?.push(args);
      };

      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      window.fbq = fbq;
      window._fbq = fbq;

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }

    window.fbq("consent", "grant");
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }, [trackingConsent]);

  function saveTrackingConsent(consent: "accepted" | "declined") {
    window.localStorage.setItem(META_CONSENT_KEY, consent);
    setTrackingConsent(consent);
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function addToCart(productId: string) {
    const selectedSoup = soups.find((soup) => soup.id === productId);
    if (!selectedSoup) return;

    if (cart.length >= MAX_CART_ITEMS) {
      setCartOpen(true);
      showNotice("O limite inicial é de 4 sopas por pedido.");
      return;
    }

    setCart((currentCart) => [...currentCart, productId]);
    showNotice(`${selectedSoup.name} adicionada ao pedido.`);
  }

  function removeFromCart(productId: string) {
    setCart((currentCart) => {
      const itemIndex = currentCart.lastIndexOf(productId);
      if (itemIndex < 0) return currentCart;
      return currentCart.filter((_, index) => index !== itemIndex);
    });
  }

  function updateDeliveryDetail(field: keyof DeliveryDetails, value: string) {
    setDeliveryDetails((currentDetails) => ({ ...currentDetails, [field]: value }));
  }

  function continueToPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCheckoutUrl || cart.length === 0) return;

    window.sessionStorage.setItem(
      "sopa-pedido-atual",
      JSON.stringify({
        items: cartItems.map(({ soup, quantity }) => ({ id: soup.id, name: soup.name, quantity })),
        total: cartTotal,
        delivery: deliveryDetails,
        savedAt: new Date().toISOString(),
      }),
    );

    const eventDetails = {
      content_ids: cart,
      content_name: cartItems.map(({ soup, quantity }) => `${quantity}x ${soup.name}`).join(", "),
      content_type: "product",
      currency: "BRL",
      num_items: cart.length,
      value: cartTotal,
    };

    window.fbq?.("track", "InitiateCheckout", eventDetails);
    window.setTimeout(() => window.location.assign(selectedCheckoutUrl), window.fbq ? 120 : 0);
  }

  function findNearbyKitchens() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unavailable");
      return;
    }

    setLocationStatus("locating");
    setNearbyKitchens([]);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const matches = partnerKitchens
          .map((kitchen) => ({
            ...kitchen,
            distanceKm: getDistanceKm(coords.latitude, coords.longitude, kitchen.latitude, kitchen.longitude),
          }))
          .filter((kitchen) => kitchen.distanceKm <= kitchen.radiusKm)
          .sort((first, second) => first.distanceKm - second.distanceKm);

        setNearbyKitchens(matches);
        setLocationStatus(matches.length > 0 ? "found" : "outside");
      },
      (error) => {
        setLocationStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function openCartOrMenu() {
    if (cart.length > 0) {
      setCartOpen(true);
      return;
    }

    document.querySelector("#cardapio")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Sopa Boa — início">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Sopa Boa</span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#perto-de-voce">Perto de você</a>
          <a href="#cardapio">Cardápio</a>
          <a href="#como-funciona">Como pedir</a>
          <button className="nav-cta" onClick={openCartOrMenu}>
            {cart.length > 0 ? `Carrinho (${cart.length})` : "Pedir agora"}
          </button>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Cozinhas locais • entrega no Rio • Pix</div>
          <h1>Sopa quentinha, pertinho de você.</h1>
          <p className="hero-text">
            Encontre cozinhas parceiras na sua região e peça caldos caprichados
            de 500 ml a partir de R$ 19,90.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#perto-de-voce">
              Encontrar sopa perto de mim <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#cardapio">Conhecer o cardápio</a>
          </div>
          <div className="hero-trust" aria-label="Vantagens">
            <span>✓ Pix confirmado na hora</span>
            <span>✓ Preços de lançamento</span>
            <span>✓ Localização não armazenada</span>
          </div>
        </div>

        <div className="hero-art" aria-label="Ilustração de uma tigela de sopa quente">
          <div className="sun" />
          <div className="steam steam-one" />
          <div className="steam steam-two" />
          <div className="steam steam-three" />
          <div className="bowl">
            <div className="soup">
              <span className="garnish garnish-one" />
              <span className="garnish garnish-two" />
              <span className="garnish garnish-three" />
            </div>
          </div>
          <div className="hero-card">
            <span className="status-dot" />
            <div><strong>Pedido fácil</strong><small>Escolha, pague e pronto</small></div>
          </div>
        </div>
      </section>

      <section className="menu-section" id="cardapio">
        <div className="section-heading">
          <div>
            <div className="menu-kickers">
              <span className="kicker">Cardápio</span>
              <span className="launch-label">Preços de lançamento</span>
            </div>
            <h2>Qual vai aquecer seu dia?</h2>
          </div>
          <p>Caldos de 500 ml, preparados no dia e enviados bem quentinhos. A partir de R$ 19,90.</p>
        </div>

        <div className="menu-grid">
          {soups.map((soup) => (
            <article className={`menu-card${soup.featured ? " featured" : ""}`} key={soup.id}>
              <div className="menu-visual" role="img" aria-label={soup.imageAlt}>
                <span className="soup-photo" style={{ backgroundImage: `url(${soup.image})` }} aria-hidden="true" />
              </div>
              <div className="menu-content">
                <div className="menu-meta">
                  <span className={`menu-badge${soup.featured ? " popular" : ""}`}>{soup.category}</span>
                  <span className="menu-size">{soup.size}</span>
                </div>
                <h3>{soup.name}</h3>
                <p>{soup.description}</p>
                <div className="menu-card-footer">
                  <div className="menu-price">
                    <small>Preço de lançamento</small>
                    <strong>{soup.price}</strong>
                  </div>
                  <button
                    onClick={() => {
                      window.fbq?.("track", "ViewContent", {
                        content_ids: [soup.id],
                        content_name: soup.name,
                        content_type: "product",
                        currency: "BRL",
                        value: soup.checkoutTier === "traditional" ? 19.9 : 23.9,
                      });
                      addToCart(soup.id);
                    }}
                    aria-label={`Adicionar ${soup.name}, ${soup.size}, por ${soup.price}`}
                  >
                    Adicionar <span aria-hidden="true">＋</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="drink-strip" aria-label="Bebidas disponíveis no checkout">
          <div className="drink-strip-heading">
            <span aria-hidden="true">🥤</span>
            <div>
              <strong>REFRIGERANTES — ESCOLHA NO CHECKOUT</strong>
              <small>Estas opções não são botões. Adicione a bebida depois de clicar em “Ir para o checkout”.</small>
            </div>
          </div>
          <div className="drink-options">
            <span><strong>Coca-Cola ou Guaraná • lata</strong><small>NO CHECKOUT • R$ 7,99</small></span>
            <span><strong>Coca-Cola ou Guaraná • 2 L</strong><small>NO CHECKOUT • R$ 14,99</small></span>
            <span><strong>2 pães franceses</strong><small>NO CHECKOUT • R$ 2,99</small></span>
          </div>
        </div>
        <p className="menu-note">Sabores sujeitos à disponibilidade da cozinha que atende sua região.</p>
      </section>

      <section className="locator-section" id="perto-de-voce">
        <div className="locator-copy">
          <span className="kicker light">Perto de você</span>
          <h2>Encontre uma cozinha que entrega na sua região.</h2>
          <p>
            Sua localização é usada somente neste navegador para comparar distâncias.
            Ela não é salva, enviada nem adicionada ao seu perfil.
          </p>
          <button className="location-button" onClick={findNearbyKitchens} disabled={locationStatus === "locating"}>
            <span aria-hidden="true">⌖</span>
            {locationStatus === "locating" ? "Buscando sua região…" : "Usar minha localização"}
          </button>
          <small>O navegador pedirá sua autorização antes de compartilhar a posição.</small>
        </div>

        <div className="locator-results" aria-live="polite">
          {locationStatus === "idle" && (
            <div className="locator-placeholder">
              <span aria-hidden="true">⌖</span>
              <strong>Descubra quem entrega aí</strong>
              <p>Toque no botão para ver as cozinhas parceiras por ordem de proximidade.</p>
            </div>
          )}

          {locationStatus === "locating" && (
            <div className="locator-placeholder">
              <span className="locator-spinner" aria-hidden="true" />
              <strong>Procurando cozinhas próximas…</strong>
              <p>Isso costuma levar apenas alguns segundos.</p>
            </div>
          )}

          {locationStatus === "found" && (
            <div className="nearby-list">
              <div className="result-heading">
                <span className="status-dot" />
                <strong>{nearbyKitchens.length === 1 ? "Encontramos uma cozinha perto de você" : `Encontramos ${nearbyKitchens.length} cozinhas perto de você`}</strong>
              </div>
              {nearbyKitchens.slice(0, MAX_KITCHEN_RESULTS).map((kitchen, index) => (
                <article className="kitchen-result" key={kitchen.id}>
                  <span className="result-rank">{index + 1}</span>
                  <div>
                    <strong>{kitchen.name} • {kitchen.neighborhood}</strong>
                    <small>{kitchen.city} • aprox. {kitchen.distanceKm.toFixed(1).replace(".", ",")} km • {kitchen.eta}</small>
                  </div>
                  <a href="#cardapio">Ver menu</a>
                </article>
              ))}
              {nearbyKitchens.length > MAX_KITCHEN_RESULTS && (
                <p className="demo-note">{MAX_KITCHEN_RESULTS === 1 ? "Mostrando a mais próxima." : `Mostrando as ${MAX_KITCHEN_RESULTS} mais próximas.`}</p>
              )}
            </div>
          )}

          {locationStatus === "outside" && (
            <div className="locator-placeholder compact">
              <span aria-hidden="true">⌖</span>
              <strong>Ainda não chegamos à sua região</strong>
              <p>Estamos cadastrando novas cozinhas. Tente novamente em breve.</p>
            </div>
          )}

          {locationStatus === "denied" && (
            <div className="locator-placeholder compact">
              <span aria-hidden="true">!</span>
              <strong>Localização não autorizada</strong>
              <p>Você pode liberar a permissão no navegador e tentar novamente.</p>
            </div>
          )}

          {locationStatus === "unavailable" && (
            <div className="locator-placeholder compact">
              <span aria-hidden="true">!</span>
              <strong>Não foi possível obter sua localização</strong>
              <p>Confira se a localização do aparelho está ativada e tente outra vez.</p>
            </div>
          )}
        </div>
      </section>

      <section className="steps-section" id="como-funciona">
        <div className="steps-intro">
          <span className="kicker light">Como funciona</span>
          <h2>Seu jantar resolvido em poucos minutos.</h2>
          <p>Sem cadastro demorado e sem precisar enviar comprovante.</p>
        </div>
        <div className="steps-grid">
          <article><span>01</span><h3>Escolha</h3><p>Veja os sabores disponíveis e monte seu pedido.</p></article>
          <article><span>02</span><h3>Pague no Pix</h3><p>Use o QR Code ou o código copia e cola do checkout.</p></article>
          <article><span>03</span><h3>Receba</h3><p>Com o pagamento aprovado, preparamos tudo para entrega.</p></article>
        </div>
      </section>

      <section className="final-cta">
        <div>
          <span className="kicker">Bateu a fome?</span>
          <h2>Hoje combina com sopa.</h2>
          <p>Confira os sabores disponíveis e faça seu pedido pelo Pix.</p>
        </div>
        <button className="primary-button dark" onClick={openCartOrMenu}>
          Fazer meu pedido <span aria-hidden="true">→</span>
        </button>
      </section>

      <footer>
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Sopa Boa</span>
        </a>
        <p>Comida de verdade, feita com carinho.</p>
        <small>© {new Date().getFullYear()} Sopa Boa. Todos os direitos reservados.</small>
      </footer>

      <button className="mobile-order" onClick={openCartOrMenu}>
        {cart.length > 0 ? `Ver pedido (${cart.length}) • ${cartTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` : "Montar meu pedido"}
      </button>

      {cartOpen && (
        <div className="cart-layer" role="presentation">
          <button className="cart-backdrop" aria-label="Fechar carrinho" onClick={() => setCartOpen(false)} />
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="cart-header">
              <div>
                <span className="kicker">Seu pedido</span>
                <h2 id="cart-title">Monte seu jantar</h2>
              </div>
              <button className="cart-close" onClick={() => setCartOpen(false)} aria-label="Fechar carrinho">×</button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <strong>Seu carrinho está vazio</strong>
                <p>Escolha até quatro sopas do cardápio para continuar.</p>
                <button onClick={() => setCartOpen(false)}>Ver cardápio</button>
              </div>
            ) : (
              <form className="checkout-form" onSubmit={continueToPayment}>
                <div className="cart-limit"><strong>{cart.length} de {MAX_CART_ITEMS}</strong> sopas adicionadas</div>

                <div className="cart-items">
                  {cartItems.map(({ soup, quantity }) => (
                    <article className="cart-item" key={soup.id}>
                      <span className="cart-item-photo" style={{ backgroundImage: `url(${soup.image})` }} aria-hidden="true" />
                      <div>
                        <strong>{soup.name}</strong>
                        <small>{soup.size} • {soup.price}</small>
                      </div>
                      <div className="quantity-control" aria-label={`Quantidade de ${soup.name}`}>
                        <button type="button" onClick={() => removeFromCart(soup.id)} aria-label={`Remover uma unidade de ${soup.name}`}>−</button>
                        <span>{quantity}</span>
                        <button type="button" onClick={() => addToCart(soup.id)} disabled={cart.length >= MAX_CART_ITEMS} aria-label={`Adicionar outra unidade de ${soup.name}`}>＋</button>
                      </div>
                    </article>
                  ))}
                </div>

                <button className="add-more" type="button" onClick={() => setCartOpen(false)} disabled={cart.length >= MAX_CART_ITEMS}>
                  {cart.length >= MAX_CART_ITEMS ? "Limite de 4 sopas atingido" : "+ Adicionar outro sabor"}
                </button>

                <div className="checkout-extra-note">
                  <span aria-hidden="true">🥤</span>
                  <div><strong>Bebidas e pães</strong><small>No checkout você pode adicionar refrigerante e 2 pães franceses por R$ 2,99.</small></div>
                </div>

                <div className="cart-total">
                  <span>Total do pedido</span>
                  <strong>{cartTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
                </div>

                <div className="delivery-form">
                  <div className="form-heading">
                    <span>Entrega</span>
                    <strong>25 a 35 min • até 7 km</strong>
                  </div>

                  <div className="form-grid">
                    <label className="wide-field">
                      Nome
                      <input required autoComplete="name" value={deliveryDetails.name} onChange={(event) => updateDeliveryDetail("name", event.target.value)} placeholder="Quem vai receber?" />
                    </label>
                    <label>
                      WhatsApp
                      <input required inputMode="tel" autoComplete="tel" value={deliveryDetails.whatsapp} onChange={(event) => updateDeliveryDetail("whatsapp", event.target.value)} placeholder="(21) 99999-9999" />
                    </label>
                    <label>
                      CEP
                      <input required inputMode="numeric" autoComplete="postal-code" value={deliveryDetails.cep} onChange={(event) => updateDeliveryDetail("cep", event.target.value)} placeholder="00000-000" />
                    </label>
                    <label className="street-field">
                      Rua
                      <input required autoComplete="address-line1" value={deliveryDetails.street} onChange={(event) => updateDeliveryDetail("street", event.target.value)} placeholder="Nome da rua" />
                    </label>
                    <label className="number-field">
                      Número
                      <input required inputMode="numeric" value={deliveryDetails.number} onChange={(event) => updateDeliveryDetail("number", event.target.value)} placeholder="123" />
                    </label>
                    <label>
                      Bairro
                      <input required autoComplete="address-level3" value={deliveryDetails.neighborhood} onChange={(event) => updateDeliveryDetail("neighborhood", event.target.value)} placeholder="Seu bairro" />
                    </label>
                    <label>
                      Complemento
                      <input autoComplete="address-line2" value={deliveryDetails.complement} onChange={(event) => updateDeliveryDetail("complement", event.target.value)} placeholder="Apto, bloco…" />
                    </label>
                    <label className="wide-field">
                      Ponto de referência
                      <input value={deliveryDetails.reference} onChange={(event) => updateDeliveryDetail("reference", event.target.value)} placeholder="Ex.: próximo à praça" />
                    </label>
                    <label className="wide-field">
                      Observações
                      <textarea value={deliveryDetails.notes} onChange={(event) => updateDeliveryDetail("notes", event.target.value)} placeholder="Alguma orientação para a entrega?" rows={3} />
                    </label>
                  </div>

                  <p className="privacy-note">Seus dados não entram na URL de pagamento. Eles ficam temporariamente neste aparelho; a cozinha confirma o endereço pelo WhatsApp.</p>
                </div>

                <button className="pay-button" type="submit">
                  Ir para o Pix seguro <span aria-hidden="true">→</span>
                </button>
                <small className="pay-helper">Você verá o resumo e o valor exato no checkout da SharkBot.</small>
              </form>
            )}
          </aside>
        </div>
      )}

      <div className={`toast ${notice ? "show" : ""}`} role="status" aria-live="polite">
        {notice}
      </div>

      {trackingConsent === "pending" && (
        <aside className="cookie-banner" aria-label="Preferências de privacidade">
          <div>
            <strong>Privacidade do seu jeito</strong>
            <p>Usamos cookies da Meta somente para medir os anúncios e melhorar as ofertas. Você pode continuar sem aceitar.</p>
          </div>
          <div className="cookie-actions">
            <button className="cookie-decline" onClick={() => saveTrackingConsent("declined")}>Continuar sem cookies</button>
            <button className="cookie-accept" onClick={() => saveTrackingConsent("accepted")}>Aceitar medição</button>
          </div>
        </aside>
      )}
    </main>
  );
}
