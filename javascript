<script type="module">
    import * as THREE from 'https://cdn.skypack.dev/three@0.136.0/build/three.module.js';
    import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/PointerLockControls.js';

    // --- Configurações Básicas ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 10, 50);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Luzes
    const light = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2);
    scene.add(light);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(5, 10, 5);
    sun.castShadow = true;
    scene.add(sun);

    // Chão
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshStandardMaterial({ color: 0xeeeeee })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    scene.add(new THREE.GridHelper(100, 40, 0xcccccc, 0xdddddd));

    // --- ARMA DE BRINQUEDO ---
    const toyGun = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.6), new THREE.MeshStandardMaterial({ color: 0x2196F3 }));
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0xFF9800 }));
    tip.rotation.x = Math.PI / 2; tip.position.z = -0.35;
    const detail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.2), new THREE.MeshStandardMaterial({ color: 0xFFEB3B }));
    detail.position.y = -0.15; detail.position.z = -0.05;
    toyGun.add(body, tip, detail);
    toyGun.position.set(0.4, -0.4, -0.6);
    camera.add(toyGun);
    scene.add(camera);

    // --- LÓGICA DOS NPCs (MOVIMENTO) ---
    const targets = [];
    let baseSpeed = 0.03; // Velocidade inicial

    function spawnTarget() {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1.6, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xff4444 })
        );
        
        // Spawn em um círculo distante
        const angle = Math.random() * Math.PI * 2;
        const dist = 20 + Math.random() * 10;
        mesh.position.set(Math.cos(angle) * dist, 0.8, Math.sin(angle) * dist);
        mesh.castShadow = true;
        
        scene.add(mesh);
        targets.push({
            mesh: mesh,
            speed: baseSpeed + (Math.random() * 0.02) // Velocidades variadas
        });
    }

    for(let i=0; i<6; i++) spawnTarget();

    // --- Controles e UI ---
    const controls = new PointerLockControls(camera, document.body);
    const startBtn = document.getElementById('startBtn');
    const scoreEl = document.getElementById('score');
    let score = 0;

    startBtn.addEventListener('click', () => controls.lock());
    controls.addEventListener('lock', () => document.getElementById('instructions').style.display = 'none');
    controls.addEventListener('unlock', () => document.getElementById('instructions').style.display = 'flex');

    window.addEventListener('mousedown', () => {
        if(!controls.isLocked) return;

        toyGun.position.z = -0.5;
        setTimeout(() => toyGun.position.z = -0.6, 50);

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
        
        // Extrair apenas os meshes para o raycaster
        const targetMeshes = targets.map(t => t.mesh);
        const intersects = raycaster.intersectObjects(targetMeshes);

        if(intersects.length > 0) {
            const hitMesh = intersects[0].object;
            const targetIndex = targets.findIndex(t => t.mesh === hitMesh);
            
            if(targetIndex > -1) {
                scene.remove(hitMesh);
                targets.splice(targetIndex, 1);
                score++;
                scoreEl.innerText = score;
                baseSpeed += 0.002; // Fica mais difícil
                spawnTarget();
            }
        }
    });

    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.code] = true);
    document.addEventListener('keyup', (e) => keys[e.code] = false);

    function animate() {
        requestAnimationFrame(animate);
        
        if(controls.isLocked) {
            // Movimento do Jogador
            if(keys['KeyW']) controls.moveForward(0.1);
            if(keys['KeyS']) controls.moveForward(-0.1);
            if(keys['KeyA']) controls.moveRight(-0.1);
            if(keys['KeyD']) controls.moveRight(0.1);

            // Animação da Arma
            const time = Date.now() * 0.005;
            if(keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']) {
                toyGun.position.y = -0.4 + Math.sin(time * 2) * 0.01;
            }

            // ATUALIZAÇÃO DOS NPCs
            targets.forEach((target, index) => {
                const npc = target.mesh;
                
                // 1. Fazer o NPC olhar para o jogador
                npc.lookAt(camera.position.x, 0.8, camera.position.z);
                
                // 2. Calcular direção para o jogador
                const direction = new THREE.Vector3();
                direction.subVectors(camera.position, npc.position).normalize();
                
                // 3. Mover NPC em direção ao jogador
                npc.position.x += direction.x * target.speed;
                npc.position.z += direction.z * target.speed;

                // 4. Checar colisão (se o NPC te pegar)
                const dist = npc.position.distanceTo(camera.position);
                if(dist < 1.2) {
                    controls.unlock();
                    alert("Você foi pego! Pontuação: " + score);
                    location.reload(); // Reinicia o jogo
                }
            });
        }
        
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
</script>
