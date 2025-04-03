// Simulador de Direção Manual - Código conceitual
class SimuladorDirecaoManual {
  constructor() {
    this.motorLigado = false;
    this.embreagem = 0; // 0 = solta, 1 = totalmente pressionada
    this.marcha = 0; // 0 = neutro, 1-5 = marchas, -1 = ré
    this.acelerador = 0; // 0-1, representando a pressão no pedal
    this.freio = 0; // 0-1, representando a pressão no pedal
    this.velocidade = 0; // km/h
    this.rotacaoMotor = 0; // RPM
    this.posicao = 0; // metros percorridos
    this.status = "parado";
  }

  // Ligar ou desligar o motor
  trocarMotor() {
    if (!this.motorLigado && this.marcha === 0) {
      this.motorLigado = true;
      this.rotacaoMotor = 800; // RPM em marcha lenta
      this.status = "motor ligado, em ponto morto";
      return "Motor ligado";
    } else if (this.motorLigado) {
      this.motorLigado = false;
      this.rotacaoMotor = 0;
      this.status = "parado";
      return "Motor desligado";
    } else {
      return "Para ligar o motor, coloque em ponto morto primeiro";
    }
  }

  // Pressionar ou soltar a embreagem
  controlarEmbreagem(valor) {
    if (valor < 0) valor = 0;
    if (valor > 1) valor = 1;
    this.embreagem = valor;
    
    // Se soltar a embreagem muito rápido com o carro em marcha e pouco acelerador, o motor morre
    if (this.embreagem < 0.2 && this.motorLigado && this.marcha !== 0 && this.acelerador < 0.2 && this.velocidade < 5) {
      this.motorLigado = false;
      this.rotacaoMotor = 0;
      this.status = "motor morreu";
      return "Motor morreu! Soltar a embreagem muito rápido sem acelerar faz o motor morrer.";
    }
    
    this.atualizarRotacaoMotor();
    return `Embreagem ${Math.round(valor * 100)}%`;
  }

  // Trocar de marcha
  trocarMarcha(novaMarcha) {
    if (!this.motorLigado) {
      return "Ligue o motor primeiro";
    }
    
    if (novaMarcha < -1 || novaMarcha > 5) {
      return "Marcha inválida. Use valores de -1 (ré) a 5";
    }
    
    if (this.embreagem < 0.8) {
      return "Pressione a embreagem completamente antes de trocar de marcha";
    }
    
    this.marcha = novaMarcha;
    let nomesMarcha = {"-1": "ré", "0": "ponto morto", "1": "primeira", "2": "segunda", "3": "terceira", "4": "quarta", "5": "quinta"};
    this.status = `em ${nomesMarcha[novaMarcha]} marcha`;
    
    this.atualizarRotacaoMotor();
    return `Mudou para ${nomesMarcha[novaMarcha]} marcha`;
  }

  // Controlar o pedal do acelerador
  controlarAcelerador(valor) {
    if (valor < 0) valor = 0;
    if (valor > 1) valor = 1;
    
    this.acelerador = valor;
    this.atualizarRotacaoMotor();
    this.atualizarVelocidade();
    
    return `Acelerador ${Math.round(valor * 100)}%`;
  }

  // Controlar o pedal do freio
  controlarFreio(valor) {
    if (valor < 0) valor = 0;
    if (valor > 1) valor = 1;
    
    this.freio = valor;
    this.atualizarVelocidade();
    
    return `Freio ${Math.round(valor * 100)}%`;
  }

  // Atualizar a rotação do motor com base nas condições atuais
  atualizarRotacaoMotor() {
    if (!this.motorLigado) {
      this.rotacaoMotor = 0;
      return;
    }
    
    if (this.marcha === 0 || this.embreagem > 0.8) {
      // Em ponto morto ou com embreagem pressionada, a rotação depende apenas do acelerador
      this.rotacaoMotor = 800 + (this.acelerador * 6200);
    } else {
      // Em marcha, a rotação depende da velocidade, marcha e acelerador
      const fatorMarcha = this.marcha === -1 ? 0.9 : (6 - this.marcha) / 2.5;
      const rotacaoPelaVelocidade = this.velocidade * fatorMarcha * 50;
      const impactoAcelerador = this.acelerador * (1 - this.embreagem) * 3000;
      
      this.rotacaoMotor = 800 + rotacaoPelaVelocidade + impactoAcelerador;
      
      // Limite de rotação
      if (this.rotacaoMotor > 7000) this.rotacaoMotor = 7000;
    }
  }

