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
    name: "Caldo verde",
    description: "Batata cremosa, couve fininha e calabresa dourada.",
    price: "R$ 20",
    accent: "green",
    icon: "🥬",
  },
  {
    name: "Canja da casa",
    description: "Frango desfiado, legumes frescos, arroz e cheiro-verde.",
    price: "R$ 19",
    accent: "gold",
    icon: "🥕",
  },
  {
    name: "Mandioquinha",
    description: "Creme aveludado com carne-seca desfiada e cebola crocante.",
    price: "R$ 24",
    accent: "orange",
    icon: "🍠",
  },
  {
    name: "Feijão com bacon",
    description: "Feijão bem temperado, bacon crocante e um toque de pimenta.",
    price: "R$ 21",
    accent: "red",
    icon: "🫘",
  },
];

export default function Home() {
  const [notice, setNotice] = useState(false);
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

  function openCheckout() {
    if (CHECKOUT_URL) {
      window.location.assign(CHECKOUT_URL);
      return;
    }

    setNotice(true);
    window.setTimeout(() => setNotice(false), 3600);
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
          <button className="nav-cta" onClick={openCheckout}>Pedir agora</button>
        </nav>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Entrega local • pagamento via Pix</div>
          <h1>Sopa quentinha, do nosso fogão pra sua casa.</h1>
          <p className="hero-text">
            Receitas caprichadas, ingredientes frescos e aquele sabor que abraça.
            Escolha a sua e receba sem complicação.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#perto-de-voce">
              Encontrar sopa perto de mim <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#cardapio">Conhecer o cardápio</a>
          </div>
          <div className="hero-trust" aria-label="Vantagens">
            <span>✓ Pix confirmado na hora</span>
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
            <span className="kicker">Cardápio</span>
            <h2>Qual vai aquecer seu dia?</h2>
          </div>
          <p>Porções individuais, preparadas no dia e enviadas bem quentinhas.</p>
        </div>

        <div className="menu-grid">
          {soups.map((soup) => (
            <article className="menu-card" key={soup.name}>
              <div className={`menu-visual ${soup.accent}`} aria-hidden="true">
                <span>{soup.icon}</span>
              </div>
              <div className="menu-content">
                <div className="menu-title-row">
                  <h3>{soup.name}</h3>
                  <strong>{soup.price}</strong>
                </div>
                <p>{soup.description}</p>
                <button onClick={openCheckout} aria-label={`Pedir ${soup.name}`}>
                  Escolher <span aria-hidden="true">＋</span>
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className="menu-note">Cardápio e valores demonstrativos — confirme a disponibilidade no checkout.</p>
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
        <button className="primary-button dark" onClick={openCheckout}>
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
        O checkout será conectado em breve.
      </div>
    </main>
  );
}
