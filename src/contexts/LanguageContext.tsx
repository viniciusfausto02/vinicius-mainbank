"use client";

// Simple internationalization (i18n) using React Context.
// Supports two locales: "pt" (Brazilian Portuguese) and "en" (English).
//
// All UI text for the landing page AND the demo dashboard lives here.
// The rest of the app only calls `t("someKey")`, without worrying about
// how translations are stored.

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type Locale = "en" | "pt" | "es" | "de";

// Master translation object.
// - Keys under `en` define the "shape" of the translation dictionary.
// - `pt` must have the same keys to satisfy TypeScript.
const translations = {
  en: {
    // ====== Landing (Home) ======
    headerBadge: "vinicius-fausto · vinibank",
    headerTitleHighlight:
      "a modern digital banking experience in a simulated environment",
    headerDescription:
      "ViniBank emulates a contemporary online banking platform: secure sign-in, account overview, transfers and transaction history. Designed as a realistic, end-to-end simulation — no real money, but real product thinking.",

    heroLabel: "simulated banking dashboard",
    heroDescription:
      "The core experience will include checking and savings accounts, recent payments, incoming transfers and smart insights — presented as a responsive, data-driven dashboard.",

    ctaPrimary: "Enter ViniBank demo",
    ctaSecondary: "Read how the simulation works",

    cardTechTitle: "technology",
    cardTechBody:
      "ViniBank is built with Next.js 14 (App Router), TypeScript and Tailwind CSS. Data is managed through Prisma ORM and PostgreSQL, with authentication powered by NextAuth and a simulated Stripe integration for subscription flows.",

    cardExperienceTitle: "experience",
    cardExperienceBody:
      "The interface follows modern digital banking patterns: clear hierarchy, responsive design, keyboard-friendly navigation and accessible color contrast. Every screen is treated as if it were going into production for real customers.",

    cardObjectiveTitle: "objective",
    cardObjectiveBody:
      "The goal is to present a realistic banking simulation that demonstrates end-to-end thinking: from database schema and security to UX details and copywriting. ViniBank is a showcase of how I would approach building a real digital bank experience.",

    languageToggleLabel: "Language",
    languageToggleEnglish: "English",
    languageTogglePortuguese: "Português",
    languageToggleSpanish: "Español",
    languageToggleGerman: "Deutsch",
    languageToggleActive: "Active",

    // ====== Old demo keys (kept for future use or other pages) ======
    demoHeaderTitle: "ViniBank demo",
    demoHeaderSubtitle:
      "This is a simulated dashboard with fake accounts, balances and recent activity — built to behave like a real modern banking app.",

    demoWelcomeTitle: "Good morning, Vinicius",
    demoWelcomeSubtitle:
      "Here is an overview of your main balances and the latest movements in your accounts.",

    demoAccountsSectionTitle: "Accounts overview",
    demoPrimaryCheckingLabel: "Primary checking",
    demoSavingsLabel: "Savings",
    demoCreditCardLabel: "Credit card",

    demoRecentActivityTitle: "Recent activity",
    demoRecentActivitySeeAll: "View all transactions",

    demoInsightsTitle: "Insights",
    demoInsightsLine1: "Your savings rate this month is higher than last month.",
    demoInsightsLine2: "Most of your spending is concentrated on subscriptions.",

    // ====== New demo dashboard keys used in DemoClient ======
    demoHeaderBadge: "ViniBank · demo dashboard",
    demoHeaderWelcomePrefix: "Welcome back,",
    demoAnonymousUser: "ViniBank user",
    demoHeaderDescriptionDetailed:
      "This dashboard is backed by a real PostgreSQL database using Prisma. The cards below read live account data, and the transfer form updates those balances in real time.",
    demoTotalBalanceLabel: "Total balance",
    demoTotalBalanceHelper: "Sum of all ViniBank accounts",
    demoAccountTypeLabelPrefix: "Account",
    demoAvailableBalanceLabel: "Available balance",
    demoViewAccountDetailsSoon: "View account details (soon)",
    demoRecentActivitySubtitle:
      "Most recent movements across all your accounts.",
    demoExportStatementSoon: "Export statement (soon)",
    demoNoTransactionsMessage:
      "No transactions found yet. As you perform transfers, they will appear here.",
    demoTableHeaderDescription: "Description",
    demoTableHeaderFrom: "From",
    demoTableHeaderTo: "To",
    demoTableHeaderAmount: "Amount",
    demoTableHeaderType: "Type",
    
    // ====== Dashboard UI ======
    demoYourAccounts: "Your Accounts",
    demoLiveBadge: "Live",
    demoAvailableBalanceShort: "Available Balance",
    demoCardAccount: "Card / Account",
    demoTypeLabel: "Type",
    demoViewDetailsLink: "View Details →",
    demoQuickTransfer: "Quick Transfer",
    demoSendMoney: "Send Money",
    demoFinancialOverview: "Financial Overview",
    demoBudgetTracking: "Budget Tracking",
    demoCategoriesTitle: "Categories",
    demoRecentTransactions: "Recent Transactions",
    demoExportButton: "Export",
    
    // ====== Login Page ======
    loginTitle: "Sign in to ViniBank",
    loginDescription: "Use the credentials you created in the registration step, or sign in with Google.",
    loginEmailLabel: "Email",
    loginEmailPlaceholder: "you@example.com",
    loginPasswordLabel: "Password",
    loginPasswordPlaceholder: "••••••••",
    loginSubmitButton: "Sign in",
    loginSubmittingButton: "Signing in...",
    loginErrorInvalid: "Invalid email or password.",
    loginDivider: "or continue with",
    loginGoogleButton: "Continue with Google",
    loginNoAccount: "Don't have an account yet?",
    loginCreateLink: "Create one",
    
    // ====== Register Page ======
    registerTitle: "Create your ViniBank account",
    registerDescription: "This is a demo app, but the registration flow is real: password hashing, validation and database persistence.",
    registerNameLabel: "Name",
    registerNamePlaceholder: "How should we call you?",
    registerEmailLabel: "Email",
    registerEmailPlaceholder: "you@example.com",
    registerPasswordLabel: "Password",
    registerPasswordPlaceholder: "At least 8 characters",
    registerSubmitButton: "Create account",
    registerSubmittingButton: "Creating account...",
    registerDivider: "or continue with",
    registerGoogleButton: "Continue with Google",
    registerHaveAccount: "Already have an account?",
    registerSignInLink: "Sign in",
    
    // ====== Transfer Form ======
    transferFromLabel: "From account",
    transferToLabel: "To account",
    transferAmountLabel: "Amount",
    transferAmountPlaceholder: "250.00",
    transferDescriptionLabel: "Description",
    transferDescriptionPlaceholder: "Savings, rent, etc.",
    transferDefaultDescription: "Internal transfer",
    transferSubmitButton: "Confirm transfer",
    transferSubmittingButton: "Transferring...",
    transferErrorAmount: "Please enter a valid positive amount.",
    transferErrorAccounts: "Please choose both source and destination accounts.",
    transferErrorSameAccount: "Source and destination must be different accounts.",
    transferErrorFailed: "Transfer failed. Please try again.",
    transferErrorUnexpected: "Unexpected error while processing transfer.",
    transferSuccess: "Transfer completed successfully.",
    
    // ====== User Transfer Form ======
    userTransferFromAccount: "From Account",
    userTransferRecipientEmail: "Recipient Email",
    userTransferOrPhone: "Or Phone",
    userTransferOrCPF: "Or CPF",
    userTransferAmount: "Amount",
    userTransferDescription: "Description",
    userTransferSendButton: "Send Money",
    userTransferSendingButton: "Sending...",
    userTransferEmailPlaceholder: "user@vinibank.dev",
    userTransferPhonePlaceholder: "+55 11 99999-9999",
    userTransferCPFPlaceholder: "123.456.789-00",
    userTransferAmountPlaceholder: "0.00",
    userTransferDescriptionPlaceholder: "e.g., Pizza dinner",
    userTransferErrorNoAccount: "Please select a source account.",
    userTransferErrorNoRecipient: "Please enter recipient email, phone, or CPF.",
    userTransferErrorNoDescription: "Please enter a description.",
    
    // ====== Budgets Panel ======
    budgetsDescription: "Track spending against your monthly limits.",
    budgetsSaveButton: "Save",
    budgetsSavingButton: "Saving…",
    budgetsIncomeLabel: "Income",
    budgetsExpensesLabel: "Expenses",
    budgetsMonthlyLimit: "monthly limit",
    budgetsErrorLoad: "Failed to load budgets",
    budgetsErrorSave: "Could not save changes",
    budgetsLoading: "Loading budgets…",
    
    // ====== Category Manager ======
    categoriesDescription: "Create and organize your expense/income categories.",
    categoriesNamePlaceholder: "Category name",
    categoriesKindExpense: "Expense",
    categoriesKindIncome: "Income",
    categoriesAddButton: "Add",
    categoriesDeleteButton: "Delete",
    categoriesDeleteConfirm: "Delete this category? Transactions will become uncategorized.",
    categoriesErrorLoad: "Failed to load categories",
    categoriesErrorAdd: "Could not add category",
    categoriesErrorDelete: "Could not delete category",
    categoriesLoading: "Loading categories…",
    
    // ====== Insights Panel ======
    insightsIncomeLabel: "Income (30d)",
    insightsExpensesLabel: "Expenses (30d)",
    insightsErrorLoad: "Failed to load insights",
    insightsLoading: "Loading insights…",
    
    // ====== Navbar ======
    navDashboard: "Dashboard",
    navAdmin: "Admin",
    navLogin: "Login",
    navGetStarted: "Get Started",
    navSignOut: "Sign out",

    // ====== Settings Page ======
    settingsLoading: "Loading settings…",
    settingsTitle: "Account settings",
    settingsSubtitle: "Manage your profile details.",
    settingsEmailLabel: "Email",
    settingsNameLabel: "Name",
    settingsNamePlaceholder: "Your display name",
    settingsSaveChanges: "Save changes",
    settingsSaveFailed: "Failed to save",
    settingsSaved: "Saved",

    // ====== Account & Transaction Types ======
    accountTypeChecking: "Checking",
    accountTypeSavings: "Savings",
    accountTypeCredit: "Credit",
    transactionKindDebit: "Debit",
    transactionKindCredit: "Credit",
    transactionKindTransfer: "Transfer",

    // ====== Tabs (Dashboard) ======
    tabsOverview: "Overview",
    tabsAccounts: "Accounts",
    tabsTransfer: "Transfer",
    tabsInsights: "Insights",
    tabsBudgets: "Budgets",
    tabsCategories: "Categories",
    tabsTransactions: "Transactions",

    // ====== Transactions Table ======
    txFilterType: "Type",
    txFilterAccount: "Account",
    txFilterSearch: "Search",
    txFilterSearchPlaceholder: "Search description or account",
    txFilterAll: "All",
    txFilterDateRange: "Date range",
    txDateAll: "All time",
    txDate7d: "Last 7 days",
    txDate30d: "Last 30 days",
    txDate90d: "Last 90 days",

    // ====== Insights ML ======
    insightsShowTrend: "Show trend",
    insightsTrendLabel: "Trend",
    insightsTrendUp: "Up",
    insightsTrendDown: "Down",
    insightsTrendFlat: "Flat",
    insightsProjected7dLabel: "Projected 7 days",
    txSortBy: "Sort by",
    txSortDate: "Date",
    txSortAmount: "Amount",
    txExportCSV: "Export CSV",
    txNoResults: "No matching transactions",
    
    // ====== Transfer Errors ======
    transferInsufficientFunds: "Insufficient funds in the source account.",
  },

  pt: {
    // ====== Landing (Home) ======
    headerBadge: "vinicius-fausto · vinibank",
    headerTitleHighlight:
      "uma experiência moderna de banco digital em ambiente simulado",
    headerDescription:
      "O ViniBank emula uma plataforma moderna de banco digital: login seguro, visão de contas, transferências e histórico de transações. É um simulador completo de ponta a ponta — sem dinheiro real, mas com pensamento real de produto.",

    heroLabel: "painel bancário simulado",
    heroDescription:
      "A experiência principal inclui contas corrente e poupança, pagamentos recentes, transferências recebidas e insights inteligentes — tudo apresentado em um dashboard responsivo orientado a dados.",

    ctaPrimary: "Acessar demo do ViniBank",
    ctaSecondary: "Entender como a simulação funciona",

    cardTechTitle: "tecnologia",
    cardTechBody:
      "O ViniBank é construído com Next.js 14 (App Router), TypeScript e Tailwind CSS. Os dados são gerenciados com Prisma ORM e PostgreSQL, autenticação via NextAuth e uma integração simulada com Stripe para fluxos de assinatura.",

    cardExperienceTitle: "experiência",
    cardExperienceBody:
      "A interface segue padrões modernos de bancos digitais: hierarquia clara, design responsivo, navegação por teclado e contraste acessível. Cada tela é tratada como se fosse para produção, para clientes reais.",

    cardObjectiveTitle: "objetivo",
    cardObjectiveBody:
      "O objetivo é apresentar uma simulação realista de banco digital que demonstre visão de ponta a ponta: do schema de banco de dados e segurança até detalhes de UX e texto. O ViniBank é um exemplo de como eu abordaria a construção de um banco digital real.",

    languageToggleLabel: "Idioma",
    languageToggleEnglish: "English",
    languageTogglePortuguese: "Português",
    languageToggleSpanish: "Español",
    languageToggleGerman: "Deutsch",
    languageToggleActive: "Ativa",

    // ====== Old demo keys (mantidos para uso futuro / outras telas) ======
    demoHeaderTitle: "Demo do ViniBank",
    demoHeaderSubtitle:
      "Este é um dashboard simulado com contas, saldos e movimentações fictícias — construído para se comportar como um app bancário moderno.",

    demoWelcomeTitle: "Bom dia, Vinicius",
    demoWelcomeSubtitle:
      "Aqui vai um resumo dos seus principais saldos e dos últimos movimentos nas suas contas.",

    demoAccountsSectionTitle: "Visão geral de contas",
    demoPrimaryCheckingLabel: "Conta corrente principal",
    demoSavingsLabel: "Poupança",
    demoCreditCardLabel: "Cartão de crédito",

    demoRecentActivityTitle: "Atividade recente",
    demoRecentActivitySeeAll: "Ver todas as transações",

    demoInsightsTitle: "Insights",
    demoInsightsLine1:
      "Sua taxa de poupança neste mês está maior do que no mês passado.",
    demoInsightsLine2:
      "A maior parte dos seus gastos está concentrada em assinaturas.",

    // ====== New demo dashboard keys used in DemoClient ======
    demoHeaderBadge: "ViniBank · painel de demonstração",
    demoHeaderWelcomePrefix: "Bem-vindo de volta,",
    demoAnonymousUser: "Usuário ViniBank",
    demoHeaderDescriptionDetailed:
      "Este painel é conectado a um banco PostgreSQL real usando Prisma. Os cards abaixo leem os dados das contas em tempo real, e o formulário de transferência atualiza esses saldos de verdade.",
    demoTotalBalanceLabel: "Saldo total",
    demoTotalBalanceHelper: "Soma de todas as contas ViniBank",
    demoAccountTypeLabelPrefix: "Conta",
    demoAvailableBalanceLabel: "Saldo disponível",
    demoViewAccountDetailsSoon: "Ver detalhes da conta (em breve)",
    demoRecentActivitySubtitle:
      "Movimentações mais recentes em todas as suas contas.",
    demoExportStatementSoon: "Exportar extrato (em breve)",
    demoNoTransactionsMessage:
      "Nenhuma transação encontrada ainda. À medida que você fizer transferências, elas vão aparecer aqui.",
    demoTableHeaderDescription: "Descrição",
    demoTableHeaderFrom: "De",
    demoTableHeaderTo: "Para",
    demoTableHeaderAmount: "Valor",
    demoTableHeaderType: "Tipo",
    
    // ====== Dashboard UI ======
    demoYourAccounts: "Suas Contas",
    demoLiveBadge: "Ao Vivo",
    demoAvailableBalanceShort: "Saldo Disponível",
    demoCardAccount: "Cartão / Conta",
    demoTypeLabel: "Tipo",
    demoViewDetailsLink: "Ver Detalhes →",
    demoQuickTransfer: "Transferência Rápida",
    demoSendMoney: "Enviar Dinheiro",
    demoFinancialOverview: "Visão Financeira",
    demoBudgetTracking: "Acompanhamento de Orçamento",
    demoCategoriesTitle: "Categorias",
    demoRecentTransactions: "Transações Recentes",
    demoExportButton: "Exportar",
    
    // ====== Login Page ======
    loginTitle: "Entrar no ViniBank",
    loginDescription: "Use as credenciais que você criou no cadastro, ou entre com Google.",
    loginEmailLabel: "Email",
    loginEmailPlaceholder: "voce@exemplo.com",
    loginPasswordLabel: "Senha",
    loginPasswordPlaceholder: "••••••••",
    loginSubmitButton: "Entrar",
    loginSubmittingButton: "Entrando...",
    loginErrorInvalid: "Email ou senha inválidos.",
    loginDivider: "ou continue com",
    loginGoogleButton: "Continuar com Google",
    loginNoAccount: "Ainda não tem uma conta?",
    loginCreateLink: "Criar uma",
    
    // ====== Register Page ======
    registerTitle: "Crie sua conta ViniBank",
    registerDescription: "Este é um app demonstrativo, mas o fluxo de cadastro é real: hash de senha, validação e persistência no banco de dados.",
    registerNameLabel: "Nome",
    registerNamePlaceholder: "Como devemos te chamar?",
    registerEmailLabel: "Email",
    registerEmailPlaceholder: "voce@exemplo.com",
    registerPasswordLabel: "Senha",
    registerPasswordPlaceholder: "No mínimo 8 caracteres",
    registerSubmitButton: "Criar conta",
    registerSubmittingButton: "Criando conta...",
    registerDivider: "ou continue com",
    registerGoogleButton: "Continuar com Google",
    registerHaveAccount: "Já tem uma conta?",
    registerSignInLink: "Entrar",
    
    // ====== Transfer Form ======
    transferFromLabel: "Da conta",
    transferToLabel: "Para a conta",
    transferAmountLabel: "Valor",
    transferAmountPlaceholder: "250.00",
    transferDescriptionLabel: "Descrição",
    transferDescriptionPlaceholder: "Poupança, aluguel, etc.",
    transferDefaultDescription: "Transferência interna",
    transferSubmitButton: "Confirmar transferência",
    transferSubmittingButton: "Transferindo...",
    transferErrorAmount: "Por favor insira um valor positivo válido.",
    transferErrorAccounts: "Por favor escolha as contas de origem e destino.",
    transferErrorSameAccount: "Origem e destino devem ser contas diferentes.",
    transferErrorFailed: "Transferência falhou. Tente novamente.",
    transferErrorUnexpected: "Erro inesperado ao processar transferência.",
    transferSuccess: "Transferência concluída com sucesso.",
    
    // ====== User Transfer Form ======
    userTransferFromAccount: "Da Conta",
    userTransferRecipientEmail: "Email do Destinatário",
    userTransferOrPhone: "Ou Telefone",
    userTransferOrCPF: "Ou CPF",
    userTransferAmount: "Valor",
    userTransferDescription: "Descrição",
    userTransferSendButton: "Enviar Dinheiro",
    userTransferSendingButton: "Enviando...",
    userTransferEmailPlaceholder: "usuario@vinibank.dev",
    userTransferPhonePlaceholder: "+55 11 99999-9999",
    userTransferCPFPlaceholder: "123.456.789-00",
    userTransferAmountPlaceholder: "0.00",
    userTransferDescriptionPlaceholder: "ex: Jantar de pizza",
    userTransferErrorNoAccount: "Por favor selecione a conta de origem.",
    userTransferErrorNoRecipient: "Informe email, telefone ou CPF do destinatário.",
    userTransferErrorNoDescription: "Por favor insira uma descrição.",
    
    // ====== Budgets Panel ======
    budgetsDescription: "Acompanhe gastos em relação aos seus limites mensais.",
    budgetsSaveButton: "Salvar",
    budgetsSavingButton: "Salvando…",
    budgetsIncomeLabel: "Receitas",
    budgetsExpensesLabel: "Despesas",
    budgetsMonthlyLimit: "limite mensal",
    budgetsErrorLoad: "Falha ao carregar orçamentos",
    budgetsErrorSave: "Não foi possível salvar alterações",
    budgetsLoading: "Carregando orçamentos…",
    
    // ====== Category Manager ======
    categoriesDescription: "Crie e organize suas categorias de receitas/despesas.",
    categoriesNamePlaceholder: "Nome da categoria",
    categoriesKindExpense: "Despesa",
    categoriesKindIncome: "Receita",
    categoriesAddButton: "Adicionar",
    categoriesDeleteButton: "Excluir",
    categoriesDeleteConfirm: "Excluir esta categoria? As transações ficarão sem categoria.",
    categoriesErrorLoad: "Falha ao carregar categorias",
    categoriesErrorAdd: "Não foi possível adicionar categoria",
    categoriesErrorDelete: "Não foi possível excluir categoria",
    categoriesLoading: "Carregando categorias…",
    
    // ====== Insights Panel ======
    insightsIncomeLabel: "Receitas (30d)",
    insightsExpensesLabel: "Despesas (30d)",
    insightsErrorLoad: "Falha ao carregar insights",
    insightsLoading: "Carregando insights…",
    
    // ====== Navbar ======
    navDashboard: "Painel",
    navAdmin: "Admin",
    navLogin: "Entrar",
    navGetStarted: "Começar",
    navSignOut: "Sair",

    // ====== Settings Page ======
    settingsLoading: "Carregando configurações…",
    settingsTitle: "Configurações da conta",
    settingsSubtitle: "Gerencie os detalhes do seu perfil.",
    settingsEmailLabel: "Email",
    settingsNameLabel: "Nome",
    settingsNamePlaceholder: "Seu nome de exibição",
    settingsSaveChanges: "Salvar alterações",
    settingsSaveFailed: "Falha ao salvar",
    settingsSaved: "Salvo",

    // ====== Account & Transaction Types ======
    accountTypeChecking: "Conta Corrente",
    accountTypeSavings: "Poupança",
    accountTypeCredit: "Crédito",
    transactionKindDebit: "Débito",
    transactionKindCredit: "Crédito",
    transactionKindTransfer: "Transferência",

    // ====== Tabs (Dashboard) ======
    tabsOverview: "Visão Geral",
    tabsAccounts: "Contas",
    tabsTransfer: "Transferir",
    tabsInsights: "Insights",
    tabsBudgets: "Orçamentos",
    tabsCategories: "Categorias",
    tabsTransactions: "Transações",

    // ====== Transactions Table ======
    txFilterType: "Tipo",
    txFilterAccount: "Conta",
    txFilterSearch: "Buscar",
    txFilterSearchPlaceholder: "Buscar descrição ou conta",
    txFilterAll: "Todas",
    txFilterDateRange: "Período",
    txDateAll: "Todo o período",
    txDate7d: "Últimos 7 dias",
    txDate30d: "Últimos 30 dias",
    txDate90d: "Últimos 90 dias",

    // ====== Insights ML ======
    insightsShowTrend: "Mostrar tendência",
    insightsTrendLabel: "Tendência",
    insightsTrendUp: "Alta",
    insightsTrendDown: "Baixa",
    insightsTrendFlat: "Estável",
    insightsProjected7dLabel: "Projeção 7 dias",
    txSortBy: "Ordenar por",
    txSortDate: "Data",
    txSortAmount: "Valor",
    txExportCSV: "Exportar CSV",
    txNoResults: "Nenhuma transação encontrada",

    // ====== Transfer Errors ======
    transferInsufficientFunds: "Saldo insuficiente na conta de origem.",
  },

  es: {
    // ====== Landing (Home) ======
    headerBadge: "vinicius-fausto · vinibank",
    headerTitleHighlight:
      "una experiencia bancaria digital moderna en un entorno simulado",
    headerDescription:
      "ViniBank emula una plataforma bancaria en línea contemporánea: inicio de sesión seguro, vista de cuentas, transferencias e historial de transacciones. Diseñado como una simulación realista de extremo a extremo: sin dinero real, pero con pensamiento real de producto.",

    heroLabel: "panel bancario simulado",
    heroDescription:
      "La experiencia principal incluirá cuentas corrientes y de ahorro, pagos recientes, transferencias entrantes e información inteligente, presentados en un panel responsivo basado en datos.",

    ctaPrimary: "Entrar a la demo de ViniBank",
    ctaSecondary: "Leer cómo funciona la simulación",

    cardTechTitle: "tecnología",
    cardTechBody:
      "ViniBank está construido con Next.js 14 (App Router), TypeScript y Tailwind CSS. Los datos se gestionan a través de Prisma ORM y PostgreSQL, con autenticación con NextAuth y una integración simulada de Stripe para flujos de suscripción.",

    cardExperienceTitle: "experiencia",
    cardExperienceBody:
      "La interfaz sigue patrones modernos de banca digital: jerarquía clara, diseño responsivo, navegación amigable con el teclado y contraste de color accesible. Cada pantalla se trata como si fuera a producción para clientes reales.",

    cardObjectiveTitle: "objetivo",
    cardObjectiveBody:
      "El objetivo es presentar una simulación bancaria realista que demuestre pensamiento de extremo a extremo: desde el esquema de base de datos y seguridad hasta detalles de UX y redacción. ViniBank es una muestra de cómo abordaría la construcción de una experiencia bancaria digital real.",

    languageToggleLabel: "Idioma",
    languageToggleEnglish: "English",
    languageTogglePortuguese: "Português",
    languageToggleSpanish: "Español",
    languageToggleGerman: "Deutsch",
    languageToggleActive: "Activa",

    demoHeaderTitle: "Demo de ViniBank",
    demoHeaderSubtitle:
      "Este es un panel simulado con cuentas, saldos y actividad reciente falsos, construido para comportarse como una aplicación bancaria moderna real.",

    demoWelcomeTitle: "Buenos días, Vinicius",
    demoWelcomeSubtitle:
      "Aquí hay una descripción general de sus saldos principales y los últimos movimientos en sus cuentas.",

    demoAccountsSectionTitle: "Vista general de cuentas",
    demoPrimaryCheckingLabel: "Cuenta corriente principal",
    demoSavingsLabel: "Ahorros",
    demoCreditCardLabel: "Tarjeta de crédito",

    demoRecentActivityTitle: "Actividad reciente",
    demoRecentActivitySeeAll: "Ver todas las transacciones",

    demoInsightsTitle: "Información",
    demoInsightsLine1: "Su tasa de ahorro este mes es más alta que el mes pasado.",
    demoInsightsLine2: "La mayor parte de su gasto se concentra en suscripciones.",

    demoHeaderBadge: "ViniBank · panel de demostración",
    demoHeaderWelcomePrefix: "Bienvenido de nuevo,",
    demoAnonymousUser: "Usuario de ViniBank",
    demoHeaderDescriptionDetailed:
      "Este panel está respaldado por una base de datos PostgreSQL real usando Prisma. Las tarjetas a continuación leen datos de cuenta en vivo, y el formulario de transferencia actualiza esos saldos en tiempo real.",
    demoTotalBalanceLabel: "Saldo total",
    demoTotalBalanceHelper: "Suma de todas las cuentas ViniBank",
    demoAccountTypeLabelPrefix: "Cuenta",
    demoAvailableBalanceLabel: "Saldo disponible",
    demoViewAccountDetailsSoon: "Ver detalles de la cuenta (próximamente)",
    demoRecentActivitySubtitle:
      "Movimientos más recientes en todas sus cuentas.",
    demoExportStatementSoon: "Exportar extracto (próximamente)",
    demoNoTransactionsMessage:
      "Aún no se encontraron transacciones. A medida que realice transferencias, aparecerán aquí.",
    demoTableHeaderDescription: "Descripción",
    demoTableHeaderFrom: "De",
    demoTableHeaderTo: "Para",
    demoTableHeaderAmount: "Cantidad",
    demoTableHeaderType: "Tipo",
    
    // ====== Dashboard UI ======
    demoYourAccounts: "Sus Cuentas",
    demoLiveBadge: "En Vivo",
    demoAvailableBalanceShort: "Saldo Disponible",
    demoCardAccount: "Tarjeta / Cuenta",
    demoTypeLabel: "Tipo",
    demoViewDetailsLink: "Ver Detalles →",
    demoQuickTransfer: "Transferencia Rápida",
    demoSendMoney: "Enviar Dinero",
    demoFinancialOverview: "Visión Financiera",
    demoBudgetTracking: "Seguimiento de Presupuesto",
    demoCategoriesTitle: "Categorías",
    demoRecentTransactions: "Transacciones Recientes",
    demoExportButton: "Exportar",
    
    loginTitle: "Iniciar sesión en ViniBank",
    loginDescription: "Usa las credenciales que creaste en el paso de registro o inicia sesión con Google.",
    loginEmailLabel: "Email",
    loginEmailPlaceholder: "tu@ejemplo.com",
    loginPasswordLabel: "Contraseña",
    loginPasswordPlaceholder: "••••••••",
    loginSubmitButton: "Iniciar sesión",
    loginSubmittingButton: "Iniciando sesión...",
    loginErrorInvalid: "Email o contraseña inválidos.",
    loginDivider: "o continuar con",
    loginGoogleButton: "Continuar con Google",
    loginNoAccount: "¿Aún no tienes una cuenta?",
    loginCreateLink: "Crear una",
    
    registerTitle: "Crea tu cuenta ViniBank",
    registerDescription: "Esta es una aplicación de demostración, pero el flujo de registro es real: hash de contraseña, validación y persistencia en la base de datos.",
    registerNameLabel: "Nombre",
    registerNamePlaceholder: "¿Cómo deberíamos llamarte?",
    registerEmailLabel: "Email",
    registerEmailPlaceholder: "tu@ejemplo.com",
    registerPasswordLabel: "Contraseña",
    registerPasswordPlaceholder: "Al menos 8 caracteres",
    registerSubmitButton: "Crear cuenta",
    registerSubmittingButton: "Creando cuenta...",
    registerDivider: "o continuar con",
    registerGoogleButton: "Continuar con Google",
    registerHaveAccount: "¿Ya tienes una cuenta?",
    registerSignInLink: "Iniciar sesión",
    
    transferFromLabel: "De la cuenta",
    transferToLabel: "A la cuenta",
    transferAmountLabel: "Cantidad",
    transferAmountPlaceholder: "250.00",
    transferDescriptionLabel: "Descripción",
    transferDescriptionPlaceholder: "Ahorros, alquiler, etc.",
    transferDefaultDescription: "Transferencia interna",
    transferSubmitButton: "Confirmar transferencia",
    transferSubmittingButton: "Transfiriendo...",
    transferErrorAmount: "Por favor ingrese una cantidad positiva válida.",
    transferErrorAccounts: "Por favor elija las cuentas de origen y destino.",
    transferErrorSameAccount: "La cuenta de origen y destino deben ser diferentes.",
    transferErrorFailed: "Transferencia fallida. Inténtalo de nuevo.",
    transferErrorUnexpected: "Error inesperado al procesar la transferencia.",
    transferSuccess: "Transferencia completada exitosamente.",
    
    // ====== User Transfer Form ======
    userTransferFromAccount: "Desde la Cuenta",
    userTransferRecipientEmail: "Email del Destinatario",
    userTransferOrPhone: "O Teléfono",
    userTransferOrCPF: "O CPF",
    userTransferAmount: "Cantidad",
    userTransferDescription: "Descripción",
    userTransferSendButton: "Enviar Dinero",
    userTransferSendingButton: "Enviando...",
    userTransferEmailPlaceholder: "usuario@vinibank.dev",
    userTransferPhonePlaceholder: "+55 11 99999-9999",
    userTransferCPFPlaceholder: "123.456.789-00",
    userTransferAmountPlaceholder: "0.00",
    userTransferDescriptionPlaceholder: "ej: Cena de pizza",
    userTransferErrorNoAccount: "Por favor seleccione la cuenta de origen.",
    userTransferErrorNoRecipient: "Ingrese email, teléfono o CPF del destinatario.",
    userTransferErrorNoDescription: "Por favor ingrese una descripción.",
    
    budgetsDescription: "Rastree el gasto contra sus límites mensuales.",
    budgetsSaveButton: "Guardar",
    budgetsSavingButton: "Guardando…",
    budgetsIncomeLabel: "Ingresos",
    budgetsExpensesLabel: "Gastos",
    budgetsMonthlyLimit: "límite mensual",
    budgetsErrorLoad: "Error al cargar presupuestos",
    budgetsErrorSave: "No se pudieron guardar los cambios",
    budgetsLoading: "Cargando presupuestos…",
    
    categoriesDescription: "Cree y organice sus categorías de gastos/ingresos.",
    categoriesNamePlaceholder: "Nombre de categoría",
    categoriesKindExpense: "Gasto",
    categoriesKindIncome: "Ingreso",
    categoriesAddButton: "Agregar",
    categoriesDeleteButton: "Eliminar",
    categoriesDeleteConfirm: "¿Eliminar esta categoría? Las transacciones quedarán sin categoría.",
    categoriesErrorLoad: "Error al cargar categorías",
    categoriesErrorAdd: "No se pudo agregar la categoría",
    categoriesErrorDelete: "No se pudo eliminar la categoría",
    categoriesLoading: "Cargando categorías…",
    
    insightsIncomeLabel: "Ingresos (30d)",
    insightsExpensesLabel: "Gastos (30d)",
    insightsErrorLoad: "Error al cargar información",
    insightsLoading: "Cargando información…",
    
    navDashboard: "Panel",
    navAdmin: "Admin",
    navLogin: "Iniciar sesión",
    navGetStarted: "Comenzar",
    navSignOut: "Cerrar sesión",

    // ====== Settings Page ======
    settingsLoading: "Cargando configuraciones…",
    settingsTitle: "Configuración de la cuenta",
    settingsSubtitle: "Administra los detalles de tu perfil.",
    settingsEmailLabel: "Correo electrónico",
    settingsNameLabel: "Nombre",
    settingsNamePlaceholder: "Tu nombre para mostrar",
    settingsSaveChanges: "Guardar cambios",
    settingsSaveFailed: "Error al guardar",
    settingsSaved: "Guardado",

    // ====== Account & Transaction Types ======
    accountTypeChecking: "Cuenta corriente",
    accountTypeSavings: "Ahorros",
    accountTypeCredit: "Crédito",
    transactionKindDebit: "Débito",
    transactionKindCredit: "Crédito",
    transactionKindTransfer: "Transferencia",

    // ====== Tabs (Dashboard) ======
    tabsOverview: "Resumen",
    tabsAccounts: "Cuentas",
    tabsTransfer: "Transferir",
    tabsInsights: "Insights",
    tabsBudgets: "Presupuestos",
    tabsCategories: "Categorías",
    tabsTransactions: "Transacciones",

    // ====== Transactions Table ======
    txFilterType: "Tipo",
    txFilterAccount: "Cuenta",
    txFilterSearch: "Buscar",
    txFilterSearchPlaceholder: "Buscar descripción o cuenta",
    txFilterAll: "Todas",
    txFilterDateRange: "Rango de fechas",
    txDateAll: "Todo el período",
    txDate7d: "Últimos 7 días",
    txDate30d: "Últimos 30 días",
    txDate90d: "Últimos 90 días",

    // ====== Insights ML ======
    insightsShowTrend: "Mostrar tendencia",
    insightsTrendLabel: "Tendencia",
    insightsTrendUp: "Alza",
    insightsTrendDown: "Baja",
    insightsTrendFlat: "Estable",
    insightsProjected7dLabel: "Proyección 7 días",
    txSortBy: "Ordenar por",
    txSortDate: "Fecha",
    txSortAmount: "Monto",
    txExportCSV: "Exportar CSV",
    txNoResults: "No hay transacciones coincidentes",

    // ====== Transfer Errors ======
    transferInsufficientFunds: "Fondos insuficientes en la cuenta de origen.",
  },

  de: {
    // ====== Landing (Home) ======
    headerBadge: "vinicius-fausto · vinibank",
    headerTitleHighlight:
      "ein modernes digitales Bankerlebnis in einer simulierten Umgebung",
    headerDescription:
      "ViniBank emuliert eine zeitgemäße Online-Banking-Plattform: sichere Anmeldung, Kontoübersicht, Überweisungen und Transaktionsverlauf. Entwickelt als realistische End-to-End-Simulation – kein echtes Geld, aber echtes Produktdenken.",

    heroLabel: "simuliertes Banking-Dashboard",
    heroDescription:
      "Das Kernerlebnis umfasst Giro- und Sparkonten, aktuelle Zahlungen, eingehende Überweisungen und intelligente Einblicke – präsentiert in einem responsiven, datengesteuerten Dashboard.",

    ctaPrimary: "ViniBank-Demo aufrufen",
    ctaSecondary: "Lesen Sie, wie die Simulation funktioniert",

    cardTechTitle: "Technologie",
    cardTechBody:
      "ViniBank ist mit Next.js 14 (App Router), TypeScript und Tailwind CSS gebaut. Daten werden über Prisma ORM und PostgreSQL verwaltet, mit Authentifizierung durch NextAuth und einer simulierten Stripe-Integration für Abonnement-Flows.",

    cardExperienceTitle: "Erfahrung",
    cardExperienceBody:
      "Die Benutzeroberfläche folgt modernen digitalen Banking-Mustern: klare Hierarchie, responsives Design, tastaturfreundliche Navigation und zugänglicher Farbkontrast. Jeder Bildschirm wird so behandelt, als würde er für echte Kunden in Produktion gehen.",

    cardObjectiveTitle: "Ziel",
    cardObjectiveBody:
      "Das Ziel ist es, eine realistische Banking-Simulation zu präsentieren, die End-to-End-Denken demonstriert: vom Datenbankschema und Sicherheit bis hin zu UX-Details und Textgestaltung. ViniBank ist eine Demonstration, wie ich den Aufbau eines echten digitalen Bankerlebnisses angehen würde.",

    languageToggleLabel: "Sprache",
    languageToggleEnglish: "English",
    languageTogglePortuguese: "Português",
    languageToggleSpanish: "Español",
    languageToggleGerman: "Deutsch",
    languageToggleActive: "Aktiv",

    demoHeaderTitle: "ViniBank-Demo",
    demoHeaderSubtitle:
      "Dies ist ein simuliertes Dashboard mit gefälschten Konten, Salden und aktuellen Aktivitäten – entwickelt, um sich wie eine echte moderne Banking-App zu verhalten.",

    demoWelcomeTitle: "Guten Morgen, Vinicius",
    demoWelcomeSubtitle:
      "Hier ist eine Übersicht Ihrer Hauptguthaben und der neuesten Bewegungen auf Ihren Konten.",

    demoAccountsSectionTitle: "Kontenübersicht",
    demoPrimaryCheckingLabel: "Hauptgirokonto",
    demoSavingsLabel: "Sparkonto",
    demoCreditCardLabel: "Kreditkarte",

    demoRecentActivityTitle: "Aktuelle Aktivität",
    demoRecentActivitySeeAll: "Alle Transaktionen anzeigen",

    demoInsightsTitle: "Einblicke",
    demoInsightsLine1: "Ihre Sparquote in diesem Monat ist höher als im letzten Monat.",
    demoInsightsLine2: "Der Großteil Ihrer Ausgaben konzentriert sich auf Abonnements.",

    demoHeaderBadge: "ViniBank · Demo-Dashboard",
    demoHeaderWelcomePrefix: "Willkommen zurück,",
    demoAnonymousUser: "ViniBank-Benutzer",
    demoHeaderDescriptionDetailed:
      "Dieses Dashboard wird von einer echten PostgreSQL-Datenbank mit Prisma unterstützt. Die Karten unten lesen Live-Kontodaten, und das Überweisungsformular aktualisiert diese Salden in Echtzeit.",
    demoTotalBalanceLabel: "Gesamtsaldo",
    demoTotalBalanceHelper: "Summe aller ViniBank-Konten",
    demoAccountTypeLabelPrefix: "Konto",
    demoAvailableBalanceLabel: "Verfügbares Guthaben",
    demoViewAccountDetailsSoon: "Kontodetails anzeigen (demnächst)",
    demoRecentActivitySubtitle:
      "Neueste Bewegungen auf all Ihren Konten.",
    demoExportStatementSoon: "Kontoauszug exportieren (demnächst)",
    demoNoTransactionsMessage:
      "Noch keine Transaktionen gefunden. Wenn Sie Überweisungen durchführen, werden sie hier angezeigt.",
    demoTableHeaderDescription: "Beschreibung",
    demoTableHeaderFrom: "Von",
    demoTableHeaderTo: "An",
    demoTableHeaderAmount: "Betrag",
    demoTableHeaderType: "Typ",
    
    // ====== Dashboard UI ======
    demoYourAccounts: "Ihre Konten",
    demoLiveBadge: "Live",
    demoAvailableBalanceShort: "Verfügbares Guthaben",
    demoCardAccount: "Karte / Konto",
    demoTypeLabel: "Typ",
    demoViewDetailsLink: "Details anzeigen →",
    demoQuickTransfer: "Schnellüberweisung",
    demoSendMoney: "Geld senden",
    demoFinancialOverview: "Finanzübersicht",
    demoBudgetTracking: "Budget-Tracking",
    demoCategoriesTitle: "Kategorien",
    demoRecentTransactions: "Aktuelle Transaktionen",
    demoExportButton: "Exportieren",
    
    loginTitle: "Bei ViniBank anmelden",
    loginDescription: "Verwenden Sie die Anmeldeinformationen, die Sie im Registrierungsschritt erstellt haben, oder melden Sie sich mit Google an.",
    loginEmailLabel: "E-Mail",
    loginEmailPlaceholder: "du@beispiel.com",
    loginPasswordLabel: "Passwort",
    loginPasswordPlaceholder: "••••••••",
    loginSubmitButton: "Anmelden",
    loginSubmittingButton: "Anmeldung läuft...",
    loginErrorInvalid: "Ungültige E-Mail oder Passwort.",
    loginDivider: "oder fortfahren mit",
    loginGoogleButton: "Mit Google fortfahren",
    loginNoAccount: "Haben Sie noch kein Konto?",
    loginCreateLink: "Erstellen",
    
    registerTitle: "Erstellen Sie Ihr ViniBank-Konto",
    registerDescription: "Dies ist eine Demo-App, aber der Registrierungsablauf ist echt: Passwort-Hashing, Validierung und Datenbankpersistenz.",
    registerNameLabel: "Name",
    registerNamePlaceholder: "Wie sollen wir Sie nennen?",
    registerEmailLabel: "E-Mail",
    registerEmailPlaceholder: "du@beispiel.com",
    registerPasswordLabel: "Passwort",
    registerPasswordPlaceholder: "Mindestens 8 Zeichen",
    registerSubmitButton: "Konto erstellen",
    registerSubmittingButton: "Konto wird erstellt...",
    registerDivider: "oder fortfahren mit",
    registerGoogleButton: "Mit Google fortfahren",
    registerHaveAccount: "Haben Sie bereits ein Konto?",
    registerSignInLink: "Anmelden",
    
    transferFromLabel: "Von Konto",
    transferToLabel: "Zum Konto",
    transferAmountLabel: "Betrag",
    transferAmountPlaceholder: "250.00",
    transferDescriptionLabel: "Beschreibung",
    transferDescriptionPlaceholder: "Ersparnisse, Miete, etc.",
    transferDefaultDescription: "Interne Überweisung",
    transferSubmitButton: "Überweisung bestätigen",
    transferSubmittingButton: "Überweisung läuft...",
    transferErrorAmount: "Bitte geben Sie einen gültigen positiven Betrag ein.",
    transferErrorAccounts: "Bitte wählen Sie Quell- und Zielkonto aus.",
    transferErrorSameAccount: "Quell- und Zielkonto müssen unterschiedlich sein.",
    transferErrorFailed: "Überweisung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    transferErrorUnexpected: "Unerwarteter Fehler bei der Verarbeitung der Überweisung.",
    transferSuccess: "Überweisung erfolgreich abgeschlossen.",
    
    // ====== User Transfer Form ======
    userTransferFromAccount: "Von Konto",
    userTransferRecipientEmail: "Empfänger E-Mail",
    userTransferOrPhone: "Oder Telefon",
    userTransferOrCPF: "Oder CPF",
    userTransferAmount: "Betrag",
    userTransferDescription: "Beschreibung",
    userTransferSendButton: "Geld senden",
    userTransferSendingButton: "Wird gesendet...",
    userTransferEmailPlaceholder: "benutzer@vinibank.dev",
    userTransferPhonePlaceholder: "+55 11 99999-9999",
    userTransferCPFPlaceholder: "123.456.789-00",
    userTransferAmountPlaceholder: "0.00",
    userTransferDescriptionPlaceholder: "z.B.: Pizza-Abendessen",
    userTransferErrorNoAccount: "Bitte wählen Sie ein Quellkonto aus.",
    userTransferErrorNoRecipient: "Bitte geben Sie E-Mail, Telefon oder CPF des Empfängers ein.",
    userTransferErrorNoDescription: "Bitte geben Sie eine Beschreibung ein.",
    
    budgetsDescription: "Verfolgen Sie Ausgaben gegen Ihre monatlichen Limits.",
    budgetsSaveButton: "Speichern",
    budgetsSavingButton: "Speichern…",
    budgetsIncomeLabel: "Einnahmen",
    budgetsExpensesLabel: "Ausgaben",
    budgetsMonthlyLimit: "monatliches Limit",
    budgetsErrorLoad: "Fehler beim Laden der Budgets",
    budgetsErrorSave: "Änderungen konnten nicht gespeichert werden",
    budgetsLoading: "Budgets werden geladen…",
    
    categoriesDescription: "Erstellen und organisieren Sie Ihre Ausgaben-/Einnahmenkategorien.",
    categoriesNamePlaceholder: "Kategoriename",
    categoriesKindExpense: "Ausgabe",
    categoriesKindIncome: "Einnahme",
    categoriesAddButton: "Hinzufügen",
    categoriesDeleteButton: "Löschen",
    categoriesDeleteConfirm: "Diese Kategorie löschen? Transaktionen werden unkategorisiert.",
    categoriesErrorLoad: "Fehler beim Laden der Kategorien",
    categoriesErrorAdd: "Kategorie konnte nicht hinzugefügt werden",
    categoriesErrorDelete: "Kategorie konnte nicht gelöscht werden",
    categoriesLoading: "Kategorien werden geladen…",
    
    insightsIncomeLabel: "Einnahmen (30T)",
    insightsExpensesLabel: "Ausgaben (30T)",
    insightsErrorLoad: "Fehler beim Laden der Einblicke",
    insightsLoading: "Einblicke werden geladen…",
    
    navDashboard: "Dashboard",
    navAdmin: "Admin",
    navLogin: "Anmelden",
    navGetStarted: "Loslegen",
    navSignOut: "Abmelden",

    // ====== Settings Page ======
    settingsLoading: "Einstellungen werden geladen…",
    settingsTitle: "Kontoeinstellungen",
    settingsSubtitle: "Verwalten Sie Ihre Profildaten.",
    settingsEmailLabel: "E-Mail",
    settingsNameLabel: "Name",
    settingsNamePlaceholder: "Ihr Anzeigename",
    settingsSaveChanges: "Änderungen speichern",
    settingsSaveFailed: "Speichern fehlgeschlagen",
    settingsSaved: "Gespeichert",

    // ====== Account & Transaction Types ======
    accountTypeChecking: "Girokonto",
    accountTypeSavings: "Sparkonto",
    accountTypeCredit: "Kredit",
    transactionKindDebit: "Lastschrift",
    transactionKindCredit: "Gutschrift",
    transactionKindTransfer: "Überweisung",

    // ====== Tabs (Dashboard) ======
    tabsOverview: "Übersicht",
    tabsAccounts: "Konten",
    tabsTransfer: "Überweisen",
    tabsInsights: "Insights",
    tabsBudgets: "Budgets",
    tabsCategories: "Kategorien",
    tabsTransactions: "Transaktionen",

    // ====== Transactions Table ======
    txFilterType: "Art",
    txFilterAccount: "Konto",
    txFilterSearch: "Suchen",
    txFilterSearchPlaceholder: "Beschreibung oder Konto suchen",
    txFilterAll: "Alle",
    txFilterDateRange: "Zeitraum",
    txDateAll: "Gesamter Zeitraum",
    txDate7d: "Letzte 7 Tage",
    txDate30d: "Letzte 30 Tage",
    txDate90d: "Letzte 90 Tage",

    // ====== Insights ML ======
    insightsShowTrend: "Trend anzeigen",
    insightsTrendLabel: "Trend",
    insightsTrendUp: "Aufwärts",
    insightsTrendDown: "Abwärts",
    insightsTrendFlat: "Seitwärts",
    insightsProjected7dLabel: "Prognose 7 Tage",
    txSortBy: "Sortieren nach",
    txSortDate: "Datum",
    txSortAmount: "Betrag",
    txExportCSV: "CSV exportieren",
    txNoResults: "Keine passenden Transaktionen",

    // ====== Transfer Errors ======
    transferInsufficientFunds: "Unzureichende Mittel auf dem Quellkonto.",
  },
};

// All valid translation keys are the keys of the English dictionary.
export type TranslationKey = keyof typeof translations.en;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available, otherwise default to "en"
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vinibank-locale');
      return (saved === 'pt' || saved === 'en' || saved === 'es' || saved === 'de') ? saved : 'en';
    }
    return 'en';
  });

  // Wrapper to persist locale changes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vinibank-locale', newLocale);
      // Set cookie for server-side access
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    }
  };

  // `value` is memoized so React doesn't re-render every subscriber
  // unnecessarily when nothing changes except `locale`.
  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key: TranslationKey) => translations[locale][key],
    }),
    [locale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  // During Next.js Fast Refresh or edge SSR mismatch, the provider may not
  // be in place momentarily. Instead of throwing (which can crash pages),
  // return a safe fallback that uses English strings and no-op setter.
  if (!context) {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("useLanguage fallback: LanguageProvider not mounted yet. Using default 'en'.");
    }
    return {
      locale: "en",
      setLocale: () => {},
      t: (key: TranslationKey) => translations.en[key],
    };
  }

  return context;
}