  // Atualizar a velocidade do veículo
  atualizarVelocidade() {
    if (!this.motorLigado) {
      this.velocidade = Math.max(0, this.velocidade - 0.5); // Desaceleração natural quando o motor está desligado
      return;
    }
    
    // Cálculo da força de propulsão
    let propulsao = 0;
    if (this.marcha !== 0) {
      const eficienciaEmbreagem = 1 - this.embreagem;
      const fatorMarcha = this.marcha === -1 ? -1 : this.marcha;
      propulsao = this.acelerador * eficienciaEmbreagem * (this.rotacaoMotor / 1000) / Math.abs(fatorMarcha);
    }
    
    // Força de frenagem
    const frenagem = this.freio * 10;
    
    // Atrito e resistência do ar (aumenta com a velocidade)
    const resistencia = 0.05 + (this.velocidade * 0.01);
    
    // Cálculo da aceleração líquida
    const aceleracaoLiquida = propulsao - frenagem - resistencia;
    
    // Atualização da velocidade
    this.velocidade += aceleracaoLiquida;
    if (this.velocidade < 0) this.velocidade = 0;
    
    // Atualização da posição
    this.posicao += this.velocidade / 3600; // Converter km/h para km/s e depois para metros
  }

  // Simular um ciclo de atualização do jogo
  atualizar(deltaTime = 1) {
    if (this.motorLigado) {
      this.atualizarRotacaoMotor();
    }
    this.atualizarVelocidade();
    
    // Verificar se a rotação está muito baixa e o carro está em movimento
    if (this.motorLigado && this.rotacaoMotor < 500 && this.marcha !== 0) {
      this.motorLigado = false;
      this.rotacaoMotor = 0;
      this.status = "motor morreu";
      return "Motor morreu! Rotação muito baixa.";
    }
    
    // Verificar se a rotação está muito alta
    if (this.rotacaoMotor > 6500) {
      return "ATENÇÃO! Rotação muito alta, troque para uma marcha superior.";
    }
    
    return this.obterEstadoAtual();
  }

  // Obter informações sobre o estado atual do veículo
  obterEstadoAtual() {
    return {
      motorLigado: this.motorLigado,
      embreagem: Math.round(this.embreagem * 100) + "%",
      marcha: this.marcha === -1 ? "Ré" : (this.marcha === 0 ? "N" : this.marcha),
      acelerador: Math.round(this.acelerador * 100) + "%",
      freio: Math.round(this.freio * 100) + "%",
      velocidade: Math.round(this.velocidade * 10) / 10 + " km/h",
      rotacaoMotor: Math.round(this.rotacaoMotor) + " RPM",
      posicao: Math.round(this.posicao * 10) / 10 + " m",
      status: this.status
    };
  }

  // Executa uma lição específica para aprendizado
  executarLicao(numeroLicao) {
    const licoes = [
      {
        id: 1,
        titulo: "Iniciando o veículo",
        descricao: "Aprenda a sequência correta para iniciar o veículo com segurança.",
        passos: [
          "Verifique se a marcha está em ponto morto (N)",
          "Pressione completamente o pedal da embreagem",
          "Ligue o motor",
          "Mantenha a embreagem pressionada enquanto seleciona a primeira marcha",
          "Solte lentamente a embreagem enquanto pressiona levemente o acelerador"
        ]
      },
      {
        id: 2,
        titulo: "Troca de marchas",
        descricao: "Aprenda quando e como trocar de marchas corretamente.",
        passos: [
          "Pressione completamente o pedal da embreagem",
          "Solte o acelerador",
          "Selecione a próxima marcha",
          "Solte lentamente a embreagem",
          "Acelere suavemente para atingir a velocidade desejada"
        ],
        dicas: [
          "1ª marcha: 0-20 km/h",
          "2ª marcha: 20-40 km/h",
          "3ª marcha: 40-60 km/h",
          "4ª marcha: 60-80 km/h",
          "5ª marcha: acima de 80 km/h"
        ]
      },
      {
        id: 3,
        titulo: "Parada e estacionamento",
        descricao: "Aprenda a parar o veículo com segurança e estacioná-lo corretamente.",
        passos: [
          "Reduza a velocidade usando o freio",
          "Pressione a embreagem quando a rotação começar a cair",
          "Reduza para uma marcha mais baixa se necessário",
          "Para parar completamente, mantenha o freio e a embreagem pressionados",
          "Coloque em ponto morto e solte a embreagem",
          "Acione o freio de mão antes de desligar o motor"
        ]
      }
    ];
    
    const licao = licoes.find(l => l.id === numeroLicao);
    if (!licao) {
      return {
        erro: "Lição não encontrada",
        licoesDisponiveis: licoes.map(l => ({id: l.id, titulo: l.titulo}))
      };
    }
    
    return licao;
  }
}

