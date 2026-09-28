/**
 * Aguarda o carregamento completo do DOM (HTML) 
 * para garantir que todos os elementos existam antes do script rodar.
 */
document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================================================
       1. SELEÇÃO DE ELEMENTOS DO HTML (DOM)
       ========================================================================== */
    
    // Seleciona os elementos principais da cena de Realidade Aumentada (MindAR/A-Frame)
    const scene = document.querySelector("#ar-scene");
    const target = document.querySelector("#target");
    const cameraElement = document.querySelector("#ar-camera");

    // Seleciona os elementos do HUD (Interface de texto superior)
    const status = document.querySelector("#status");
    const badge = document.querySelector("#badge");

    // Seleciona o painel flutuante de informações e seus textos internos
    const panel = document.querySelector("#info-panel");
    const panelTitle = document.querySelector("#info-title");
    const panelText = document.querySelector("#info-text");
    const panelDetail = document.querySelector("#info-detail");
    const closeButton = document.querySelector("#close-panel");

    // Cria uma lista (Array) com todos os botões de pontos de interesse (hotspots)
    const hotspots = Array.from(document.querySelectorAll(".hotspot"));

    /* ==========================================================================
       2. CONTROLE DE ESTADO E BANCO DE DADOS LOCAL
       ========================================================================== */

    /**
     * Estado do rastreamento do alvo.
     * false: O alvo (imagem do torno) NÃO está sendo rastreado.
     * true: O alvo (imagem do torno) ESTÁ sendo rastreado.
     */
    let tracking = false;

    /**
     * Objeto contendo os textos explicativos de cada componente do torno.
     */
    const information = {
        placa: {
            title: "Cabeçote e placa",
            text: "A placa fixa a peça e o cabeçote fornece o movimento de rotação necessário ao torneamento.",
            detail: "A fixação correta é essencial para precisão e segurança."
        },
        torre: {
            title: "Torre de ferramentas",
            text: "A torre organiza as ferramentas de corte e permite selecionar a ferramenta necessária em cada etapa do programa CNC.",
            detail: "A indexação da torre pode integrar a sequência automática de usinagem."
        },
        comando: {
            title: "Painel de comando CNC",
            text: "O painel é a interface entre operador, programa CNC e sistema de controle da máquina.",
            detail: "Os dados apresentados nesta experiência são didáticos."
        },
        seguranca: {
            title: "Proteção e segurança",
            text: "Portas, proteções e intertravamentos ajudam a separar o operador da região de usinagem.",
            detail: "A Realidade Aumentada não substitui treinamento ou documentação do fabricante."
        }
    };

    /* ==========================================================================
       3. FUNÇÕES DE MANIPULAÇÃO DA INTERFACE (UI)
       ========================================================================== */

    /**
     * Altera o conteúdo do painel com base no tópico selecionado e o exibe na tela.
     */
    function showInformation(topicName) {
        const selected = information[topicName];

        if (!selected) {
            return;
        }

        panelTitle.textContent = selected.title;
        panelText.textContent = selected.text;
        panelDetail.textContent = selected.detail;
        panel.classList.remove("hidden");
    }

    /**
     * Oculta o painel de informações da tela adicionando a classe utilitária.
     */
    function hideInformation() {
        panel.classList.add("hidden");
    }

    /* ==========================================================================
       4. ADICIONANDO EVENTOS DE CLIQUE / TOQUE (INTERAÇÃO DO USUÁRIO)
       ========================================================================== */

    hotspots.forEach((button) => {
        button.addEventListener("pointerup", (event) => {
            event.preventDefault();  
            event.stopPropagation();  

            const topicName = button.dataset.topic;
            showInformation(topicName);
        });
    });

    closeButton.addEventListener("pointerup", (event) => {
        event.preventDefault();
        hideInformation();
    });

    /* ==========================================================================
       5. EVENTOS DO MINDAR (REALIDADE AUMENTADA)
       ========================================================================== */

    scene.addEventListener("arReady", () => {
        status.textContent = "Câmera pronta. Aponte para a imagem do torno.";
        badge.textContent = "PROCURANDO ALVO";
    });

    scene.addEventListener("arError", () => {
        status.textContent = "Não foi possível iniciar a câmera.";
        badge.textContent = "ERRO";
    });

    target.addEventListener("targetFound", () => {
        tracking = true;
        status.textContent = "Torno reconhecido. Toque em um ponto numerado.";
        badge.textContent = "● RA ATIVA";

        hotspots.forEach((button) => {
            button.classList.add("visible");
        });
    });

    target.addEventListener("targetLost", () => {
        tracking = false;
        status.textContent = "Alvo perdido. Aponte novamente para a imagem.";
        badge.textContent = "PROCURANDO ALVO";

        hotspots.forEach((button) => {
            button.classList.remove("visible");
        });

        hideInformation();
    });

    /* ==========================================================================
       6. SISTEMA DE PROJEÇÃO E POSICIONAMENTO 3D PARA 2D (NOVO)
       ========================================================================== */

    /**
     * Converte as coordenadas 3D do alvo de RA em posições de pixels (2D) na tela do celular,
     * fazendo com que os botões HTML "sigam" perfeitamente o movimento do torno físico.
     */
    function updateHotspotPositions() {
        // Agenda a execução desta mesma função para o próximo quadro da tela (loop contínuo)
        requestAnimationFrame(updateHotspotPositions);

        // Se o sistema perdeu o rastreamento do alvo, interrompe os cálculos neste frame
        if (!tracking) {
            return;
        }

        // Obtém o objeto de câmera nativo do framework 3D (Three.js)
        const camera = cameraElement.getObject3D("camera");

        // Valida se a câmera e o motor 3D do alvo já estão carregados na memória
        if (!camera || !target.object3D) {
            return;
        }

        // Força a atualização das matrizes do mundo 3D para garantir precisão posicional instantânea
        target.object3D.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);

        // Varre cada um dos botões do HTML para calcular sua nova posição na tela
        hotspots.forEach((button) => {
            
            // 1. Cria um vetor 3D local usando as propriedades data-x, data-y e data-z do botão
            const localPoint = new THREE.Vector3(
                Number(button.dataset.x),
                Number(button.dataset.y),
                Number(button.dataset.z)
            );

            // 2. Converte essa coordenada local do alvo para a posição global do mundo 3D
            const worldPoint = target.object3D.localToWorld(localPoint);

            // 3. Projeta essa posição tridimensional na lente bidimensional (2D) da câmera virtual
            const projectedPoint = worldPoint.clone().project(camera);

            // 4. Converte o resultado de coordenadas matemáticas (-1 a 1) para pixels reais da tela
            const screenX = (projectedPoint.x * 0.5 + 0.5) * window.innerWidth;
            const screenY = (-projectedPoint.y * 0.5 + 0.5) * window.innerHeight;

            // 5. Aplica os pixels calculados diretamente no estilo CSS do botão
            button.style.left = `${screenX}px`;
            button.style.top = `${screenY}px`;

            // 6. Verifica se o ponto projetado está visível dentro do campo de visão da tela
            const insideScreen =
                projectedPoint.z > -1 &&
                projectedPoint.z < 1 &&
                screenX > -80 &&
                screenX < window.innerWidth + 80 &&
                screenY > -80 &&
                screenY < window.innerHeight + 80;

            // Se o ponto sair totalmente da tela, esconde o botão; caso contrário, exibe-o
            if (insideScreen) {
                button.classList.add("visible");
            } else {
                button.classList.remove("visible");
            }
        });
    }

    // Inicializa o loop de posicionamento dos hotspots assim que o app começa
    updateHotspotPositions();

});
