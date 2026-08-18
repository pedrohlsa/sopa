"use client";

import { useState } from "react";

const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim() ?? "";

const partnerKitchens = [
  { id: "centro", name: "Cozinha parceira", neighborhood: "Centro", latitude: -22.9068, longitude: -43.1729, radiusKm: 7, eta: "35–50 min" },
  { id: "tijuca", name: "Cozinha parceira", neighborhood: "Tijuca", latitude: -22.9249, longitude: -43.2321, radiusKm: 6, eta: "30–45 min" },
  { id: "botafogo", name: "Cozinha parceira", neighborhood: "Botafogo", latitude: -22.9519, longitude: -43.1840, radiusKm: 6, eta: "35–50 min" },
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
  },
  {
    id: "ervilha-bacon-calabresa",
    name: "Creme de Ervilha com Bacon e Calabresa",
    description: "Ervilha cremosa com bacon e calabresa dourada. Encorpado, quentinho e muito bem servido.",
    price: "R$ 20,90",
    size: "500 ml",
    category: "Tradicional",
    image: "/sopas/creme-de-ervilha-com-bacon-e-calabresa.jpg",
    imageAlt: "Creme de ervilha com pedaços de bacon e calabresa",
    featured: false,
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
  },
] as const;

export default function Home() {
  const [notice, setNotice] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [nearbyKitchens, setNearbyKitchens] = useState<NearbyKitchen[]>([]);

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

  function openCheckout(productId?: string) {
    if (CHECKOUT_URL) {
      const checkoutUrl = new URL(CHECKOUT_URL, window.location.origin);

      if (productId) {
        checkoutUrl.searchParams.set("produto", productId);
      }

      window.location.assign(checkoutUrl.toString());
      return;
    }

    const selectedSoup = soups.find((soup) => soup.id === productId);
    setNotice(selectedSoup ? `Checkout de ${selectedSoup.name} será conectado em breve.` : "O checkout será conectado em breve.");
    window.setTimeout(() => setNotice(""), 5500);
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
          <button className="nav-cta" onClick={() => openCheckout()}>Pedir agora</button>
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
                <strong>{nearbyKitchens.length === 1 ? "Encontramos uma opção" : `Encontramos ${nearbyKitchens.length} opções`}</strong>
              </div>
              {nearbyKitchens.map((kitchen, index) => (
                <article className="kitchen-result" key={kitchen.id}>
                  <span className="result-rank">{index + 1}</span>
                  <div>
                    <strong>{kitchen.name} • {kitchen.neighborhood}</strong>
                    <small>aprox. {kitchen.distanceKm.toFixed(1).replace(".", ",")} km • {kitchen.eta}</small>
                  </div>
                  <a href="#cardapio">Ver menu</a>
                </article>
              ))}
              <p className="demo-note">Cozinhas demonstrativas. Serão substituídas pelas parceiras reais.</p>
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
                  <button onClick={() => openCheckout(soup.id)} aria-label={`Pedir ${soup.name}, ${soup.size}, por ${soup.price}`}>
                    Escolher <span aria-hidden="true">＋</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="menu-note">Sabores sujeitos à disponibilidade da cozinha que atende sua região.</p>
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
        <button className="primary-button dark" onClick={() => openCheckout()}>
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

      <button className="mobile-order" onClick={findNearbyKitchens}>Encontrar sopa perto de mim</button>

      <div className={`toast ${notice ? "show" : ""}`} role="status" aria-live="polite">
        {notice}
      </div>
    </main>
  );
}
