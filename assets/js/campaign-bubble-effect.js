(function () {
    "use strict";


    var RESOLUTION_SCALE = 0.5;

    var appRunning = false;


    var BASE_VERT = [
        "attribute vec3 position;",
        "varying vec2 vTexCoord;",
        "",
        "void main() {",
        "    vTexCoord = position.xy * 0.5 + 0.5;",
        "    gl_Position = vec4(position, 1.0);",
        "}"
    ].join("\n");

    var OUTPUT_FRAG = [

        "#ifdef GL_FRAGMENT_PRECISION_HIGH",
        "precision highp float;",
        "#else",
        "precision mediump float;",
        "#endif",
        "",
        "const int TRAIL_LENGTH = 15;",
        "const float EPS = 1e-4;",
        "const int ITR = 16;",
        "const float PI = acos(-1.0);",
        "",
        "uniform float uTime;",
        "uniform vec2 uResolution;",
        "uniform vec2 uPointerTrail[TRAIL_LENGTH];",
        "uniform vec2 uBaseBubblePos;",
        "uniform float uBaseBubbleRadius;",
        "uniform float uTrailActive;",
        "",
        "varying vec2 vTexCoord;",
        "",
        "float rnd3D(vec3 p) {",
        "    return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453123);",
        "}",
        "",
        "float noise3D(vec3 p) {",
        "    vec3 i = floor(p);",
        "    vec3 f = fract(p);",
        "",
        "    float a000 = rnd3D(i); // (0,0,0)",
        "    float a100 = rnd3D(i + vec3(1.0, 0.0, 0.0)); // (1,0,0)",
        "    float a010 = rnd3D(i + vec3(0.0, 1.0, 0.0)); // (0,1,0)",
        "    float a110 = rnd3D(i + vec3(1.0, 1.0, 0.0)); // (1,1,0)",
        "    float a001 = rnd3D(i + vec3(0.0, 0.0, 1.0)); // (0,0,1)",
        "    float a101 = rnd3D(i + vec3(1.0, 0.0, 1.0)); // (1,0,1)",
        "    float a011 = rnd3D(i + vec3(0.0, 1.0, 1.0)); // (0,1,1)",
        "    float a111 = rnd3D(i + vec3(1.0, 1.0, 1.0)); // (1,1,1)",
        "",
        "    vec3 u = f * f * (3.0 - 2.0 * f);",
        "    // vec3 u = f*f*f*(f*(f*6.0-15.0)+10.0);",
        "",
        "    float k0 = a000;",
        "    float k1 = a100 - a000;",
        "    float k2 = a010 - a000;",
        "    float k3 = a001 - a000;",
        "    float k4 = a000 - a100 - a010 + a110;",
        "    float k5 = a000 - a010 - a001 + a011;",
        "    float k6 = a000 - a100 - a001 + a101;",
        "    float k7 = -a000 + a100 + a010 - a110 + a001 - a101 - a011 + a111;",
        "",
        "    return k0 + k1 * u.x + k2 * u.y + k3 *u.z + k4 * u.x * u.y + k5 * u.y * u.z + k6 * u.z * u.x + k7 * u.x * u.y * u.z;",
        "}",
        "",
        "// Camera",
        "vec3 origin = vec3(0.0, 0.0, 1.0);",
        "vec3 lookAt = vec3(0.0, 0.0, 0.0);",
        "vec3 cDir = normalize(lookAt - origin);",
        "vec3 cUp = vec3(0.0, 1.0, 0.0);",
        "vec3 cSide = cross(cDir, cUp);",
        "",
        "float smoothMin(float d1, float d2, float k) {",
        "    float h = exp(-k * d1) + exp(-k * d2);",
        "    return -log(h) / k;",
        "}",
        "",
        "vec3 translate(vec3 p, vec3 t) {",
        "    return p - t;",
        "}",
        "",
        "float sdSphere(vec3 p, float s)",
        "{",
        "    return length(p) - s;",
        "}",
        "",
        "float map(vec3 p) {",
        "    float baseRadius = 8e-3;",
        "    float radius = baseRadius * float(TRAIL_LENGTH);",
        "    float k = 7.;",
        "    float d = 1e5;",
        "",
        "    if (uTrailActive > 0.01) {",
        "        for (int i = 0; i < TRAIL_LENGTH; i++) {",
        "            float fi = float(i);",
        "            vec2 pointerTrail = uPointerTrail[i] * uResolution / min(uResolution.x, uResolution.y);",
        "",
        "            float sphere = sdSphere(",
        "                    translate(p, vec3(pointerTrail, .0)),",
        "                    (radius - baseRadius * fi) * uTrailActive",
        "                );",
        "",
        "            d = smoothMin(d, sphere, k);",
        "        }",
        "    }",
        "",
        "    float baseSphere = sdSphere(translate(p, vec3(uBaseBubblePos, 0.0)), uBaseBubbleRadius);",
        "    if (uTrailActive > 0.01) {",
        "        d = smoothMin(d, baseSphere, k);",
        "    } else {",
        "        d = baseSphere;",
        "    }",
        "",
        "    return d;",
        "}",
        "",
        "vec3 generateNormal(vec3 p) {",
        "    return normalize(vec3(",
        "            map(p + vec3(EPS, 0.0, 0.0)) - map(p + vec3(-EPS, 0.0, 0.0)),",
        "            map(p + vec3(0.0, EPS, 0.0)) - map(p + vec3(0.0, -EPS, 0.0)),",
        "            map(p + vec3(0.0, 0.0, EPS)) - map(p + vec3(0.0, 0.0, -EPS))",
        "        ));",
        "}",
        "",
        "vec3 dropletColor(vec3 normal, vec3 rayDir) {",
        "    vec3 reflectDir = reflect(rayDir, normal);",
        "",
        "    float noisePosTime = noise3D(reflectDir * 2.0 + uTime);",
        "    float noiseNegTime = noise3D(reflectDir * 2.0 - uTime);",
        "",
        "    vec3 _color0 = vec3(0.1765, 0.1255, 0.2275) * noisePosTime;",
        "    vec3 _color1 = vec3(0.4118, 0.4118, 0.4157) * noiseNegTime;",
        "",
        "    float intensity = 2.3;",
        "    vec3 color = (_color0 + _color1) * intensity;",
        "",
        "    return color;",
        "}",
        "",
        "void main() {",
        "    vec2 p = (gl_FragCoord.xy * 2.0 - uResolution) / min(uResolution.x, uResolution.y);",
        "",
        "    // Orthographic Camera",
        "    vec3 ray = origin + cSide * p.x + cUp * p.y;",
        "    vec3 rayDirection = cDir;",
        "",
        "    float dist = 0.0;",
        "",
        "    for (int i = 0; i < ITR; ++i) {",
        "        dist = map(ray);",
        "        ray += rayDirection * dist;",
        "        if (dist < EPS) break;",
        "    }",
        "",
        "    vec3 color = vec3(0.0);",
        "",
        "    if (dist < EPS) {",
        "        vec3 normal = generateNormal(ray);",
        "",
        "        color = dropletColor(normal, rayDirection);",
        "        // color = normal; // for debug",
        "    }",
        "",
        "    vec3 finalColor = pow(color, vec3(7.0));",
        "",
        "    gl_FragColor = vec4(finalColor, 1.0);",
        "}"
    ].join("\n");


    var Common = {
        devicePixelRatio: window.devicePixelRatio,
        clock: null,
        renderer: null,
        wrapper: null,
        width: 0,
        height: 0,
        aspect: 1,
        time: 0,
        timeScale: 2.0,

        RENDERER_PARAM: {
            clearColor: 0x000000,
            alpha: 0,
        },


        init: function (wrapper) {
            this.wrapper = wrapper;

            try {
                if (wrapper instanceof HTMLCanvasElement) {
                    this.renderer = new THREE.WebGLRenderer({
                        canvas: wrapper,
                        alpha: true,
                        antialias: false,
                    });
                } else {
                    this.renderer = new THREE.WebGLRenderer({
                        alpha: true,
                        antialias: false,
                    });
                    wrapper.appendChild(this.renderer.domElement);
                }
            } catch (e) {
                console.error("campaign-bubble-effect: WebGL unavailable — effect skipped.", e);
                this.renderer = null;
                return;
            }

            this.clock = new THREE.Clock();

            var clearColor = new THREE.Color(Common.RENDERER_PARAM.clearColor);
            this.renderer.setClearColor(clearColor, Common.RENDERER_PARAM.alpha);

            var el = this.renderer.domElement;
            el.style.display = "block";
            el.style.width = "100%";
            el.style.height = "100%";

            this.resize();
        },

        resize: function () {
            if (!this.renderer) return;

            var box = this.renderer.domElement.parentElement || this.wrapper;
            var cssWidth = (box ? box.clientWidth : 0) || window.innerWidth;
            var cssHeight = (box ? box.clientHeight : 0) || window.innerHeight;

            this.aspect = cssWidth / cssHeight;
            this.width = Math.max(1, Math.round(cssWidth * RESOLUTION_SCALE));
            this.height = Math.max(1, Math.round(cssHeight * RESOLUTION_SCALE));

            this.renderer.setSize(this.width, this.height, false);
   
        },

        update: function () {

            this.time += Math.min(this.clock.getDelta(), 0.05) * this.timeScale;
        },
    };


    var Pointer = {
        pointerMoved: false,
        coords: null,
        target: null,
        prevCoords: null,
        diff: null,
        timer: null,
        hasInteracted: false,

        init: function () {
            this.coords = new THREE.Vector2(9999, 9999);
            this.target = new THREE.Vector2(9999, 9999);
            this.prevCoords = new THREE.Vector2(9999, 9999);
            this.diff = new THREE.Vector2();
            this.hasInteracted = false;

            this.onPointerMove = this.onPointerMove.bind(this);
            this.onPointerDown = this.onPointerDown.bind(this);

            document.body.addEventListener("pointermove", this.onPointerMove, false);
            document.body.addEventListener("pointerdown", this.onPointerDown, false);
        },

        setCoords: function (x, y) {
            if (!appRunning || !Common.renderer) return; 
            if (this.timer) clearTimeout(this.timer);

            var rect = Common.renderer.domElement.getBoundingClientRect();
            var coordsX = ((x - rect.left) / rect.width) * 2 - 1;
            var coordsY = -((y - rect.top) / rect.height) * 2 + 1;

            if (!this.hasInteracted) {
                this.hasInteracted = true;
                this.coords.set(coordsX, coordsY);
                this.target.set(coordsX, coordsY);
                this.prevCoords.set(coordsX, coordsY);
                if (Output.pointerTrail) {
                    for (var i = 0; i < Output.trailLength; i++) {
                        Output.pointerTrail[i].set(coordsX, coordsY);
                    }
                }
            } else {
                this.target.set(coordsX, coordsY);
            }

            this.pointerMoved = true;

            this.timer = setTimeout(function () {
                Pointer.pointerMoved = false;
            }, 100);
        },

        onPointerMove: function (e) {

            this.setCoords(e.clientX, e.clientY);
        },

        onPointerDown: function (e) {
            if (e.pointerType !== "touch" || !e.isPrimary) return;

            this.setCoords(e.clientX, e.clientY);
        },

        update: function () {
            this.diff.subVectors(this.coords, this.prevCoords);
            this.prevCoords.copy(this.coords);
        },
    };


    var Output = {
        scene: null,
        camera: null,
        uniforms: null,
        trailLength: 15,
        pointerTrail: null,

        CAMERA_PARAM: {
            fovy: 60,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.1,
            far: 50,
            position: null,
            lookAt: null,
        },

        updateBubbleParams: function () {
            if (!this.uniforms) return;
            var isMobile = (window.innerWidth <= 768) || (Common.aspect < 0.95);
            if (isMobile) {
              
                this.uniforms.uBaseBubblePos.value.set(0.65, -0.15); 
                this.uniforms.uBaseBubbleRadius.value = 0.80;  
            } else {
          
                var posX = Math.max(1.25, Common.aspect * 0.75);  
                this.uniforms.uBaseBubblePos.value.set(posX, 0.25);
                this.uniforms.uBaseBubbleRadius.value = 0.82;  
            }
        },

        init: function () {
            this.CAMERA_PARAM.position = new THREE.Vector3(0.0, 0.0, 10.0);
            this.CAMERA_PARAM.lookAt = new THREE.Vector3(0.0, 0.0, 0.0);

            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(
                this.CAMERA_PARAM.fovy,
                this.CAMERA_PARAM.aspect,
                this.CAMERA_PARAM.near,
                this.CAMERA_PARAM.far
            );

            this.pointerTrail = [];
            for (var i = 0; i < this.trailLength; i++) {
                this.pointerTrail.push(new THREE.Vector2(9999, 9999));
            }

            this.uniforms = {
                uTime: { value: Common.time },
                uResolution: {
                    value: new THREE.Vector2(Common.width, Common.height),
                },
                uPointerTrail: { value: this.pointerTrail },
                uBaseBubblePos: { value: new THREE.Vector2(1.15, 0.05) },
                uBaseBubbleRadius: { value: 0.72 },
                uTrailActive: { value: 0.0 },
            };

            this.updateBubbleParams();

            // Camera
            this.camera.position.copy(this.CAMERA_PARAM.position);
            this.camera.lookAt(this.CAMERA_PARAM.lookAt);

            // Mesh
            var planeGeometry = new THREE.PlaneGeometry(2.0, 2.0);
            var planeMaterial = new THREE.RawShaderMaterial({
                vertexShader: BASE_VERT,
                fragmentShader: OUTPUT_FRAG,
                wireframe: false,
                uniforms: this.uniforms,
            });
            var plane = new THREE.Mesh(planeGeometry, planeMaterial);
            this.scene.add(plane);
        },

        resize: function () {
            if (!this.camera) return;
            this.camera.aspect = Common.aspect;
            this.camera.updateProjectionMatrix();
            if (this.uniforms) {
                this.uniforms.uResolution.value.set(Common.width, Common.height);
                this.updateBubbleParams();
            }
        },

        // Render the final output scene
        render: function () {
            if (!this.camera || !this.scene || !Common.renderer) return;
            if (this.uniforms) {
                this.uniforms.uTime.value = Common.time;
            }
            Common.renderer.render(this.scene, this.camera);
        },

        // rAF update
        update: function () {
            if (Pointer.hasInteracted) {
                this.uniforms.uTrailActive.value = Math.min(1.0, this.uniforms.uTrailActive.value + 0.05);
                this.updatePointerTrail();
            } else {
                this.uniforms.uTrailActive.value = 0.0;
            }
            this.render();
        },

        updatePointerTrail: function () {
    
            Pointer.coords.lerp(Pointer.target, 0.35);

            for (var i = this.trailLength - 1; i > 0; i--) {
                this.pointerTrail[i].copy(this.pointerTrail[i - 1]);
            }
            this.pointerTrail[0].copy(Pointer.coords);
        },
    };


    function ThreeApp(canvas) {
        this.canvas = canvas;

        this.resize = this.resize.bind(this);
        this.render = this.render.bind(this);

        window.addEventListener("resize", this.resize);
    }

    ThreeApp.prototype = {
        running: false,
        initialized: false,

        // Initialization
        init: function () {
            Common.init(this.canvas);
            if (!Common.renderer) return; 
            Pointer.init();
            Output.init();
            this.initialized = true;
        },

        // Setup before starting rendering
        setup: function () {
            this.resize();
            Common.clock.start();
        },

        // Rendering process
        render: function () {
            if (!this.running) return; 
            requestAnimationFrame(this.render);

            Common.update();
            Output.update();
        },

        // Resize handling
        resize: function () {
            if (!this.initialized || !Common.renderer) return;
            Common.resize();
            Output.resize();
        },
    };


    function boot() {
        var canvas = document.querySelector(".tl-campaign-canvas-bubles");

        if (!(canvas instanceof HTMLElement)) {
            console.error('Failed to find a valid element with the class "tl-campaign-canvas-bubles".');
            return;
        }

        if (typeof THREE === "undefined") {
            console.error("campaign-bubble-effect.js requires three.js to be loaded first.");
            return;
        }

        var app = new ThreeApp(canvas);

        function start() {
            if (!app.initialized) {
                app.initialized = true;
                app.init();
                if (!Common.renderer) return; 
                app.setup();
            }
            if (!app.running) {
                app.running = true;
                appRunning = true;
                app.render();
            }
        }

        function stop() {
            app.running = false;
            appRunning = false;
        }

        var watchTarget = canvas.parentElement || canvas;
        if ("IntersectionObserver" in window) {
            var observer = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            start();
                        } else {
                            stop();
                        }
                    });
                },
                { rootMargin: "100px 0px" }
            );
            observer.observe(watchTarget);
        } else {
            start(); 
        }
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", boot, false);
    } else {
        boot();
    }
})();