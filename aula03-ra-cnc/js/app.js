document.addEventListener("DOMContentLoaded", () => {
    const scene = document.querySelector("#ar-scene");
    const target = document.querySelector("#target");
    const cameraElement = document.querySelector("#ar-camera");

    const status = document.querySelector("#status");
    const badge = document.querySelector("#badge");

    const panel = document.querySelector("#info-panel");
    const panelTitle = document.querySelector("#info-title");
    const panelText = document.querySelector("#info-text");
    const panelDetail = document.querySelector("#info-detail");
    const closeButton = document.querySelector("#close-panel");

    const hotspots = Array.from(document.querySelectorAll(".hotspot"));

    if (
        !scene ||
        !target ||
        !cameraElement ||
        !status ||
        !badge ||
        !panel ||
        !panelTitle ||
        !panelText ||
        !panelDetail ||
        !closeButton
    ) {
        console.error("Elementos necessários da aplicação não foram encontrados.");
        return;
    }

    let tracking = false;
    let lastUpdate = 0;

    const UPDATE_INTERVAL = 1000 / 30;

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

    const hotspotData = hotspots.map((button) => ({
        button,
        x: Number(button.dataset.x),
        y: Number(button.dataset.y),
        z: Number(button.dataset.z),
        vector: new THREE.Vector3(),
        worldPoint: new THREE.Vector3()
    }));

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

    function hideInformation() {
        panel.classList.add("hidden");
    }

    function setHotspotsVisible(visible) {
        hotspots.forEach((button) => {
            if (visible) {
                button.classList.add("visible");
            } else {
                button.classList.remove("visible");
            }
        });
    }

    hotspots.forEach((button) => {
        button.addEventListener("pointerup", (event) => {
            event.preventDefault();
            event.stopPropagation();

            showInformation(button.dataset.topic);
        });
    });

    closeButton.addEventListener("pointerup", (event) => {
        event.preventDefault();
        event.stopPropagation();

        hideInformation();
    });

    scene.addEventListener("arReady", () => {
        status.textContent = "Câmera pronta. Aponte para a imagem do torno.";
        badge.textContent = "PROCURANDO ALVO";
    });

    scene.addEventListener("arError", () => {
        status.textContent = "Não foi possível iniciar a câmera.";
        badge.textContent = "ERRO";

        tracking = false;
        setHotspotsVisible(false);
        hideInformation();
    });

    target.addEventListener("targetFound", () => {
        tracking = true;

        status.textContent = "Torno reconhecido. Toque em um ponto numerado.";
        badge.textContent = "● RA ATIVA";

        setHotspotsVisible(true);
    });

    target.addEventListener("targetLost", () => {
        tracking = false;

        status.textContent = "Alvo perdido. Aponte novamente para a imagem.";
        badge.textContent = "PROCURANDO ALVO";

        setHotspotsVisible(false);
        hideInformation();
    });

    function updateHotspotPositions(timestamp) {
        requestAnimationFrame(updateHotspotPositions);

        if (!tracking) {
            return;
        }

        if (timestamp - lastUpdate < UPDATE_INTERVAL) {
            return;
        }

        lastUpdate = timestamp;

        const camera = cameraElement.getObject3D("camera");

        if (!camera || !target.object3D) {
            return;
        }

        target.object3D.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);

        hotspotData.forEach((item) => {
            const localPoint = item.vector.set(
                item.x,
                item.y,
                item.z
            );

            const worldPoint = item.worldPoint.copy(localPoint);

            target.object3D.localToWorld(worldPoint);

            worldPoint.project(camera);

            const screenX =
                (worldPoint.x * 0.5 + 0.5) * window.innerWidth;

            const screenY =
                (-worldPoint.y * 0.5 + 0.5) * window.innerHeight;

            item.button.style.left = `${screenX}px`;
            item.button.style.top = `${screenY}px`;

            const insideScreen =
                worldPoint.z > -1 &&
                worldPoint.z < 1 &&
                screenX > -80 &&
                screenX < window.innerWidth + 80 &&
                screenY > -80 &&
                screenY < window.innerHeight + 80;

            if (insideScreen) {
                item.button.classList.add("visible");
            } else {
                item.button.classList.remove("visible");
            }
        });
    }

    requestAnimationFrame(updateHotspotPositions);
});
