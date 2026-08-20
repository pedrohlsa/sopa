"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const META_PIXEL_ID = "1050963361185572";
const META_CONSENT_KEY = "sopa-meta-consent";
const CART_KEY = "sopa-carrinho";

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

const OPENING_HOURS = "Todos os dias, das 18h à meia-noite";
const DELIVERY_ETA = "25 a 35 min";
const DELIVERY_RANGE = "até 7 km da cozinha mais próxima";

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

// Parâmetros que a plataforma de anúncios usa para atribuir a venda. Sem
// repassá-los, o clique chega ao checkout sem origem.
const FORWARDED_PARAMS = ["fbclid", "gclid", "ttclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

const EXTRAS = [
  { icon: "🥤", name: "Refrigerante lata", detail: "Coca-Cola ou Guaraná, 350 ml", price: "R$ 7,99" },
  { icon: "🥤", name: "Refrigerante 2 L", detail: "Coca-Cola ou Guaraná", price: "R$ 14,99" },
  { icon: "🥖", name: "2 pães franceses", detail: "Fresquinhos, para acompanhar", price: "R$ 2,99" },
];

const soups = [
  {
    id: "caldo-verde-calabresa",
    name: "Caldo Verde com Calabresa",
    description: "Batata cremosa, couve fresquinha e calabresa dourada por cima.",
    price: "R$ 19,90",
    priceValue: 19.9,
    size: "500 ml",
    badge: "Clássico",
    image: "/sopas/caldo-verde-com-calabresa.jpg",
    imageAlt: "Caldo verde cremoso com couve e rodelas de calabresa",
    featured: true,
    checkoutTier: "traditional",
  },
  {
    id: "feijao-bacon-calabresa",
    name: "Caldo de Feijão com Bacon e Calabresa",
    description: "Feijão bem temperado, bacon crocante e calabresa. Encorpado.",
    price: "R$ 19,90",
    priceValue: 19.9,
    size: "500 ml",
    badge: "",
    image: "/sopas/caldo-de-feijao-com-bacon-e-calabresa.jpg",
    imageAlt: "Caldo de feijão cremoso com bacon e rodelas de calabresa",
    featured: false,
    checkoutTier: "traditional",
  },
  {
    id: "ervilha-bacon-calabresa",
    name: "Creme de Ervilha com Bacon e Calabresa",
    description: "Ervilha cremosa com bacon e calabresa dourada. Bem servido.",
    price: "R$ 19,90",
    priceValue: 19.9,
    size: "500 ml",
    badge: "",
    image: "/sopas/creme-de-ervilha-com-bacon-e-calabresa.jpg",
    imageAlt: "Creme de ervilha com bacon e calabresa",
    featured: false,
    checkoutTier: "traditional",
  },
  {
    id: "frango-legumes",
    name: "Sopa de Frango com Legumes",
    description: "Frango desfiado, cenoura, batata e cheiro-verde. Leve e caseira.",
    price: "R$ 19,90",
    priceValue: 19.9,
    size: "500 ml",
    badge: "",
    image: "/sopas/sopa-de-frango-com-legumes.jpg",
    imageAlt: "Sopa de frango com legumes em pedaços",
    featured: false,
    checkoutTier: "traditional",
  },
  {
    id: "aipim-carne-seca",
    name: "Caldo de Aipim com Carne-Seca",
    description: "Aipim batido até ficar aveludado, com carne-seca desfiada.",
    price: "R$ 23,90",
    priceValue: 23.9,
    size: "500 ml",
    badge: "",
    image: "/sopas/caldo-de-aipim-com-carne-seca.jpg",
    imageAlt: "Caldo de aipim cremoso com carne-seca desfiada",
    featured: false,
    checkoutTier: "special",
  },
  {
    id: "abobora-carne-seca",
    name: "Creme de Abóbora com Carne-Seca",
    description: "Abóbora cremosa e levemente adocicada com carne-seca por cima.",
    price: "R$ 23,90",
    priceValue: 23.9,
    size: "500 ml",
    badge: "",
    image: "/sopas/creme-de-abobora-com-carne-seca.jpg",
    imageAlt: "Creme de abóbora com carne-seca desfiada",
    featured: false,
    checkoutTier: "special",
  },
];

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

const servedCities = [...new Set(partnerKitchens.map((kitchen) => kitchen.city))];
const servedNeighborhoods = [...new Set(partnerKitchens.map((kitchen) => kitchen.neighborhood))].sort((a, b) =>
  a.localeCompare(b, "pt-BR"),
);

const formatBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Page() {
  const [notice, setNotice] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [nearbyKitchens, setNearbyKitchens] = useState<NearbyKitchen[]>([]);
  const [trackingConsent, setTrackingConsent] = useState<"pending" | "accepted" | "declined">("pending");
  const [cart, setCart] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);
  const menuRef = useRef<HTMLElement | null>(null);
  const viewContentSent = useRef(false);

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

  // Recarregar no meio do pedido não pode custar o carrinho. sessionStorage e não
  // localStorage: o pedido morre junto com a aba, não ressuscita dias depois.
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(window.sessionStorage.getItem(CART_KEY) ?? "[]");
      if (!Array.isArray(saved)) return;
      const valid = saved
        .filter((id): id is string => typeof id === "string" && soups.some((soup) => soup.id === id))
        .slice(0, MAX_CART_ITEMS);
      if (valid.length) setCart(valid);
    } catch {
      /* carrinho corrompido: começa vazio */
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

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

  // ViewContent = a pessoa viu o cardápio de verdade, não que clicou em algo.
  useEffect(() => {
    const target = menuRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || viewContentSent.current) return;
        viewContentSent.current = true;
        window.fbq?.("track", "ViewContent", {
          content_ids: soups.map((soup) => soup.id),
          content_name: "Cardápio Sopa Boa",
          content_type: "product_group",
          currency: "BRL",
          value: 19.9,
        });
        observer.disconnect();
      },
      { threshold: 0.25 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [trackingConsent]);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }, []);

  function addToCart(productId: string, fromMenu = false) {
    const selectedSoup = soups.find((soup) => soup.id === productId);
    if (!selectedSoup) return;

    if (cart.length >= MAX_CART_ITEMS) {
      setCartOpen(true);
      showNotice("São até 4 sopas por pedido.");
      return;
    }

    setCart((currentCart) => [...currentCart, productId]);
    showNotice(`${selectedSoup.name} no seu pedido.`);

    if (fromMenu) {
      window.fbq?.("track", "AddToCart", {
        content_ids: [selectedSoup.id],
        content_name: selectedSoup.name,
        content_type: "product",
        currency: "BRL",
        value: selectedSoup.priceValue,
      });
    }
  }

  function removeFromCart(productId: string) {
    setCart((currentCart) => {
      const itemIndex = currentCart.lastIndexOf(productId);
      if (itemIndex < 0) return currentCart;
      return currentCart.filter((_, index) => index !== itemIndex);
    });
  }

  function checkoutUrlWithSource(baseUrl: string) {
    try {
      const target = new URL(baseUrl);
      const current = new URLSearchParams(window.location.search);
      for (const key of FORWARDED_PARAMS) {
        const value = current.get(key);
        if (value) target.searchParams.set(key, value);
      }
      return target.toString();
    } catch {
      return baseUrl;
    }
  }

  function continueToPayment() {
    if (!selectedCheckoutUrl || cart.length === 0) return;

    window.sessionStorage.setItem(
      "sopa-pedido-atual",
      JSON.stringify({
        items: cartItems.map(({ soup, quantity }) => ({ id: soup.id, name: soup.name, quantity })),
        total: cartTotal,
        savedAt: new Date().toISOString(),
      }),
    );

    window.fbq?.("track", "InitiateCheckout", {
      content_ids: cart,
      content_name: cartItems.map(({ soup, quantity }) => `${quantity}x ${soup.name}`).join(", "),
      content_type: "product",
      currency: "BRL",
      num_items: cart.length,
      value: cartTotal,
    });

    const destination = checkoutUrlWithSource(selectedCheckoutUrl);
    window.setTimeout(() => window.location.assign(destination), window.fbq ? 120 : 0);
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

  function saveTrackingConsent(consent: "accepted" | "declined") {
    window.localStorage.setItem(META_CONSENT_KEY, consent);
    setTrackingConsent(consent);
  }

  function goToMenu() {
    document.querySelector("#cardapio")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#topo" aria-label="Sopa Boa — início">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Sopa Boa</span>
        </a>
        <button className="header-cta" onClick={goToMenu}>Pedir</button>
      </header>

      <section className="hero" id="topo">
        <div className="hero-photo">
          <img
            src="/sopas/caldo-verde-com-calabresa.jpg"
            alt="Caldo verde com calabresa servido em uma tigela"
            width={1200}
            height={900}
            fetchPriority="high"
          />
        </div>
        <div className="hero-copy">
          <span className="hero-eyebrow">Delivery de sopas no Rio</span>
          <h1>Sopa quentinha chegando na sua casa 🍲</h1>
          <p>Caldos de 500 ml a partir de R$ 19,90. Escolha seu sabor e peça em poucos minutos.</p>
          <ul className="hero-facts">
            <li>500 ml</li>
            <li>a partir de R$ 19,90</li>
            <li>entrega em {DELIVERY_ETA}</li>
          </ul>
          <button className="primary-button" onClick={goToMenu}>
            Ver sabores e pedir
          </button>
          <p className="hero-hours">{OPENING_HOURS} • pagamento no Pix</p>
        </div>
      </section>

      <section className="menu-section" id="cardapio" ref={menuRef}>
        <h2>Escolha seu caldo</h2>
        <p className="section-sub">Preparados no dia e enviados bem quentinhos.</p>

        <div className="menu-list">
          {soups.map((soup) => (
            <article className={`menu-card${soup.featured ? " is-featured" : ""}`} key={soup.id}>
              <img
                className="menu-photo"
                src={soup.image}
                alt={soup.imageAlt}
                width={480}
                height={360}
                loading={soup.featured ? "eager" : "lazy"}
              />
              <div className="menu-body">
                {soup.badge ? <span className="menu-badge">{soup.badge}</span> : null}
                <h3>{soup.name}</h3>
                <p>{soup.description}</p>
                <div className="menu-foot">
                  <span className="menu-price">
                    <small>{soup.size}</small>
                    <strong>{soup.price}</strong>
                  </span>
                  <button
                    className="add-button"
                    onClick={() => addToCart(soup.id, true)}
                    aria-label={`Adicionar ${soup.name} por ${soup.price}`}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="extras">
          <h3>Complete seu pedido</h3>
          <ul>
            {EXTRAS.map((extra) => (
              <li key={extra.name}>
                <span aria-hidden="true">{extra.icon}</span>
                <div>
                  <strong>{extra.name}</strong>
                  <small>{extra.detail}</small>
                </div>
                <b>{extra.price}</b>
              </li>
            ))}
          </ul>
          <small className="extras-note">Você adiciona os acompanhamentos na tela de pagamento.</small>
        </div>
      </section>

      <section className="area-section" id="entrega">
        <h2>Entregamos na sua região?</h2>
        <p className="section-sub">
          Temos cozinhas no Rio e na Baixada. Seu pedido sai da mais perto de você, num raio de até 7 km.
        </p>

        <div className="area-actions">
          <button className="ghost-button" onClick={findNearbyKitchens} disabled={locationStatus === "locating"}>
            {locationStatus === "locating" ? "Verificando…" : "Usar minha localização"}
          </button>
          <button className="link-button" onClick={() => setAreaOpen((open) => !open)} aria-expanded={areaOpen}>
            {areaOpen ? "Fechar lista de bairros" : "Ver bairros atendidos"}
          </button>
        </div>
        <small className="area-privacy">Sua localização é usada só neste aparelho e não é salva.</small>

        <div aria-live="polite">
          {locationStatus === "found" && nearbyKitchens.length > 0 && (
            <div className="area-result ok">
              <strong>Sim, entregamos aí 🎉</strong>
              <p>
                A cozinha mais próxima fica em {nearbyKitchens[0].neighborhood} ({nearbyKitchens[0].city}), a cerca de{" "}
                {nearbyKitchens[0].distanceKm.toFixed(1).replace(".", ",")} km. Entrega em {DELIVERY_ETA}.
              </p>
              <button className="primary-button small" onClick={goToMenu}>Escolher meu caldo</button>
            </div>
          )}
          {locationStatus === "outside" && (
            <div className="area-result">
              <strong>Ainda não chegamos aí</strong>
              <p>Estamos abrindo cozinhas novas toda semana. Volte para conferir em breve.</p>
            </div>
          )}
          {locationStatus === "denied" && (
            <div className="area-result">
              <strong>Sem problema</strong>
              <p>Você pode conferir a lista de bairros atendidos aqui embaixo.</p>
            </div>
          )}
          {locationStatus === "unavailable" && (
            <div className="area-result">
              <strong>Não consegui pegar sua localização</strong>
              <p>Confira a lista de bairros atendidos aqui embaixo.</p>
            </div>
          )}
        </div>

        {areaOpen && (
          <div className="area-list">
            <p>
              Atendemos estes bairros <strong>e os arredores</strong>, em {servedCities.join(", ")}:
            </p>
            <div className="area-chips">
              {servedNeighborhoods.map((neighborhood) => (
                <span key={neighborhood}>{neighborhood}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="trust-section">
        <h2>Como funciona o pedido</h2>
        <ul className="trust-list">
          <li>
            <span aria-hidden="true">🍲</span>
            <div><strong>500 ml bem servidos</strong><small>Preparados no dia, enviados quentinhos.</small></div>
          </li>
          <li>
            <span aria-hidden="true">🏠</span>
            <div><strong>Entrega na sua região</strong><small>{DELIVERY_ETA}, {DELIVERY_RANGE}.</small></div>
          </li>
          <li>
            <span aria-hidden="true">🕕</span>
            <div><strong>Horário de atendimento</strong><small>{OPENING_HOURS}.</small></div>
          </li>
          <li>
            <span aria-hidden="true">🔒</span>
            <div><strong>Pagamento no Pix</strong><small>Confirmação na hora, sem enviar comprovante.</small></div>
          </li>
        </ul>
      </section>

      <section className="final-cta">
        <h2>Bateu a fome?</h2>
        <button className="primary-button" onClick={goToMenu}>Ver sabores e pedir</button>
      </section>

      <footer>
        <span className="brand footer-brand">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Sopa Boa</span>
        </span>
        <p>Sopa caseira entregue no Rio e na Baixada Fluminense.</p>
        <p className="footer-info">
          {OPENING_HOURS} • Entrega {DELIVERY_RANGE} • Pagamento no Pix
        </p>
        <small>© {new Date().getFullYear()} Sopa Boa</small>
      </footer>

      {cart.length > 0 && !cartOpen && (
        <button className="cart-bar" onClick={() => setCartOpen(true)}>
          <span>
            {cart.length} {cart.length === 1 ? "item" : "itens"} · {formatBRL(cartTotal)}
          </span>
          <b>Ver pedido →</b>
        </button>
      )}

      {cartOpen && (
        <div className="cart-layer" role="presentation">
          <button className="cart-backdrop" aria-label="Fechar pedido" onClick={() => setCartOpen(false)} />
          <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
            <div className="cart-header">
              <h2 id="cart-title">Seu pedido</h2>
              <button className="cart-close" onClick={() => setCartOpen(false)} aria-label="Fechar">×</button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <strong>Nada por aqui ainda</strong>
                <button className="primary-button" onClick={() => setCartOpen(false)}>Ver o cardápio</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(({ soup, quantity }) => (
                    <article className="cart-item" key={soup.id}>
                      <img src={soup.image} alt="" width={64} height={64} loading="lazy" />
                      <div className="cart-item-info">
                        <strong>{soup.name}</strong>
                        <small>{soup.size} • {soup.price}</small>
                      </div>
                      <div className="quantity-control">
                        <button type="button" onClick={() => removeFromCart(soup.id)} aria-label={`Remover uma unidade de ${soup.name}`}>−</button>
                        <span aria-label={`${quantity} unidades`}>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => addToCart(soup.id)}
                          disabled={cart.length >= MAX_CART_ITEMS}
                          aria-label={`Adicionar outra unidade de ${soup.name}`}
                        >
                          ＋
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <button
                  className="add-more"
                  type="button"
                  onClick={() => setCartOpen(false)}
                  disabled={cart.length >= MAX_CART_ITEMS}
                >
                  {cart.length >= MAX_CART_ITEMS ? "Máximo de 4 sopas" : "+ Adicionar outro sabor"}
                </button>

                <div className="cart-summary">
                  <div className="summary-row">
                    <span>{cart.length} {cart.length === 1 ? "sopa" : "sopas"} de 500 ml</span>
                    <span>{formatBRL(cartTotal)}</span>
                  </div>
                  <div className="summary-row muted">
                    <span>Entrega</span>
                    <span>{DELIVERY_ETA}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <strong>{formatBRL(cartTotal)}</strong>
                  </div>
                </div>

                <p className="cart-next">
                  Na próxima tela você paga no Pix e pode adicionar refrigerante ou pães.
                  Depois do pagamento confirmamos o endereço da entrega pelo WhatsApp.
                </p>

                <button className="pay-button" type="button" onClick={continueToPayment}>
                  Ir para o pagamento · {formatBRL(cartTotal)}
                </button>
                <small className="pay-helper">Pagamento no Pix processado pela SharkBot.</small>
              </>
            )}
          </aside>
        </div>
      )}

      <div className={`toast ${notice ? "show" : ""}`} role="status" aria-live="polite">
        {notice}
      </div>

      {trackingConsent === "pending" && (
        <aside className="cookie-banner" aria-label="Preferências de privacidade">
          <p>Usamos cookies para medir nossos anúncios.</p>
          <div className="cookie-actions">
            <button className="cookie-decline" onClick={() => saveTrackingConsent("declined")}>Agora não</button>
            <button className="cookie-accept" onClick={() => saveTrackingConsent("accepted")}>Aceitar</button>
          </div>
        </aside>
      )}
    </main>
  );

}
