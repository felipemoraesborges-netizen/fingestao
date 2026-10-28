# FinGestão 💰 • Controle Financeiro & Sistema de Pastas

Aplicativo web intuitivo, moderno e prático focado em gestão de gastos e finanças pessoais com orçamento mensal diário e sistema flexível de **"Pastas/Projetos/Eventos"** para isolar e monitorar gastos específicos de forma individual.

---

## 🚀 Funcionalidades Principais

### 1. Sistema Exclusivo de "Pastas" (Projetos & Eventos Isolados)
- **Criação Rápida de Pastas:**
  - Nome (ex: *Viagem para a Praia*, *Reforma do Quarto*, *Natal 2026*, *Casamento*).
  - Teto / Meta orçamentária estipulada (ex: R$ 3.500).
  - Cor de identificação e ícone personalizado (Praia, Reforma, Natal, Carro, etc.).
  - Status: **Ativa** ou **Arquivada/Finalizada**.
- **Visão Dedicada da Pasta:**
  - KPI Cards: Total Gasto, Teto Planejado, Saldo Restante / Excedente e Média por Lançamento.
  - Barra de progresso visual colorida (Verde < 80%, Amarelo >= 80%, Vermelho >= 100%).
  - Histórico exclusivo de despesas vinculadas à pasta com busca e filtros.
  - Divisão de gastos por categoria dentro do próprio projeto.
  - **Exportação individual:** Gera relatórios exclusivos da pasta em **PDF formatado** e em planilha **CSV**.
  - Efeito de celebração com confetes quando um projeto é arquivado dentro do orçamento!
- **Vínculo Transacional:**
  - Ao registrar qualquer nova transação no app, o campo opcional *"Vincular a uma Pasta?"* permite associá-la a um projeto ou mantê-la como gasto comum da rotina.

---

### 2. Dashboard Principal (Visão Geral Diária e Mensal)
- **Resumo Financeiro:** Saldo do Mês, Total Receitas, Total Despesas e Gastos em Pastas.
- **Gráficos Interativos (Recharts):**
  - Gráfico de Rosca/Donut de despesas por categoria com legendas e tooltips.
  - Gráfico de Barras comparativo de Fluxo de Caixa (Entradas vs. Saídas Gerais vs. Pastas).
- **Atalhos Rápidos:** Botões *"Nova Despesa"* e *"Nova Pasta"* acessíveis de qualquer tela.
- **Carrossel de Pastas Ativas:** Mini-cards com medidores de progresso diretamente na tela inicial.
- **Alertas Visuais Automáticos:** Banners de alerta quando qualquer pasta ou categoria atingir **80%** (aviso) ou **100%** (crítico).

---

### 3. Gestão Completa de Transações
- Lançamento ágil com teclado numérico em destaque (R$).
- Sugestões de descrições rápidas (*Supermercado*, *Combustível*, *Almoço*, *Salário*, etc.).
- Suporte a despesas fixas/recorrentes (*Aluguel*, *Netflix*, *Academia*).
- Formas de pagamento: PIX, Cartão de Crédito, Débito, Dinheiro, Boleto e Transferência.
- Filtros múltiplos: por mês/ano, tipo (receita/despesa), categoria, pasta vinculada, forma de pagamento e recorrência.

---

### 4. Categorias Customizáveis & Tetos de Gastos
- Categorias com ícones e cores configuráveis.
- Definição de **Teto Mensal de Gastos** por categoria (ex: R$ 600 em Lazer, R$ 1.500 em Alimentação).
- Medidor visual do percentual consumido do teto em tempo real.

---

### 5. Relatórios & Comparativo Mês a Mês
- Gráfico comparativo dos últimos 6 meses (Receitas vs. Despesas vs. Pastas).
- Cálculo automático da **Taxa de Poupança (% guardado)**.
- Distribuição de gastos por método de pagamento (PIX vs. Cartões vs. Boleto).
- Extrato mensal completo com exportação em **PDF** e **CSV**.

---

### 6. Design Moderno, Mobile-First & Dark Mode
- Suporte nativo a **Modo Escuro (Dark Mode)** e **Modo Claro** com persistência automática.
- Barra de navegação inferior mobile com botão flutuante central (+) para lançamentos em 1 toque.
- Tipografia limpa (*Plus Jakarta Sans*) e cards elegantes com Tailwind CSS v4.

---

### 7. Backend & Integração com Supabase
- **Modo Local / Demo:** Funciona 100% offline direto no navegador com dados de demonstração realistas pré-carregados (Viagem à Praia, Reforma do Quarto e Natal 2026).
- **Conexão com Supabase:** Permite inserir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` diretamente na interface de Configurações ou em um arquivo `.env`.
- **Esquema SQL Pronto com RLS:** Arquivo `src/database/schema.sql` disponível com 1 clique de cópia no painel para colar no *SQL Editor* do Supabase.
- **Backup e Restauração:** Exportação e importação de backups completos em formato JSON.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Exportação:** [jsPDF](https://github.com/parallax/jsPDF) e [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Efeitos:** [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Backend / DB:** [Supabase](https://supabase.com/) (`@supabase/supabase-js`) com PostgreSQL e Row Level Security (RLS)

---

## 🏃 Como Rodar o Projeto Localmente

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. Abra seu navegador em `http://localhost:5173`.
