import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { AnimationMixer, Clock, Box3, Vector3 } from 'three';

const clock = new Clock();
const mixers = [];
const npcCharacters = [];

// configurar DRACO (opcional)
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

function spawnCharacter(modelUrl, position = new Vector3(), scale = 1) {
  gltfLoader.load(modelUrl, (gltf) => {
    const model = gltf.scene;
    model.scale.setScalar(scale);
    model.position.copy(position);
    model.traverse((c) => { c.castShadow = true; c.receiveShadow = true; });

    scene.add(model);

    const mixer = new AnimationMixer(model);
    mixers.push(mixer);

    // escolher animação padrão (se existir)
    const clips = gltf.animations;
    if (clips.length) {
      const idle = mixer.clipAction(clips[0]).play();
      // se houver walk/shoot, você pode mapear por nome
      // const walk = mixer.clipAction(clips.find(c=>c.name.includes('Walk')));
    }

    // criar hitbox aproximada
    const box = new Box3().setFromObject(model);
    const size = new Vector3();
    box.getSize(size);
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.copy(box.getCenter(new Vector3()));
    scene.add(hitbox);

    npcCharacters.push({ model, mixer, hitbox, speed: 0.05 + Math.random()*0.05 });
  });
}

// exemplo: spawn inicial (substitua MODEL_URL)
const MODEL_URL = 'https://your-host.com/character.glb';
for (let i=0;i<6;i++){
  const angle = Math.random()*Math.PI*2;
  const dist = 20 + Math.random()*20;
  spawnCharacter(MODEL_URL, new Vector3(Math.cos(angle)*dist, 0, Math.sin(angle)*dist), 1);
}

// no loop de animação
function animate(){
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixers.forEach(m => m.update(delta));

  if (controls.isLocked) {
    npcCharacters.forEach(npc => {
      // mover em direção ao jogador
      const dir = new Vector3().subVectors(camera.position, npc.model.position).setY(0).normalize();
      npc.model.position.addScaledVector(dir, npc.speed);
      npc.hitbox.position.copy(npc.model.position).y += 1;

      // colisão com jogador
      if (npc.model.position.distanceTo(camera.position) < 1.8) {
        // dano visual
      }
    });
  }
  renderer.render(scene, camera);
}
