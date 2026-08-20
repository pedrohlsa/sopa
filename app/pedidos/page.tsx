"use client";

import { useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "sopa-admin-token";

type Item = { id: string; name: string; quantity: number };
type Order = {
  id: string;
  createdAt: number;
  status: string;
  paidAt: number | null;
  items: Item[];
  total: number;
  customerName: string;
  customerPhone: string;
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string | null;
  addressNeighborhood: string;
  addressReference: string | null;
  notes: string | null;
};

const hora = (epoch: number) =>
  new Date(epoch * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const telefoneLegivel = (digits: string) =>
  digits.length === 11
    ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    : digits.length === 10
      ? `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
      : digits;

export default function PedidosPage() {
  const [token, setToken] = useState("");
  const [entrada, setEntrada] = useState("");
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [somentePagos, setSomentePagos] = useState(true);

  useEffect(() => {
    const salvo = window.localStorage.getItem(TOKEN_KEY);
    if (salvo) setToken(salvo);
  }, []);

  const buscar = useCallback(async () => {
    if (!token) return;
    setCarregando(true);
    try {
      const resposta = await fetch(`/api/admin/pedidos${somentePagos ? "?status=paid" : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (resposta.status === 401) {
        setErro("Senha incorreta.");
        setToken("");
        window.localStorage.removeItem(TOKEN_KEY);
        return;
      }
      if (!resposta.ok) {
        setErro("Não consegui carregar os pedidos.");
        return;
      }
      const dados = (await resposta.json()) as { orders: Order[] };
      setPedidos(dados.orders);
      setErro("");
    } catch {
      setErro("Sem conexão com o servidor.");
    } finally {
      setCarregando(false);
    }
  }, [token, somentePagos]);

  // A cozinha deixa esta tela aberta a noite toda; ela precisa se atualizar sozinha.
  useEffect(() => {
    if (!token) return;
    buscar();
    const timer = window.setInterval(buscar, 20000);
    return () => window.clearInterval(timer);
  }, [token, buscar]);

  if (!token) {
    return (
      <main className="admin-login">
        <h1>Pedidos</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!entrada.trim()) return;
            window.localStorage.setItem(TOKEN_KEY, entrada.trim());
            setToken(entrada.trim());
            setEntrada("");
          }}
        >
          <label>
            Senha do painel
            <input
              type="password"
              value={entrada}
              onChange={(event) => setEntrada(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button className="primary-button" type="submit">Entrar</button>
        </form>
        {erro ? <p className="admin-erro">{erro}</p> : null}
      </main>
    );
  }

  return (
    <main className="admin">
      <header className="admin-header">
        <h1>Pedidos</h1>
        <div className="admin-actions">
          <button className="link-button" onClick={() => setSomentePagos((v) => !v)}>
            {somentePagos ? "Mostrar todos" : "Só os pagos"}
          </button>
          <button className="link-button" onClick={buscar} disabled={carregando}>
            {carregando ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
      </header>

      {erro ? <p className="admin-erro">{erro}</p> : null}

      {pedidos.length === 0 ? (
        <p className="admin-vazio">
          {somentePagos ? "Nenhum pedido pago ainda." : "Nenhum pedido ainda."}
        </p>
      ) : (
        <ul className="admin-lista">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className={`admin-pedido ${pedido.status}`}>
              <div className="admin-topo">
                <strong>
                  {pedido.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </strong>
                <span className={`admin-status ${pedido.status}`}>
                  {pedido.status === "paid" ? "PAGO" : pedido.status === "failed" ? "FALHOU" : "aguardando"}
                </span>
                <small>{hora(pedido.paidAt ?? pedido.createdAt)}</small>
              </div>

              <ul className="admin-itens">
                {pedido.items.map((item) => (
                  <li key={item.id}>
                    <b>{item.quantity}×</b> {item.name}
                  </li>
                ))}
              </ul>

              <div className="admin-cliente">
                <strong>{pedido.customerName}</strong>
                <a href={`https://wa.me/55${pedido.customerPhone}`} target="_blank" rel="noreferrer">
                  {telefoneLegivel(pedido.customerPhone)}
                </a>
              </div>

              <address>
                {pedido.addressStreet}, {pedido.addressNumber}
                {pedido.addressComplement ? ` — ${pedido.addressComplement}` : ""}
                <br />
                {pedido.addressNeighborhood} · CEP {pedido.addressCep}
                {pedido.addressReference ? <><br />Referência: {pedido.addressReference}</> : null}
              </address>

              {pedido.notes ? <p className="admin-obs">Obs.: {pedido.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
