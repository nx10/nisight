import * as THREE from "three";
import CameraControls from "camera-controls";
//import Stats from "stats.js";
import * as d3 from "d3";
import { autoToRgb, getDocElem, hexToRgb, minMax } from "./utils";
import { colorInterpolates } from "./d3_color_schemes";
import { Legend } from "./legend";

export type SurfaceDataMesh = {
    vertices: Float32Array;
    faces: Uint32Array;
};
export type SurfaceDataMap = Float32Array;

export type SerializableViewerState = {
    map?: number[];
    mesh?: {
        vertices: number[];
        faces: number[];
    };
};

export class ViewerClient {
    private viewerRoot: HTMLElement;
    private viewerUi: HTMLElement;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;

    private mesh?: SurfaceDataMesh;
    private map?: SurfaceDataMap;
    private colorMap: string = "Viridis";

    private legend: Legend;

    public constructor() {
        this.legend = new Legend();
        this.legend.init();


        this.viewerRoot = getDocElem("viewer");
        this.viewerRoot.innerHTML = "";

        this.viewerUi = getDocElem("viewer-ui");

        // setup scene

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(-150, 100, -100);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(
            this.viewerRoot.clientWidth,
            (this.viewerRoot?.parentElement?.clientHeight || 400) -
                this.viewerUi.getBoundingClientRect().bottom
        );
        this.viewerRoot.appendChild(this.renderer.domElement);

        // eslint-disable-next-line @typescript-eslint/naming-convention
        CameraControls.install({ THREE: THREE });
        const controls = new CameraControls(
            this.camera,
            this.renderer.domElement
        );
        controls.minZoom = 0.1;

        const gridHelper = new THREE.GridHelper(1000, 100);
        this.scene.add(gridHelper);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        this.scene.add(directionalLight);

        //const stats = new Stats();
        //stats.showPanel(0);
        //this.viewerRoot.appendChild(stats.dom);

        const clock = new THREE.Clock();

        const animate = () => {
            if (!this.camera) {
                return;
            }

            //stats.begin();

            const delta = clock.getDelta();
            const hasControlsUpdated = controls.update(delta);

            //stats.end();

            requestAnimationFrame(animate);

            directionalLight.position.set(
                this.camera.position.x + 100,
                this.camera.position.y + 100,
                this.camera.position.z + 100
            );

            this.render();
        };

        animate();

        // Window resize listener

        window.addEventListener("resize", () => this.onWindowResize(), false);
    }

    private render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    private onWindowResize() {
        this.camera.aspect =
            this.viewerRoot.clientWidth /
            ((this.viewerRoot?.parentElement?.clientHeight || 400) -
                this.viewerUi.getBoundingClientRect().bottom);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(
            this.viewerRoot.clientWidth,
            (this.viewerRoot?.parentElement?.clientHeight || 400) -
                this.viewerUi.getBoundingClientRect().bottom
        );
        this.render();
    }

    public getSerializableState(): SerializableViewerState {
        return {
            mesh: this.mesh
                ? {
                      vertices: Array.from(this.mesh.vertices),
                      faces: Array.from(this.mesh.faces),
                  }
                : undefined,
            map: this.map ? Array.from(this.map) : undefined,
        };
    }

    public setSerializableState(state: SerializableViewerState) {
        this.setModel(
            state.mesh
                ? {
                      vertices: new Float32Array(state.mesh.vertices),
                      faces: new Uint32Array(state.mesh.faces),
                  }
                : undefined,
            state.map ? new Float32Array(state.map) : undefined
        );
    }

    public setModel(
        meshUpdated?: SurfaceDataMesh,
        mapUpdated?: SurfaceDataMap,
        colorMapUpdated?: string
    ) {
        if (meshUpdated) {
            this.mesh = meshUpdated;
        }

        if (mapUpdated) {
            this.map = mapUpdated;
        }

        if (colorMapUpdated) {
            this.colorMap = colorMapUpdated;
        }

        if (!this.mesh) {
            return;
        }

        //const geometry = new THREE.SphereGeometry();
        const geometry = new THREE.BufferGeometry();

        const verts = this.mesh.vertices;

        if (this.map) {
            const [minCol, maxCol] = minMax(this.map) ?? [0, 0];

            //const cols = new Float32Array(data_map.map((x) => (x - min_col) / (max_col - min_col)));

            const interpolationFun =
                colorInterpolates[
                    this.colorMap as keyof typeof colorInterpolates
                ];

            this.legend.update(minCol, maxCol, interpolationFun);

            const col = (x: number) =>
                autoToRgb(interpolationFun(x)) ?? [0, 0, 0];

            console.log(interpolationFun(0.5));

            const cols = new Float32Array(
                Array.from(this.map)
                    .map((x) => col((x - minCol) / (maxCol - minCol)))
                    .flat()
            );

            geometry.setAttribute("color", new THREE.BufferAttribute(cols, 3));
        } else {

            this.legend.remove();
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(verts, 3));
        geometry.setIndex(new THREE.BufferAttribute(this.mesh.faces, 1));

        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({
            //color: 0xffff00,
            vertexColors: this.map ? true : false,
        });

        const obj = new THREE.Mesh(geometry, material);
        obj.rotation.x = -Math.PI / 2;
        this.scene.add(obj);
    }

    public dispose(): void {
        window.removeEventListener("resize", this.onWindowResize);
    }
}
