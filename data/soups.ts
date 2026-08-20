/**
 * Cardápio da Sopa Boa — fonte única.
 *
 * O servidor calcula o total a partir daqui e ignora qualquer preço que venha do
 * navegador. Se o preço viesse do cliente, dava para pedir quatro sopas por
 * um centavo abrindo o devtools.
 */
export type Soup = {
  id: string;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  size: string;
  badge: string;
  image: string;
  imageAlt: string;
  featured: boolean;
  checkoutTier: "traditional" | "special";
};

export const soups: Soup[] = [
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

export const MAX_CART_ITEMS = 4;

/**
 * Acompanhamentos.
 *
 * Eram order bumps da SharkBot. Com o checkout próprio eles precisam existir
 * aqui, senão essa receita simplesmente some — era o que subia o ticket de
 * R$ 19,90 para R$ 27 ou R$ 34.
 */
export type Extra = {
  id: string;
  name: string;
  detail: string;
  price: string;
  priceValue: number;
  icon: string;
};

export const extras: Extra[] = [
  {
    id: "refri-lata",
    name: "Refrigerante lata",
    detail: "Coca-Cola ou Guaraná, 350 ml",
    price: "R$ 7,99",
    priceValue: 7.99,
    icon: "🥤",
  },
  {
    id: "refri-2l",
    name: "Refrigerante 2 L",
    detail: "Coca-Cola ou Guaraná",
    price: "R$ 14,99",
    priceValue: 14.99,
    icon: "🥤",
  },
  {
    id: "paes-franceses",
    name: "2 pães franceses",
    detail: "Fresquinhos, para acompanhar",
    price: "R$ 2,99",
    priceValue: 2.99,
    icon: "🥖",
  },
];

export const MAX_EXTRA_QUANTITY = 10;

export function findSoup(id: string) {
  return soups.find((soup) => soup.id === id);
}

export function findExtra(id: string) {
  return extras.find((extra) => extra.id === id);
}
