// Registra o componente ANTES da cena ser renderizada
AFRAME.registerComponent('ar-event-listener', {
  init: function () {
    const scene = this.el;
    const status = document.querySelector("#status");
    const badge = document.querySelector("#badge");

    badge.addEventListener("pointerup", (event) => {
      event.preventDefault(); // Evita comportamentos duplos no mobile

      status.textContent = "Acessando câmera...";
      badge.textContent = "INICIANDO...";
      badge.disabled = true;

      scene.systems["mindar-image-system"].start();
    });

    // Escuta quando a câmera liga
    scene.addEventListener("arReady", () => {
      status.textContent = "Câmera pronta. Aponte para a imagem.";
      badge.textContent = "PROCURANDO ALVO";
      console.log("EVENTO: arReady disparado!"); // Para você ver no Eruda
    });

    // Escuta se houver erro
    scene.addEventListener("arError", () => {
      status.textContent = "Erro ao ligar a câmera.";
      badge.textContent = "ERRO";
      console.log("EVENTO: arError disparado!");
    });
  }
});

document.addEventListener(
  "DOMContentLoaded",
  () => {
    /* =========================================================
    1. REFERÊNCIAS À CENA DE RA
    ========================================================= */
    const scene =
      document.querySelector("#ar-scene");
    const target =
      document.querySelector("#target");
    const cameraElement =
      document.querySelector("#ar-camera");

    /* =========================================================
    2. REFERÊNCIAS À INTERFACE HTML
    ========================================================= */
    const status =
      document.querySelector("#status");
    const badge =
      document.querySelector("#badge");
    const panel =
      document.querySelector("#info-panel");
    const panelTitle =
      document.querySelector("#info-title");
    const panelText =
      document.querySelector("#info-text");
    const panelDetail =
      document.querySelector("#info-detail");
    const closeButton =
      document.querySelector("#close-panel");

    /*
    * Busca os quatro BOTÕES HTML.
    *
    * Se este resultado estiver vazio, significa que
    * index.html e app.js estão em versões incompatíveis.
    */
    const hotspots =
      Array.from(
        document.querySelectorAll(".hotspot")
      );

    /*
    * Guarda se o MindAR está rastreando o target.
    */
    let tracking =
      false;

    /* =========================================================
    3. BASE DE DADOS DIDÁTICA
    ========================================================= */
    const information = {


      placa: {
        title:
          "Cabeçote e placa",
        text:
          "A placa fixa a peça e o cabeçote fornece o movimento de rotação necessário ao torneamento.",
        detail:
          "A fixação correta é essencial para precisão e segurança."
      },
      torre: {
        title:
          "Torre de ferramentas",
        text:
          "A torre organiza as ferramentas de corte e permite selecionar a ferramenta necessária em cada etapa do programa CNC.",
        detail:
          "A indexação da torre pode integrar a sequência automática de usinagem."
      },
      comando: {
        title:
          "Painel de comando CNC",
        text:
          "O painel é a interface entre operador, programa CNC e sistema de controle da máquina.",
        detail:
          "Os dados apresentados nesta experiência são didáticos."
      },
      seguranca: {
        title:
          "Proteção e segurança",
        text:
          "Portas, proteções e intertravamentos ajudam a separar o operador da região de usinagem.",
        detail:
          "A Realidade Aumentada não substitui treinamento ou documentação do fabricante."
      }
    };

    /* =========================================================
    4. FUNÇÃO QUE ABRE O PAINEL
    ========================================================= */
    function showInformation(topicName) {
      const selected =
        information[topicName];

      /*
      * Proteção contra data-topic inexistente.
      */
      if (!selected) {
        return;
      }

      panelTitle.textContent =
        selected.title;
      panelText.textContent =


        selected.text;
      panelDetail.textContent =
        selected.detail;

      /*
      * Remove hidden e mostra o painel.
      */
      panel.classList.remove(
        "hidden"
      );
    }

    /* =========================================================
    5. FUNÇÃO QUE FECHA O PAINEL
    ========================================================= */
    function hideInformation() {
      panel.classList.add(
        "hidden"
      );
    }

    /* =========================================================
    6. EVENTOS DOS HOTSPOTS
    pointerup funciona com:
    - mouse;
    - toque;
    - caneta.
    Não dependemos mais do raycaster para o clique.
    ========================================================= */
    hotspots.forEach(
      (button) => {
        button.addEventListener(
          "pointerup",
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            const topicName =
              button.dataset.topic;

            showInformation(
              topicName
            );
          }
        );
      }
    );

    /* =========================================================
    
    Realidade Aumentada — Manual Interativo do Torno CNC | Roteiro do Aluno
    
    7. BOTÃO DE FECHAR
    ========================================================= */
    closeButton.addEventListener(
      "pointerup",
      (event) => {
        event.preventDefault();
        hideInformation();
      }
    );

    /* =========================================================
    8. MINDAR PRONTO
    ========================================================= */
    scene.addEventListener(
      "arReady",
      () => {
        status.textContent =
          "Câmera pronta. Aponte para a imagem do torno.";
        badge.textContent =
          "PROCURANDO ALVO";
      }
    );

    /* =========================================================
    9. ERRO AO INICIAR RA
    ========================================================= */
    scene.addEventListener(
      "arError",
      () => {
        status.textContent =
          "Não foi possível iniciar a câmera.";
        badge.textContent =
          "ERRO";
      }
    );

    /* =========================================================
    10. TARGET ENCONTRADO
    ========================================================= */
    target.addEventListener(
      "targetFound",
      () => {
        tracking =
          true;

        status.textContent =
          "Torno reconhecido. Toque em um ponto numerado.";
        badge.textContent =
          "● RA ATIVA";
        /*
        * Agora os botões podem aparecer.
        */
        hotspots.forEach(
          (button) => {
            button.classList.add(
              "visible"
            );
          }
        );
      }
    );

    /* =========================================================
    11. TARGET PERDIDO
    ========================================================= */
    target.addEventListener(
      "targetLost",
      () => {
        tracking =
          false;

        status.textContent =
          "Alvo perdido. Aponte novamente para a imagem.";
        badge.textContent =
          "PROCURANDO ALVO";

        hotspots.forEach(
          (button) => {
            button.classList.remove(
              "visible"
            );
          }
        );

        hideInformation();
      }
    );

    /* =========================================================
    12. CONVERTER POSIÇÃO 3D EM POSIÇÃO 2D
    Cada botão possui:
    data-x
    data-y
    data-z
    Essas coordenadas representam um ponto local no target.
    O processo é:
    posição local
    ↓
    posição no mundo 3D
    
    Realidade Aumentada — Manual Interativo do Torno CNC | Roteiro do Aluno
    
    ↓
    projeção pela câmera
    ↓
    pixels da tela
    ========================================================= */
    function updateHotspotPositions() {
      /*
      * Agenda a próxima atualização.
      */
      requestAnimationFrame(
        updateHotspotPositions
      );

      /*
      * Não precisamos calcular nada
      * enquanto o target não estiver ativo.
      */
      if (!tracking) {
        return;
      }

      /*
      * Obtém a câmera Three.js interna do A-Frame.
      */
      const camera =
        cameraElement.getObject3D(
          "camera"
        );

      /*
      * Aguarda a inicialização completa.
      */
      if (
        !camera ||
        !target.object3D
      ) {
        return;
      }

      /*
      * Atualiza as matrizes antes do cálculo.
      */
      target.object3D.updateMatrixWorld(
        true
      );
      camera.updateMatrixWorld(
        true
      );

      /*
      * Recalcula a posição de cada botão.
      */
      hotspots.forEach(
        (button) => {
          /*
          * Cria o ponto local relativo ao target.
          */
          const localPoint =
            new THREE.Vector3(
              Number(button.dataset.x),
              Number(button.dataset.y),
              Number(button.dataset.z)
            );


          /*
          * Converte de coordenadas locais
          * para coordenadas do mundo 3D.
          */
          const worldPoint =
            target.object3D.localToWorld(
              localPoint
            );

          /*
          * Projeta o ponto usando a câmera.
          */
          const projectedPoint =
            worldPoint
              .clone()
              .project(camera);

          /*
          * Converte -1..+1 para pixels.
          */
          const screenX =
            (
              projectedPoint.x * 0.5 +
              0.5
            ) *
            window.innerWidth;

          const screenY =
            (
              -projectedPoint.y * 0.5 +
              0.5
            ) *
            window.innerHeight;

          /*
          * Posiciona o botão HTML.
          */
          button.style.left =
            `${screenX}px`;
          button.style.top =
            `${screenY}px`;

          /*
          * Evita exibir botões fora da área útil.
          */
          const insideScreen =
            projectedPoint.z > -1 &&
            projectedPoint.z < 1 &&
            screenX > -80 &&
            screenX < window.innerWidth + 80 &&
            screenY > -80 &&
            screenY < window.innerHeight + 80;

          button.style.visibility =
            insideScreen
              ? "visible"
              : "hidden";
        }
      );
    }

    /* =========================================================
    13. INICIA A ATUALIZAÇÃO DOS HOTSPOTS
    ========================================================= */

    updateHotspotPositions();
  }
);
