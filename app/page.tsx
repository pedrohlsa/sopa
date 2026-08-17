"use client";

import { useState } from "react";

const CHECKOUT_URL = process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim() ?? "";

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
            <button className="primary-button" onClick={openCheckout}>
              Ver opções e pedir <span aria-hidden="true">→</span>
            </button>
            <a className="text-link" href="#cardapio">Conhecer o cardápio</a>
          </div>
          <div className="hero-trust" aria-label="Vantagens">
            <span>✓ Pix confirmado na hora</span>
            <span>✓ Pedido simples e seguro</span>
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

      <button className="mobile-order" onClick={openCheckout}>Pedir pelo Pix</button>

      <div className={`toast ${notice ? "show" : ""}`} role="status" aria-live="polite">
        O checkout será conectado em breve.
      </div>
    </main>
  );
}
