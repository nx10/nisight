import * as THREE from "three";
import CameraControls from "camera-controls";
import Stats from "stats.js";
import colormap from "colormap";

export type SurfaceDataMesh = {vertices: ArrayBufferLike, faces: ArrayBufferLike};
export type SurfaceDataMap = ArrayBufferLike;

function minMax(arr: number[] | ArrayLike<number>) {
    if (arr.length === 0) {
        return undefined;
    }
    let max = arr[0];
    let min = arr[0];
    for (let i = 0; i < arr.length; i++) {
        if (max < arr[i]) {
            max = arr[i];
        }
        if (min > arr[i]) {
            min = arr[i];
        }
    }
    return [min, max];
}

function vertexShader() {
    return `
        attribute vec3 color;
        varying vec3 vColor;
    
        void main() {
            vColor = color;

            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition; 
        }
    `;
}

function fragmentShader() {
    return `
        varying vec3 vColor;

        float colormap_red(float x) {
            if (x < 1.0 / 3.0) {
                return 4.0 * x - 2.992156863;
            } else if (x < 2.0 / 3.0) {
                return 4.0 * x - 2.9882352941;
            } else if (x < 2.9843137255 / 3.0) {
                return 4.0 * x - 2.9843137255;
            } else {
                return x;
            }
        }
        
        float colormap_green(float x) {
            return 1.602642681354730 * x - 5.948580022657070e-1;
        }
        
        float colormap_blue(float x) {
            return 1.356416928785610 * x + 3.345982835050930e-3;
        }
        
        vec4 colormap(float x) {
            float r = clamp(colormap_red(x), 0.0, 1.0);
            float g = clamp(colormap_green(x), 0.0, 1.0);
            float b = clamp(colormap_blue(x), 0.0, 1.0);
            return vec4(r, g, b, 1.0);
        }

        void main() {
            gl_FragColor = colormap(vColor[0]);
        }
    `;
}

function interpColor(scale: [number, number, number, number][]): (x: number) => [number, number, number, number] {
    return function (x: number) {
        const y = x * (scale.length -1);
        const yr0 = y % 1;
        const yr1 = 1 - yr0;
        const y0 = Math.floor(y);
        const y1 = Math.min(y0 + 1, (scale.length -1));

        return [
            scale[y0][0] * yr0 + scale[y1][0] * yr1, 
            scale[y0][1] * yr0 + scale[y1][1] * yr1, 
            scale[y0][2] * yr0 + scale[y1][2] * yr1, 
            scale[y0][3] * yr0 + scale[y1][3] * yr1
        ];
    };
}

export function loadScene(data_mesh: SurfaceDataMesh, data_map?: SurfaceDataMap) {
    const viewerRoot = document.getElementById('viewer');
    const viewerUi = document.getElementById('viewer-ui') as HTMLElement;
    if (!viewerRoot) return;
    viewerRoot.innerHTML = '';

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(-150, 100, -100);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(viewerRoot.clientWidth, (viewerRoot?.parentElement?.clientHeight || 400) - viewerUi.getBoundingClientRect().bottom);
    viewerRoot.appendChild(renderer.domElement);

    CameraControls.install({ THREE: THREE });
    const controls = new CameraControls(camera, renderer.domElement);
    controls.minZoom = 0.1;
    //controls.enableDamping = true;
    //controls.dampingFactor = 0.25;
    //controls.enableZoom = true;

    const gridHelper = new THREE.GridHelper(1000, 100);
    scene.add(gridHelper);

    //const geometry = new THREE.SphereGeometry();
    const geometry = new THREE.BufferGeometry();

    const verts = new Float32Array(data_mesh.vertices);

    if (data_map) {
        const data_arr = new Float32Array(data_map);

        const [min_col, max_col] = minMax(data_arr) ?? [0, 0];

        //const cols = new Float32Array(data_map.map((x) => (x - min_col) / (max_col - min_col)));

        const col = interpColor(colormap({
            colormap: "viridis",
            format: "float",
        }));

        const cols = new Float32Array(
            Array.from(data_arr).map((x) => col((x - min_col) / (max_col - min_col))).flat()
        );
        geometry.setAttribute("color", new THREE.BufferAttribute(cols, 4));
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(data_mesh.faces), 1));

    geometry.computeVertexNormals();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    scene.add(directionalLight);

    const material = new THREE.MeshLambertMaterial({
        //color: 0xffff00,
        vertexColors: data_map ? true : false,
    });

    /*const material = new THREE.ShaderMaterial({
        uniforms: {},
        fragmentShader: fragmentShader(),
        vertexShader: vertexShader(),
    });*/

    const cube = new THREE.Mesh(geometry, material);
    cube.rotation.x = -Math.PI / 2;
    scene.add(cube);

    function onWindowResize() {
        if (!viewerRoot) {
            return;
        }
        
        camera.aspect = viewerRoot.clientWidth / ((viewerRoot?.parentElement?.clientHeight || 400) - viewerUi.getBoundingClientRect().bottom);
        camera.updateProjectionMatrix();
        renderer.setSize(viewerRoot.clientWidth, (viewerRoot?.parentElement?.clientHeight || 400) - viewerUi.getBoundingClientRect().bottom);
        render();
    }
    window.addEventListener("resize", onWindowResize, false);


    const stats = new Stats();
    stats.showPanel(0);
    viewerRoot.appendChild(stats.dom);

    const clock = new THREE.Clock();

    function animate() {
        stats.begin();

        const delta = clock.getDelta();
        const hasControlsUpdated = controls.update(delta);

        stats.end();

        requestAnimationFrame(animate);

        directionalLight.position.set(
            camera.position.x + 100,
            camera.position.y + 100,
            camera.position.z + 100
        );

        render();
    }

    function render() {
        renderer.render(scene, camera);
    }
    animate();
}
