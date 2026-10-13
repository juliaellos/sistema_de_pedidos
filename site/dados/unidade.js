// Dados da unidade. Pra criar o site de outra franquia, trocar este arquivo (e o catálogo, se mudar).
window.UNIDADE = {
  nome: "Palhoça",
  nomeCompleto: "Bread King Palhoça",
  whatsapp: "5548988475389",            // só números, com DDI. Número de TESTE (decisão de 13/10/2026)
  whatsappFormatado: "(48) 98847-5389",
  endereco: "Av. Atílio Pedro Pagani, 1275",
  bairro: "Pagani",
  cidade: "Palhoça, SC",
  horario: "Todos os dias: 08h às 20h",   // provisório, confirmar com a franqueada
  // horários por dia da semana (0 = domingo). Vários intervalos por dia são permitidos. Vazio = fechado.
  horarios: { 0: ["08:00-20:00"], 1: ["08:00-20:00"], 2: ["08:00-20:00"], 3: ["08:00-20:00"], 4: ["08:00-20:00"], 5: ["08:00-20:00"], 6: ["08:00-20:00"] },
  razaoSocial: "BREAD KING PALHOÇA ALIMENTOS LTDA",   // provisório
  cnpj: "00.000.000/0001-00",                           // provisório
  pedidoMinimo: 20.00,
  avaliacao: null,                                      // ex.: 4.8 quando houver avaliações
  banner: "imagens/marca/banner-loja.jpg",              // trocar pela foto da loja/produtos (1180x250 ou proporção parecida)
  sobre: "A primeira padaria de supercongelados do Brasil. Pães, salgados, pizzas e confeitaria que você assa em casa e ficam perfeitos em minutos.",
  mapa: "https://www.google.com/maps/search/?api=1&query=Av.+At%C3%ADlio+Pedro+Pagani%2C+1275+-+Pagani%2C+Palho%C3%A7a+-+SC",
  instagram: "https://instagram.com/breadkingsp",
  email: "contato@breadking.com.br",
  fotoLoja: "imagens/marca/loja-palhoca.jpg", // se o arquivo não existir, o site mostra o logo no lugar
  textoEntrega: "Sim, fazemos entrega! Escolha seu bairro pra ver a taxa. O prazo a gente confirma pelo WhatsApp.",
  textoRetirada: "Retire na loja: " + "Av. Atílio Pedro Pagani, 1275 - Pagani, Palhoça - SC.",
  // Taxa de entrega por bairro de Palhoça. VALORES PROVISÓRIOS até a franqueada confirmar.
  taxasEntrega: [
    { bairro: "Pagani", taxa: 5.00 },
    { bairro: "Pedra Branca", taxa: 7.00 },
    { bairro: "Passa Vinte", taxa: 7.00 },
    { bairro: "Centro", taxa: 8.00 },
    { bairro: "Bela Vista", taxa: 8.00 },
    { bairro: "Ponte do Imaruim", taxa: 9.00 },
    { bairro: "Jardim Eldorado", taxa: 9.00 },
    { bairro: "Caminho Novo", taxa: 10.00 },
    { bairro: "Aririú", taxa: 10.00 },
    { bairro: "Brejaru", taxa: 10.00 },
    { bairro: "Madri", taxa: 10.00 },
    { bairro: "Jardim Coqueiros", taxa: 10.00 },
    { bairro: "Frei Damião", taxa: 10.00 },
    { bairro: "Barra do Aririú", taxa: 12.00 },
    { bairro: "Alto Aririú", taxa: 12.00 },
    { bairro: "Rio Grande", taxa: 12.00 },
    { bairro: "São Sebastião", taxa: 12.00 },
    { bairro: "Pachecos", taxa: 12.00 },
    { bairro: "Morretes", taxa: 15.00 },
    { bairro: "Praia de Fora", taxa: 15.00 },
    { bairro: "Albardão", taxa: 18.00 },
    { bairro: "Enseada de Brito", taxa: 18.00 },
    { bairro: "Pinheira", taxa: 25.00 },
    { bairro: "Guarda do Embaú", taxa: 30.00 }
  ],
  // Cupons válidos (desconto em %). Na Etapa 3 isso vai pro CRM.
  cupons: [
    { codigo: "BEMVINDO10", desconto: 10 },
    { codigo: "PALHOCA5", desconto: 5 }
  ],
  pagamento: {
    simulado: true,
    segundosPix: 4,                      // tempo até o Pix "cair"
    cartaoRecusado: "4000000000000002"   // número que simula recusa
  }
};