// Interface de usuário (conceitual)
class InterfaceUsuario {
  constructor(simulador) {
    this.simulador = simulador;
    this.modoPratica = false;
    this.modoLicao = false;
    this.licaoAtual = null;
  }

  iniciarSimulacao() {
    console.log("Bem-vindo ao Simulador de Direção Manual!");
    this.exibirControles();
    this.atualizarTela();
    
    // Em uma implementação real, aqui teríamos:
    // - Listeners para controles de teclado/gamepad
    // - Loop de renderização
    // - Atualização do painel de instrumentos
  }

  exibirControles() {
    console.log(`
    CONTROLES:
    - ESPAÇO: Ligar/Desligar motor
    - W/S: Aumentar/Diminuir acelerador
    - A/D: Pressionar/Soltar embreagem
    - E/Q: Aumentar/Diminuir marcha
    - BARRA DE ESPAÇO: Freio
    - L: Selecionar lição
    - P: Modo prática livre
    - ESC: Menu principal
    `);
  }

  atualizarTela() {
    const estadoAtual = this.simulador.obterEstadoAtual();
    console.log(`
    ===== PAINEL DE INSTRUMENTOS =====
    Motor: ${estadoAtual.motorLigado ? "Ligado" : "Desligado"}
    Marcha: ${estadoAtual.marcha}
    Velocidade: ${estadoAtual.velocidade}
    Rotação: ${estadoAtual.rotacaoMotor}
    
    Embreagem: ${estadoAtual.embreagem}
    Acelerador: ${estadoAtual.acelerador}
    Freio: ${estadoAtual.freio}
    
    Status: ${estadoAtual.status}
    ================================
    `);
    
    if (this.modoLicao && this.licaoAtual) {
      this.exibirLicao();
    }
  }

  exibirLicao() {
    console.log(`
    === LIÇÃO ${this.licaoAtual.id}: ${this.licaoAtual.titulo} ===
    ${this.licaoAtual.descricao}
    
    PASSOS:
    ${this.licaoAtual.passos.map((passo, idx) => `${idx+1}. ${passo}`).join('\n')}
    
    ${this.licaoAtual.dicas ? `DICAS:\n${this.licaoAtual.dicas.join('\n')}` : ''}
    `);
  }

  selecionarLicao(numeroLicao) {
    this.licaoAtual = this.simulador.executarLicao(numeroLicao);
    if (this.licaoAtual.erro) {
      console.log(`Erro: ${this.licaoAtual.erro}`);
      console.log("Lições disponíveis:");
      this.licaoAtual.licoesDisponiveis.forEach(l => console.log(`${l.id}. ${l.titulo}`));
      this.licaoAtual = null;
      return false;
    }
    
    this.modoLicao = true;
    this.modoPratica = false;
    this.exibirLicao();
    return true;
  }

  iniciarModoPratica() {
    this.modoLicao = false;
    this.modoPratica = true;
    console.log(`
    === MODO PRÁTICA LIVRE ===
    Pratique livremente as habilidades de direção manual.
    Utilize os controles para operar o veículo.
    
    Dica: Comece ligando o motor (ESPAÇO), pressione a embreagem (A),
    coloque na primeira marcha (E) e solte a embreagem lentamente (D)
    enquanto pressiona levemente o acelerador (W).
    `);
  }
}

// Inicialização da aplicação
function iniciarAplicativo() {
  const simulador = new SimuladorDirecaoManual();
  const interface = new InterfaceUsuario(simulador);
  interface.iniciarSimulacao();
  
  // Loop de simulação (conceitual)
  /*
  function loop() {
    simulador.atualizar();
    interface.atualizarTela();
    requestAnimationFrame(loop);
  }
  loop();
  */
}

// Exemplo de como o software seria utilizado
// iniciarAplicativo();
