var globeApp = {

    test: true,
    moving2StartPos: false,
    w2D: 600,
    h2D: 600,
    canvasFixedSize: false,
    fixedSize: true, //this doesn't matter if canvasFixedSize is true
    iniW: 600,
    iniH: 600,
    progressFunction: null,
    icons2StartPositionCB: null,
    rotateCB: null,
    iconsRadiusDiff: 5,

    maxIconsAboveH: 0,
    iconsAboveLimit: 20,
    tooltipNode: null,
    fgShader: [
        '#ifdef GL_ES',
        'precision highp float;',
        '#endif',
        'varying vec4 vFinalColor;',
        'varying vec2 vTextureCoord;',
        'uniform sampler2D uSampler;',
        'uniform sampler2D uSamplerP;',
        'uniform bool uUseTextureP;',
        'uniform bool uUseTexture;',
        'uniform float uTexturePAlpha;',
        'uniform vec4 uPickingColor;',
        'uniform bool uOffscreen;',
        'void main(void) {',
            'if (uOffscreen==true) {',
                'gl_FragColor = uPickingColor; return;',
            '}',
            'if (uUseTexture) {',
                'vec4 texColor = texture2D(uSampler, vTextureCoord);',
                'if (uUseTextureP) {',
                    'vec4 texColorP = texture2D(uSamplerP, vTextureCoord);',
                    'texColorP.a = uTexturePAlpha;',
                    'vec4 colorB = vFinalColor * texColor;',
                    'gl_FragColor = vec4(',
                    '-texColorP.a*colorB.r + colorB.r + texColorP.a*texColorP.r,',
                    '-texColorP.a*colorB.g + colorB.g + texColorP.a*texColorP.g,',
                    '-texColorP.a*colorB.b + colorB.b + texColorP.a*texColorP.b,',
                    '1.0',
                    ');',
                '} else {',
                    'gl_FragColor = vFinalColor * texColor;',
                '}',
            '} else {',
                'gl_FragColor = vFinalColor;',
            '}',
        '}'
    ],
    vxShader: [
        'attribute vec3 aVertexPosition;',
        'attribute vec3 aVertexNormal;',
        'uniform vec3 uLightDirection;',
        'uniform vec4 uLightDiffuse;',
        'uniform vec4 uLightSpecular;',
        'uniform vec4 uLightAmbient;',
        'uniform vec4 uMaterialDiffuse;',
        'uniform vec4 uMaterialAmbient;',
        'uniform vec4 uMaterialSpecular;',
        'uniform float uShininess;',
        'uniform mat4 uMMatrix;',
        'uniform mat4 uVMatrix;',
        'uniform mat4 uNMatrix;',
        'uniform mat4 uPMatrix;',
        'uniform mat4 uAMatrix;',
        'varying vec4 vFinalColor;',
        'varying vec2 vTextureCoord;',
        'attribute vec2 aVertexTextureCoords;',
        'uniform bool uUseTexture;',
        'uniform bool uDoNotApplyVMatrix;',
        'void main(void) {',
            'vec4 vertex = vec4(aVertexPosition, 1.0);',
            'vec4 Ia = uLightAmbient * uMaterialAmbient;',
            'aVertexNormal;',
            'vFinalColor = Ia;',
            'vFinalColor.a = 1.0;',
            'if (uDoNotApplyVMatrix) {',
                'gl_Position = uPMatrix * uMMatrix * uAMatrix * vertex;',
            '} else {',
                'gl_Position = uPMatrix * uVMatrix * uMMatrix * uAMatrix * vertex;',
            '}',
            'vTextureCoord = vec2(0.0);',
            'if (uUseTexture) vTextureCoord = aVertexTextureCoords;',
        '}'
    ],
    initiated: false,
    running: false,
    canvas: null,
    canvasId: 'canvasGlobe',
    w: 600, //canvas width
    h: 600, //canvas height
    availSpace: {w: 0, h: 0},
    maxHeight: 2250,
    maxWidth: 2970,
    minWidth: 200,
    minHeight: 200,
    left: 0,
    top: 0,
    resizeDelay: 350,
    resizeTimeout: null, 
    
    gl: null, //opengl context
    shaderFragmentId: 'shader-fs', //id of the script that contains the fragment shader code
    shaderVertexId: 'shader-vs', //id of the script that contains the vertex shader code
    prg: null, //the program (shaders)
    vMatrix: [], //the view matrix
    pMatrix: [], //the projection matrix
    
    overRenderer: false,
    distance: 200, 
    distanceTarget: 200,
    initDistance: 200,
    initRotLat: -29.71,
    initRotLng: 40.62,
    maxDistance: 600,
    minDistance: 5,
    zoomStep: 30,
    zoomStepDblClick: 30,
    zoomFactor: 0.3,
    iconMoveFactor: 0.3,
    globeMoveFactor: 0.2,
    keyRotStep: 2,
    /* rotation */
    PI_HALF: Math.PI/2,
    PI_180: Math.PI/180,
    mouse: {x: 0, y: 0, down: false, drag: false, dx: 0, dy: 0},
    rotation: {x: 0, y: 0, z:0, targetX: 0, targetY: 0},
    rotateFactor: 1, 
    rotateEffectFactor: 10,
    
    mouseOnDown: {x: 0, y: 0},
    
    /* texture */
    texturesLoaded: 0,
    texture: null,
    textureCanBeUsed: false,
    textureImg: null,
    textureImgSrc: '/layouts/default/scripts/globe/earth_atmos_2048.jpg',
    TEXTURE_MAG_FILTER: 'NEAREST', //LINEAR|NEAREST
    TEXTURE_MIN_FILTER: 'NEAREST',
    /* picking */
    rBuffer: null, //render buffer
    fBuffer: null, //frame buffer
    pickingTexture: null, //texture for picking
    
    pickIcon: null,
    overPixel: null,
    overScale: 3.2, //3.2
    overScaleDuration: 250,
    pIconAlphaDuration: 250,
    lastTimePixelRead: 0,
    pixelReadDelta: 100,
    noRender: true, //if true, then no render
    disabled: false,
    
    radius: 200,
    latCount: 50,
    longCount: 50,
    icons: [],
    iconsCount: 0,
    iconSize: 40, //40
    iconScaleSize: 20, //20
    objects: {
        'sphere': {
            ambient: [1.0,1.0,1.0,1.0],
            vertices: [],
            indices: [],
            mMatrix: mat4.identity(), //object matrix
            aMatrix: mat4.identity(), //animation matrix
            normals: [],
            textureCoords: [],
            vbo: null,
            ibo: null,
            nbo: null,
            tbo: null,
            pColor: [0.0, 0.0, 1.0, 1.0],
            drawMethod: 'triangles',
            rotY: 0,
            rotYT: 450,
            scale: 0.01,
            scaleT: 1
        },
        'ring': {
            ambient: [0.6,0.6,0.6,1.0],
            vertices: [], indices: [],
            mMatrix: mat4.identity(),
            aMatrix: mat4.identity(),
            normals: [], vbo: null, ibo: null, nbo: null, tbo: null,
            drawMethod: 'line_loop'
        }
    },
    /**/
    favicons: [],
    faviconsCount: 0,
    favoverScale: 2.13,
    faviconSize: 60,
    iconSizePx: 32,
    faviconSizePx: 48,
    mode: 'fav', //fav or empty string
    
    modeScaleRatio: 1,
    modeRevScaleRatio: 1,
    togglingMode: false,
    togglingDuration: 250,
    /**/
    toggleMode: function(f) {
        var newMode;
        if ('fav' == this.mode) {
            newMode = '';
        } else {
            newMode = 'fav';
        }
        return this.setMode(newMode, f);
    },
    setMode: function(mode, f) {
    	if (this.disabled) return false;
    	if (this.disabled) return false;
        if (this.running && this.moving2StartPos) return false;
        
        var prevmode = this.mode;
        
    	this.forceMode(mode);
        
        if (this.running && (prevmode != this.mode)) {
            this.togglingMode = this.mode;
            this.moving2StartPos = true;
        }
        
//        if (f) {
//            this.onToggleCompletedOnceFunction = f;
//        }
        
        var icon;
        if (!this.running) {
            this.run();
            for (var i = 0;i<this.iconsCount;i++) {
                this.initObjBuffers('icon'+i, this.icons[i]);
            }
        } else {
            this.onResize();
            this.iconScaleSize = this.calcIconScaleSize();
            
            for (var i = 0;i<this.iconsCount;i++) {
                icon = this.icons[i];
                icon.lat = icon.latT = icon.lat0;
                icon.lng = icon.lngT = icon.lng0;
                icon.rotX = icon.rotXT = 0; 
                icon.rotY = icon.rotYT = 0; 
                icon.rotZ = icon.rotZT = 0;
                icon.r = icon.rT = icon.r0;
                icon.scale = 1;
                
                if (icon.isFav) {
                    if (this.togglingMode === '') {
                        icon.scale = this.modeScaleRatio;
                    } else if (this.togglingMode === 'fav') {
                        icon.scale = this.modeRevScaleRatio;
                    }
                }
            }
            
            this.rearrangeIcons();
            for (var i = 0;i<this.iconsCount;i++) {
                this.initObjBuffers('icon'+i, this.icons[i]);
            }
            
            this.noRender = false;
        }
        return this.mode;
    },
    forceMode: function(mode) {
        if ('fav' != mode) {
            mode = '';
        }
    	this.mode = mode;
    },
    setOptions: function(opts) {
        if (opts.glTexSrc) {
            this.textureImgSrc = opts.glTexSrc;
        }

        var maxDistance = opts.glMaxDistance?parseInt(opts.glMaxDistance):0;
        if (maxDistance>0) this.maxDistance = maxDistance;
        var minDistance = opts.glMinDistance?parseInt(opts.glMinDistance):0;
        if (minDistance>0) this.minDistance = minDistance;
        if (this.minDistance>this.maxDistance) {
            this.minDistance = this.maxDistance;
        }
        var zoomStep = opts.glZoomStep?parseInt(opts.glZoomStep):0;
        if (zoomStep>0) this.zoomStep = this.zoomStepDblClick = zoomStep;
        var iconsRadiusDiff = opts.glIconsRadiusDiff?parseInt(opts.glIconsRadiusDiff):0;
        if (iconsRadiusDiff>0) this.iconsRadiusDiff = iconsRadiusDiff;
        
        var iconsAboveLimit = opts.glIconsAboveLimit?parseInt(opts.glIconsAboveLimit):0;
        if (iconsAboveLimit>0) this.iconsAboveLimit = iconsAboveLimit;
        
        var distance = opts.glInitDistance?parseInt(opts.glInitDistance):0;
        if ((distance>0) && (distance>=this.minDistance) && (distance<=this.maxDistance)) {
            this.initDistance = this.distance = this.distanceTarget = distance;
        }
        if (opts.iconSizes) {
            this.setIconSizeProperty(opts.iconSizes['all']);
            this.setIconSizeProperty(opts.iconSizes['fav'], true);
        }
        if (opts.iconScales) {
            this.setOverScaleProperty(opts.iconScales.overScale);
            this.setOverScaleProperty(opts.iconScales.favoverScale, true);
        }
    },
    setOverScaleProperty: function(scale, isFav) {
        var pref = isFav ? 'fav' : '';
        scale = parseFloat(scale);
        if (!isNaN(scale)) {
            if (scale <= 1) scale = 1;
            this[pref + 'overScale'] = scale;
        }
    },
    setIconSizeProperty: function(size, isFav) {
        var pref = isFav ? 'fav' : '';
        size = parseInt(size);
        if (!isNaN(size) && (size > 5)) {
            this[pref + 'iconSizePx'] = size;
        }
    },
    initIconSizes: function() {
        var frustrum = this.getFrustrum();
        this.iconSize = this.iconSizePx * 2 * frustrum[0] / this.w;
        this.iconSize = Math.round(100 * this.iconSize * this.maxDistance/this.distance) / 100;
        this.faviconSize = this.faviconSizePx * 2 * frustrum[0] / this.w;
        this.faviconSize = Math.round(100 * this.faviconSize * this.maxDistance/this.distance) / 100;
    },
    disable: function() {
        this.disabled = true;
    },
    enable: function() {
        this.disabled = false;
    },
    rearrangeIcons: function() {
        var stack = [];
        var icon, stackIcon, overlaped;
        var stackSize = 0;
        var d,iX,iY,iZ,siX,siY,siZ,iTheta,iPhi,siTheta,siPhi;
        var i,j;
        for (i = 0;i<this[this.mode + 'iconsCount'];i++) {
            icon = this[this.mode + 'icons'][i];
            
            iTheta = (90-icon.lat0) * this.PI_180;
            iPhi = (180-icon.lng0) * this.PI_180;
            iX = (this.radius+1) * Math.sin(iTheta) * Math.cos(iPhi);
            iY = (this.radius+1) * Math.cos(iTheta);
            iZ = (this.radius+1) * Math.sin(iPhi) * Math.sin(iTheta);
            overlaped = false;
            icon.rT = icon.r0;
            icon.rotXT = 0;
            icon.rotYT = 0;
            icon.rotZT = 0;
            
            stackSize = stack.length;
            for (j = 0;j<stackSize;j++) {
                stackIcon = stack[j];
                
                siTheta = (90-stackIcon.lat0) * this.PI_180;
                siPhi = (180-stackIcon.lng0) * this.PI_180;
                siX = (this.radius+1) * Math.sin(siTheta) * Math.cos(siPhi);
                siY = (this.radius+1) * Math.cos(siTheta);
                siZ = (this.radius+1) * Math.sin(siPhi) * Math.sin(siTheta);
                d = Math.sqrt((siX-iX)*(siX-iX)+(siY-iY)*(siY-iY)+(siZ-iZ)*(siZ-iZ));
                if (d<=(Math.sqrt(2)*this.iconScaleSize)) {
                    overlaped = true;
                    break;
                }
                continue;
            }
            if (overlaped) {
                stackIcon.icons.push(icon);
            } else {
                icon.rT = icon.r0;
                icon.latT = icon.lat0;
                icon.lngT = icon.lng0;
                stack.push({
                    lat0: icon.lat0,
                    lng0: icon.lng0,
                    icons: [],
                    rDiff: this.iconsRadiusDiff
                });
            }
        }
        this.maxIconsAboveH = 0;
        stackSize = stack.length;
        var stackIconsCount = 0;
        var limitH = (this.iconsAboveLimit-1)*this.iconsRadiusDiff;
        var stackH = 0;
        for (i = 0;i<stackSize;i++) {
            stackIcon = stack[i];
            stackIconsCount = stackIcon.icons.length;
            if (stackIconsCount<=0) continue; 
            if ((stackIconsCount+1)>this.iconsAboveLimit) {
                stackIcon.rDiff = Math.round(limitH/stackIconsCount);
                if (stackIcon.rDiff<=1) {
                    stackIcon.rDiff = 1;
                }
            }   
            stackH = stackIconsCount*stackIcon.rDiff;
            if (stackH>this.maxIconsAboveH) {
                this.maxIconsAboveH = stackH;
            }
            for (j = 0;j<stackIconsCount;j++) {
                icon = stackIcon.icons[j];
                icon.rT = icon.r0 + (j+1)*stackIcon.rDiff;
                icon.latT = stackIcon.lat0;
                icon.lngT = stackIcon.lng0;
            }
        }
        
    },
    initContext: function() {
        this.canvas = document.getElementById(this.canvasId);
        this.gl = glUtils.getGLContext(this.canvasId);
        if (this.gl === null) {
            return null;
        }
        if (!this.gl) return false;
        return true;
    },
    calcIconScaleSize: function() {
        var zoomScale = this.distance/this.maxDistance;
        return this[this.mode + 'iconSize']*zoomScale;
    },
    isSupported: function() {
        if (!this.gl) {
            var glRes = this.initContext();
            if (!glRes) return glRes;
            if (typeof(Float32Array)=='undefined') return false;
        }
        return true;
    },
    init: function() {
        var isSupported = this.isSupported();
        if (!isSupported) return false;
        
        this.modeScaleRatio = Math.round(100 * this.faviconSizePx/this.iconSizePx) / 100;
        this.modeRevScaleRatio = Math.round(100 * this.iconSizePx/this.faviconSizePx) / 100;
                
        this.initSize();
        this.iconScaleSize = this.calcIconScaleSize();
        this.vMatrix = mat4.identity();
        this.pMatrix = mat4.identity(); 
        if (this.iconsCount<=0) {
            if (this.test) this.loadTestIcons();
        }
        this.initIconSizes();
        this.initObjects();
        
        // init the program (shaders)
        this.initProgram();
        //init lights
        this.initLights();
        //init buffers
        this.initBuffers();
        //init texture
        this.initTextures();
        
        this.initiated = true;
        return true;
    },
    run: function() {
        if (this.disabled) return false;
        if (this.running) return true;
        var sphere = this.objects['sphere'];
        if (sphere) {
            sphere.rotY = 0;
            sphere.rotYT = 450;
            sphere.scaleT = 1;
            sphere.scale = 0.01;
        }
        if (this.initiated) {
            this.onResize();
            this.iconScaleSize = this.calcIconScaleSize();
            
            this.setIconsStartPosition();
            this.rearrangeIcons();
            this.noRender = false;
        } else {
            var r = this.init();
            if (!r) return r;
            this.noRender = false;
            var t0 = glUtils.getAnimTime();
            this.renderLoop(t0, t0);
            this.initEvents();
        }
        this.running = true;
        return true;
    },
    stop: function() {
        this.running = false;
        this.noRender = true;
    },
    initTextures: function() {
        this.initGlobeTexture();
//        this.initIconTextures();
    },
    initIconTextures: function() {
        for (var i = 0;i<this.iconsCount;i++) {
            this.initIconTexture(this.icons[i]);
        }
    },
    setProgressFunction: function(progressFunction) {
        this.progressFunction = progressFunction;
    },
    setIcons2StartPositionCB: function(icons2StartPositionCB) {
        this.icons2StartPositionCB = icons2StartPositionCB;
    },
    unsetIcons2StartPositionCB: function() {
        this.icons2StartPositionCB = null;
    },
    setRotateCB: function(rotateCB) {
        this.rotateCB = rotateCB;
    },
    unsetRotateCB: function() {
        this.rotateCB = null;
    },
    initGlobeTexture: function() {
        this.textureImg = new Image();
        this.textureImg.crossOrigin = 'anonymous';
        this.textureImg.onload = this.textureImg.onerror = function(e){
            if (e && (e.type!='error')) {
                globeApp.createObjTexture(globeApp, 'texture', 'textureImg', 'textureCanBeUsed');
            }
            globeApp.globeTextureLoaded = true;

            globeApp.onTextureLoaded();

        }
        this.textureImg.src = this.textureImgSrc;
    },
    onTextureLoaded: function() {
        this.texturesLoaded++;
        if (this.progressFunction) {
            this.progressFunction(this.texturesLoaded, (this.texturesLoaded>=(this.iconsCount+1)));
        }

        if (this.globeTextureLoaded && !this.iconTexturesStartedToLoad) {
            
            this.iconTexturesStartedToLoad = true;
            this.initIconTextures();
        }
    },
    createObjTexture: function(obj, texName, texImgName, flagName) {
        obj[texName] = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, obj[texName]);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, obj[texImgName]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl[this.TEXTURE_MAG_FILTER]);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl[this.TEXTURE_MIN_FILTER]);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        obj[flagName] = true;
    },
    initIconTexture: function(icon) {
        if (!icon.textureImg) {
            icon.textureImg = new Image();
            icon.textureImg.crossOrigin = 'anonymous';
            icon.textureImg.iconNum = icon.n;
            icon.textureImg.onload = icon.textureImg.onerror = function(e){
                if (e && (e.type!='error')) {
                    var icon = globeApp.icons[this.iconNum];
                    if (icon) {
                        globeApp.createObjTexture(icon, 'texture', 'textureImg', 'textureCanBeUsed');
                    }
                }
                globeApp.onTextureLoaded();
            }
            icon.textureImg.src = icon.textureImgSrc;
        } else {
            if (icon.textureImg.loaded) this.createObjTexture(icon, 'texture', 'textureImg', 'textureCanBeUsed');
            this.onTextureLoaded();
        }
        
    },
    setIconTextureImg: function(i, img) {
        var icon = this.icons[i];
        if (!icon) return false; 

        icon.textureImg = img;
        icon.textureImg.crossOrigin = 'anonymous';
    },
    setIconPTextureImg: function(i, img) {
        var icon = this.icons[i];

        if (!icon) return false; 

        icon.pTextureImg = img;
        icon.pTextureImg.crossOrigin = 'anonymous';
        if (img.loaded) this.createObjTexture(icon, 'pTexture', 'pTextureImg', 'pTextureCanBeUsed');
    },
    initEvents: function() {
        this.canvas.addEventListener('DOMMouseScroll', function(e){//firefox
            globeApp.onMouseWheel(e);
        }, false);
        this.canvas.addEventListener('mousewheel', function(e){
            globeApp.onMouseWheel(e);
        }, false);
        this.canvas.addEventListener('mousedown', function(e){
            globeApp.onMouseDown(e);
        }, false);        
        this.canvas.addEventListener('mouseover', function(e){
            globeApp.onMouseOver(e);
        }, false);
        this.canvas.addEventListener('mouseout', function(e){
            globeApp.onMouseOut(e);
        }, false);
        this.canvas.addEventListener('dblclick', function(e){
            globeApp.onDblClick(e);
        }, false);
        this.canvas.addEventListener('click', function(e){
            globeApp.onClick(e);
        }, false);
        
        this.canvas.addEventListener('mousemove', function(e){
            globeApp.onMouseMove(e);
        }, false);

        document.addEventListener('keydown', function(e){
            globeApp.onKeyDown(e);
        }, false);

        window.addEventListener('resize', function(e){
            clearTimeout(globeApp.resizeTimeout);
            globeApp.resizeTimeout = setTimeout(function() {
                if (!globeApp.running) return false;
                if (globeApp.moving2StartPos) return false;
                globeApp.onResize();
            }, globeApp.resizeDelay);

        }, false);
    },
    onKeyDown: function(e) {
        if (this.disabled || this.moving2StartPos) return false;
        
        var dRotX = 0; var dRotY = 0;
        var d = this.keyRotStep;
        if (e.which==37) {
            dRotY = -d;
        } else if (e.which==39) {
            dRotY = d;
        } else if (e.which==38) {
            dRotX = -d;
        } else if (e.which==40) {
            dRotX = d;
        } else {
            return;
        }
        
        this.rotateXY(dRotX, dRotY);
    },
    onClick: function(e) {  
        if (this.disabled) return false;
        if (this.moving2StartPos) return false;
        if (this.pickIcon) {
            var pos = this.getMousePos(e);
            var icon = canvasApp.getIconByCode(this.pickIcon.code);
            var slSrc = '';
            if (icon.slImg.loaded) {
                slSrc = icon.slSrc;
            }
            var l = pos.x;
            var b = this.h - pos.y;

            uiLoadSlides(icon.id, icon.tSrc, l, b, icon.fsW, icon.fsH, icon.pBgClr, slSrc, icon.code);
        }
    },
    iconFlyFromCenter: function(icon) {
        var slSrc = '';
        if (icon.slImg.loaded) {
            slSrc = icon.slSrc;
        }
        var l = Math.floor(this.left + this.w/2);
        var b = Math.floor(this.top + this.h/2);

        uiLoadSlides(icon.id, icon.tSrc, l, b, icon.fsW, icon.fsH, icon.pBgClr, slSrc, icon.code);
    },
    calcSize: function() {
        var availSp = this.getAvailableSpace();
        var h,w;

        if (this.canvasFixedSize) {
            h = this.canvas.height;
            w = this.canvas.width;
        } else {
            h = availSp.h;
            w = availSp.w;
        }
        h = (h>this.maxHeight)?this.maxHeight:(h<this.minHeight?this.minHeight:h);
        w = (w>this.maxWidth)?this.maxWidth:(w<this.minWidth?this.minWidth:w);
        
        return {w: w, h: h};
    },
    initSize: function() {
        var s = this.calcSize();
        if (this.canvasFixedSize) {
            this.fixedSize = true; 
            this.iniH = s.h;
            this.iniW = s.w;
        } else {
            this.iniH = (this.canvas.height>this.maxHeight)?this.maxHeight:(this.canvas.height<this.minHeight?this.minHeight:this.canvas.height);
            this.iniW = (this.canvas.width>this.maxWidth)?this.maxWidth:(this.canvas.width<this.minWidth?this.minWidth:this.canvas.width);
        }
        this.w2D = s.w;
        this.h2D = s.h;

        this.w = s.w;
        this.h = s.h;
        
        var left = (this.availSpace.w-this.w)/2;
        if (left<=0) left = 0;
        this.left = left;
        var top = (this.availSpace.h-this.h)/2;
        if (top<=0) top = 0;
        this.top = top;
        
        this.canvas.style.left = this.left+'px';
        this.canvas.style.top = this.top+'px';
        
        this.canvas.width = this.w;
        this.canvas.height = this.h;
    },
    onResize: function() {
        var s = this.calcSize();
        this.w = s.w;
        this.h = s.h;
        var left = (this.availSpace.w-this.w)/2;
        if (left<=0) left = 0;
        this.left = left;
        var top = (this.availSpace.h-this.h)/2;
        if (top<=0) top = 0;
        this.top = top;
        this.canvas.style.left = this.left+'px';
        this.canvas.style.top = this.top+'px';
        
        this.w2D = s.w;
        this.h2D = s.h;
        
        if (!this.canvasFixedSize) {
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.rBuffer);
            this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.w, this.h);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.pickingTexture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.w, this.h, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
            this.canvas.width = this.w;
            this.canvas.height = this.h;
        }
    },
    getAvailableSpace: function() {
        var s = {w:0,h:0};
        s.w = parseInt(document.documentElement.clientWidth?document.documentElement.clientWidth:document.body.clientWidth);
        s.h = parseInt(document.documentElement.clientHeight?document.documentElement.clientHeight:document.body.clientHeight);

        if ((s.h<=0) || isNaN(s.h)) s.h = 0; 
        if ((s.w<=0) || isNaN(s.w)) s.w = 0;
        this.availSpace = s;
        return s;
    },
    onDblClick: function(e) {
        if (this.disabled) return false;
        if (this.moving2StartPos) return false;
        var dw, dh;
        var pos = this.getMousePos(e);
        var coords = {x: pos.x - this.w/2, y: this.h/2 - pos.y};
        
        var distanceX = this.distance;
        var distanceY = this.distance;
        var kX = 1;var kY = 1;
        if (!this.canvasFixedSize) {
            if (this.fixedSize) {
                kX = this.w/this.iniW;
                kY = this.h/this.iniH; 
            } else {
                if (this.w>=this.h) {
                    kX = this.w/this.h;
                } else {
                    kY = this.h/this.w;
                }
            }
        }
        distanceX *= kX;
        distanceY *= kY;
        dw = 2*distanceX/this.w;
        dh = 2*distanceY/this.h;
        
        coords.x *= dw; 
        coords.y *= dh; 

        var R = 0;
        if ((coords.x < distanceX) && (coords.x > -distanceX)
            && (coords.y < distanceY) && (coords.y > -distanceY)) {
            R = Math.sqrt(coords.x*coords.x + coords.y*coords.y);
        }
        if ((R>0) && (R<this.radius)) {

            //inside shpere
            var cosTheta = coords.y/this.radius;
            var sinTheta = Math.sqrt(1 - cosTheta*cosTheta);
            var theta = Math.acos(cosTheta);
            var rotX = 90 - theta/this.PI_180;

            var cosPhi = (sinTheta>0)?(coords.x/(this.radius*sinTheta)):-1;
            var phi = Math.acos(cosPhi);
            
            var rotY = -(90 - phi / this.PI_180);
            
            
            var targetX = this.rotation.x;
            var targetY = this.rotation.y;
            targetX += rotX;
            targetY += rotY;
            if (targetY > 360 || targetY <-360) {
                targetY = targetY % 360;
            }
            if (targetX >= 90) {
                targetX = 90;
            } else if (targetX <= -90) {
                targetX = -90;
            }
            
            this.rotation.targetX = targetX;
            this.rotation.targetY = targetY;
        }


        this.zoom(-1);
    },
    readOverPixel: function(e) {
        var readout = new Uint8Array(1 * 1 * 4); //read pixel
        var pos = this.getMousePos(e);
        var coords = {x: 0, y: 0};
        coords.x = pos.x;
        coords.y = this.h - pos.y;

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fBuffer);
        this.gl.readPixels(coords.x,coords.y,1,1,this.gl.RGBA,this.gl.UNSIGNED_BYTE,readout);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.overPixel = {
            color: [readout[0], readout[1], readout[2]],
            x: pos.x,
            y: pos.y
        }
    },
    showIconTooltip: function(icon, x, y) {
        this.clearIconTooltips();
        
        if (!this.tooltipNode) {
            this.tooltipNode = document.createElement('div');
            this.tooltipNode.className = 'globeIconTooltip';
            this.tooltipNode.style.display = 'none';
            document.body.appendChild(this.tooltipNode);
        }

        var left = x+5;
        var top = y+20;
        var txt = (this.test?icon.n:'') + icon.code + ' - ' + icon.name; 
        var tooltipW = 8*txt.length+6;
        var tooltipH = 12+4+10;

        if (left+tooltipW >= this.w)
            left = this.w - tooltipW - 1;
        if ((top + tooltipH) >= this.h)
            top = this.h - tooltipH - 1;

        this.tooltipNode.style.left = (this.left+left)+'px';
        this.tooltipNode.style.top = (this.top+top)+'px';

        this.tooltipNode.innerHTML = txt; 
        this.tooltipNode.style.display = 'block';
    },
    clearIconTooltips: function() {
        if (this.tooltipNode) {
            this.tooltipNode.style.display = 'none';
        }
    },
    compareReadout: function(readout, pColor) {
        var r = Math.round(pColor[0]*255);
        var g = Math.round(pColor[1]*255);
        var b = Math.round(pColor[2]*255);
        var isR = (Math.abs(r - readout[0]) <= 1);
        var isG = (Math.abs(g - readout[1]) <= 1);
        var isB = (Math.abs(b - readout[2]) <= 1);
        return (isR && isG && isB);
    },
    getMousePos: function(e) {
        var x, y;
        if (e.offsetX || e.offsetX == 0) {
            x = e.offsetX;
            y = e.offsetY;
        } else if (e.layerX || e.layerX == 0) {
            x = e.layerX;
            y = e.layerY;
        }
        return {'x': x, 'y': y};
    },
    onMouseDown: function(e) {
        if (this.disabled) return false;
        e.preventDefault();
        this.clearIconTooltips();
        this.canvas.addEventListener('mouseup', this.onMouseUp, false);
        
        var mousePos = this.getMousePos(e);
        this.mouseOnDown.x = mousePos.x;
        this.mouseOnDown.y = mousePos.y;

        this.canvas.style.cursor = 'move';
        this.mouse.down = true;
        
        this.rotation.targetX = this.rotation.x;
        this.rotation.targetY = this.rotation.y;
        this.mouse.x = mousePos.x;
        this.mouse.y = mousePos.y;
    },
    onMouseUp: function(e) {
        if (globeApp.disabled) return false;
        
        globeApp.canvas.removeEventListener('mouseup', globeApp.onMouseUp, false);
        globeApp.canvas.style.cursor = 'default';
        
        globeApp.mouse.down = false;
        
        if (globeApp.mouse.drag && !globeApp.moving2StartPos) {
            var zoomDamp = globeApp.distance/1000;
            var dRotX = globeApp.mouse.dy*globeApp.rotateEffectFactor*zoomDamp;
            var dRotY = globeApp.mouse.dx*globeApp.rotateEffectFactor*zoomDamp;
            globeApp.rotateXY(dRotX, dRotY, true);
        }
        
        globeApp.mouse.drag = false;
    },

    onMouseMove: function(e) { 
        if (this.disabled) return false;
        if (this.moving2StartPos) return false;//overPixel=null
        if (this.mouse.down) this.mouse.drag = true;
        var mousePos = this.getMousePos(e);

        if (!this.mouse.drag) {
            var t = (new Date() - 0);
            var d = t - this.lastTimePixelRead;
            if (d>=this.pixelReadDelta) {
                this.lastTimePixelRead = t;
                this.readOverPixel(e);
            }
            return;
        }
        if (this.moving2StartPos) return false;
        
        var dx = mousePos.x - this.mouse.x;
        var dy = mousePos.y - this.mouse.y;
        this.mouse.x = mousePos.x;
        this.mouse.y = mousePos.y;
        this.mouse.dx = dx;
        this.mouse.dy = dy;

        var zoomDamp = this.distance/1000;
        var dRotX = dy*this.rotateFactor*zoomDamp;
        var dRotY = dx*this.rotateFactor*zoomDamp;
        this.rotateXY(dRotX, dRotY);

    },
    
    rotateXY: function(dRotX, dRotY, set2Target) {
        var rotY = this.rotation.y;
        var rotX = this.rotation.x;
        rotX += dRotX;
        rotY += dRotY;
//        if (rotY > 360 || rotY <-360) {
//            rotY = rotY % 360;
//        }
        if (rotX >= 90) {
            rotX = 90;
        } else if (rotX <= -90) {
            rotX = -90;
        }
       
        if (set2Target) {
            if (rotY > 360) {
                rotY = rotY % 360;
                this.rotation.y -= 360;
            } else if (rotY < -360) {
                rotY = rotY % 360;
                this.rotation.y += 360;
            }
            this.rotation.targetX = rotX;
            this.rotation.targetY = rotY;
        } else {
            if (rotY > 360 || rotY <-360) {
                rotY = rotY % 360;
            }
            this.rotation.targetY = this.rotation.y = rotY;
            this.rotation.targetX = this.rotation.x = rotX;
        }
    },
    
    lookAt: function(lat, lng, set2Target) {
        lat = parseFloat(lat);
        lng = parseFloat(lng);
        if (isNaN(lat) || isNaN(lng) || (lat<-90) || (lat>90) || (lng<-180) || (lng>180)) {
            lat = 81;lng = 110;
        }
        if (set2Target) {
            this.rotation.targetX = lat;
            this.rotation.targetY = -lng;
        } else {
            this.rotation.targetX = this.rotation.x = lat;
            this.rotation.targetY = this.rotation.y = -lng;
        }
    },
    onMouseOut: function(e) {
        this.clearIconTooltips();
        this.overRenderer = false;
        this.canvas.removeEventListener('mouseup', globeApp.onMouseUp, false);
        this.canvas.style.cursor = 'default';
        this.mouse.down = false;
        this.mouse.drag = false;
        this.overPixel = null;
    },
    onMouseOver: function(e) {
        this.overRenderer = true;
    },
    onMouseWheel: function(e) {
        if (this.disabled) return false;
        if (!this.running) return false;
        if (this.moving2StartPos) return false;
        this.clearIconTooltips();
        if (!this.overRenderer) return;
        e.preventDefault();
        var dir;
        if (e.wheelDelta) {
            dir = (e.wheelDelta>0)?1:-1;
        } else if (e.detail) {
            dir = (e.detail>0)?-1:1;
        }
        
        this.zoom(-dir);
    },
    zoom: function(dir) {
        var d = dir*this.distanceTarget/2;
        this.distanceTarget += d;
        this.distanceTarget = this.distanceTarget > this.maxDistance ? this.maxDistance : this.distanceTarget;
        this.distanceTarget = this.distanceTarget < this.minDistance ? this.minDistance : this.distanceTarget;
    },
    initObjects: function() {
        var sphere = this.objects['sphere'];
        if (sphere) {
            var sphereData = glUtils.generateSphereData(this.radius, this.latCount, this.longCount);
            sphere['vertices'] = sphereData['vertices'];
            sphere['indices'] = sphereData['indices'];
            sphere['normals'] = sphereData['normals'];
            sphere['textureCoords'] = sphereData['textureCoords'];
        }


        var ring = this.objects['ring'];
        var ringData = glUtils.generateCircleData(this.radius+1, this.latCount, 0, 'z');
        ring['vertices'] = ringData['vertices'];
        ring['indices'] = ringData['indices'];
        ring['normals'] = ringData['normals'];
        
        this.initIcons();
        this.rearrangeIcons();
        
    },
    initIcons: function() {
        for (var i = 0;i<this.iconsCount;i++) {
            this.initIcon(this.icons[i]);
            this.setIconStartPosition(this.icons[i]);
        }
    },
    setIconsStartPosition: function() {
        for (var i = 0;i<this.iconsCount;i++) {
            this.setIconStartPosition(this.icons[i]);
        }
    },
    loadTestIcons: function() {
        var lat, lng,r,g,b, icon2DX, icon2DY;
        var c = 5; //50
        var r0 = this.radius+1;
        for (var i=0; i<c; i++) {
            lat = Math.random()*180 - 90;
            lng = Math.random()*360 - 180;
            r = 1.0;g = 1.0;b = 1.0;
            icon2DX = Math.random()*this.w2D;
            icon2DY = Math.random()*this.h2D;
            this.icons.push(
                {
                    n: i,
                    code: 'EUR',
                    name: 'EUROPA CITY',
                    lat: lat,
                    lng: lng,
                    lat0: lat, 
                    lng0: lng,
                    latT: lat, //lat target
                    lngT: lng, //lng target
                    r: r0,
                    rT: r0,
                    r0: r0,
                    ambient: [r,g,b,1],
                    scale: 1,
                    t0: 0,
                    pt0: 0,
                    pAlpha: 0,
                    textureCanBeUsed: false,
                    pTextureCanBeUsed: false,
                    textureImgSrc: 'textures/icons/icon_0.png',
                    pTextureImgSrc: 'textures/icons/picon.jpg',
                    rotX: 0,
                    rotY: 0,
                    rotZ: 0,
                    rotXT: 0,
                    rotYT: 0,
                    rotZT: 0,
                    x2D: icon2DX,
                    y2D: icon2DY,
                    isFav: 0
                }
            );
        }
        
        this.iconsCount = this.icons.length;
    },
    loadIcons: function(icons) {
        var icon, lat, lng, iconProps;
        var iconsCount = icons.length;
        var r0 = this.radius+1;
        for (var i = 0;i<iconsCount;i++) {
        	iconProps = icons[i];
            lat = parseFloat(iconProps.lat);
            lng = parseFloat(iconProps.lng);
            if (isNaN(lat) || isNaN(lng) || (lat<-90) || (lat>90) || (lng<-180) || (lng>180)) {
                lat = 81;lng = 110;
            }
            icon = {
                n: i,
                code: iconProps.code,
                name: iconProps.name,
                lat: lat,
                lng: lng,
                lat0: lat, 
                lng0: lng,
                latT: lat, 
                lngT: lng, 
                r: r0,
                rT: r0,
                r0: r0,
                textureImgSrc: iconProps.src,
                pTextureImgSrc: iconProps.pSrc,
                textureCanBeUsed: false,
                pTextureCanBeUsed: false,
                rotX: 0,
                rotY: 0,
                rotZ: 0,
                rotXT: 0,
                rotYT: 0,
                rotZT: 0,
                x2D: Math.random()*this.w2D,
                y2D: Math.random()*this.h2D,
                isFav: iconProps.isFav
            };
            if (iconProps.isFav) {
            	this.favicons.push(icon);
            }
            this.icons.push(icon);
        }
        
        this.iconsCount = this.icons.length;
        this.faviconsCount = this.favicons.length;
    },
    initIconsStartPosition: function(fromSizeW, fromSizeH, iconsData) {
        var iconData, icon;
        var iconsDataCount = iconsData.length;
        fromSizeW = parseInt(fromSizeW);
        fromSizeH = parseInt(fromSizeH);
        if (!isNaN(fromSizeW) && !isNaN(fromSizeH) && (fromSizeW>0) && (fromSizeH>0)) {
            this.w2D = fromSizeW;
            this.h2D = fromSizeH;
        }
        var favCorr = this.faviconSizePx/2;
        var corr = this.iconSizePx/2;
        for (var i = 0;i<iconsDataCount;i++) {
            iconData = iconsData[i];
            for (var j = 0;j<this.iconsCount;j++) {
                icon = this.icons[j];
                if (icon.code.toUpperCase()==iconData.code.toUpperCase()) {
                    icon.x2D = iconData.destX + ((this.mode == 'fav') ? favCorr : corr);
                    icon.y2D = iconData.destY + ((this.mode == 'fav') ? favCorr : corr);
                    break;
                }
            }
        }
    },
    icons2StartPosition: function(fromSizeW, fromSizeH, set2Target) {
        this.moving2StartPos = true;
        fromSizeW = parseInt(fromSizeW);
        fromSizeH = parseInt(fromSizeH);
        if (!isNaN(fromSizeW) && !isNaN(fromSizeH) && (fromSizeW>0) && (fromSizeH>0)) {
            this.w2D = fromSizeW;
            this.h2D = fromSizeH;
        } 
        
        this.rotation.x = this.rotation.y = this.rotation.z = 0;
        this.rotation.targetX = this.rotation.targetY = 0;
        this.distance = this.distanceTarget = this.initDistance;
        this.iconScaleSize = this.calcIconScaleSize();
        var sphere = this.objects['sphere'];
        if (sphere) {
            sphere.rotY = 450;
            sphere.rotYT = 0;
            sphere.scaleT = 0.01;
        }
        for (var i = 0;i<this.iconsCount;i++) {
            this.setIconStartPosition(this.icons[i], set2Target);
        }
    },
    initIcon: function(icon) {
        var iconSize_2 = this.iconSize/2;
        var vertices = [
            -iconSize_2, -iconSize_2, 0,
            -iconSize_2, iconSize_2, 0,
            iconSize_2, iconSize_2, 0,
            iconSize_2, -iconSize_2, 0
        ];
        var faviconSize_2 = this.faviconSize/2;
        var favvertices = [
            -faviconSize_2, -faviconSize_2, 0,
            -faviconSize_2, faviconSize_2, 0,
            faviconSize_2, faviconSize_2, 0,
            faviconSize_2, -faviconSize_2, 0
        ];

        var mMatrix = mat4.identity(); //model matrix
        var aMatrix = mat4.identity();
        var indices = [0,1,2, 0,2,3];
        var normals = glUtils.calculateNormals(vertices, indices);
        var favnormals = glUtils.calculateNormals(favvertices, indices);
        var textureCoords = [0.0,1.0, 0.0,0.0, 1.0,0.0, 1.0,1.0];
        
        if (!icon.ambient) icon.ambient = [1.0,1.0,1.0,1.0];
        icon.vertices = vertices;
        icon.favvertices = favvertices;
        icon.indices = indices;
        icon.normals = normals;
        icon.favnormals = favnormals;
        icon.mMatrix = mMatrix;
        icon.aMatrix = aMatrix;
        icon.textureCoords = textureCoords;
        icon.drawMethod = 'triangles';
        icon.vbo = null;
        icon.ibo = null;
        icon.nbo = null;
        icon.tbo = null;
        
        icon.scale = 1;
        icon.tt0 = 0;
        icon.toggling = false;
        icon.t0 = 0;
        icon.pt0 = 0;
        icon.pAlpha = 0;

        //generate unique picking color
        this.generateIconPColor(icon);
    },
    setIconStartPosition: function(icon, set2Target) {
        var iconX, iconY, iconZ;
//        var iconSize_2 = this.iconSize/2;
        var iconSize_2 = this[this.mode + 'iconSize']/2;
        var iconDistance = this.distance - 5;
        var maxZ = this.radius+3;
        if (iconDistance<maxZ) {
            iconDistance = maxZ;
        }
        var icon2DX = icon.x2D;
        var icon2DY = icon.y2D;
        var w2D = this.w2D;
        var h2D = this.h2D;
        
        var frustrum = this.getFrustrum();
        
        var transCX  = 1;var transCY = 1; 
        transCX = this.w/w2D;
        transCY = this.h/h2D;
        
        iconZ = iconDistance;
        iconX = (icon2DX*transCX - this.w/2)*(2*frustrum[0]/this.w);
        iconY = (this.h/2 - icon2DY*transCY)*(2*frustrum[1]/this.h);
        if (iconX>(frustrum[0]-iconSize_2)) {
            iconX = frustrum[0]-iconSize_2;
        } else if (iconX<(-frustrum[0]+iconSize_2)) {
            iconX = -frustrum[0]+iconSize_2;
        }
        if (iconY>(frustrum[1]-iconSize_2)) {
            iconY = frustrum[1]-iconSize_2;
        } else if (iconY<(-frustrum[1]+iconSize_2)) {
            iconY = -frustrum[1]+iconSize_2;
        }
        
        iconDistance = Math.sqrt(iconX*iconX+iconY*iconY+iconZ*iconZ);
        var iconStartLat = Math.asin(iconY/iconDistance);
        var iconStartLng = Math.asin(iconX/iconDistance/Math.cos(iconStartLat))/this.PI_180;
        iconStartLat /= this.PI_180;
        if (isNaN(iconStartLng)) {
            iconStartLat = 90;
            iconStartLng = 0;
        }
        if (set2Target) {
            icon.latT = iconStartLat;
            icon.lngT = iconStartLng;
            icon.rotXT = icon.latT; 
            icon.rotYT = -icon.lngT; 
            icon.rotZT = 0;
            icon.rT = iconDistance;
        } else {
            icon.lat = iconStartLat;
            icon.lng = iconStartLng;
            icon.rotX = icon.lat; 
            icon.rotY = -icon.lng; 
            icon.rotZ = 0;
            icon.r = iconDistance;
        }
    },
    generateIconPColor: function(icon) {
        var pColor = [0, 0, 0, 1];
        var st = 0.05; //1/20=0.05
        var n = icon.n;
        if (n>7999) n = 7999;
        
        var r = Math.floor(n/400)*st;
        var g = Math.floor((n%400)/20)*st;
        var b = (n%20)*st;
        pColor[0] = r+0.02;
        pColor[1] = g+0.02;
        pColor[2] = b+0.02;
        icon.pColor = pColor;
    },
    initProgram: function() {
        var shaderSrc = this.fgShader.join('\n');
        var fgShader = glUtils.createShader(this.gl, shaderSrc, 'fragment');
        shaderSrc = this.vxShader.join('\n');
        var vxShader = glUtils.createShader(this.gl, shaderSrc, 'vertex');
        
        this.prg = this.gl.createProgram();
        this.gl.attachShader(this.prg, vxShader);
        this.gl.attachShader(this.prg, fgShader);
        this.gl.linkProgram(this.prg);
        this.gl.useProgram(this.prg);
        //the following lines allow us obtaining a reference to the uniforms and attributes defined in the shaders.
        this.prg.aVertexPosition = this.gl.getAttribLocation(this.prg, "aVertexPosition");
        this.prg.aVertexNormal = this.gl.getAttribLocation(this.prg, "aVertexNormal");
        
        //light
        this.prg.uMaterialDiffuse = this.gl.getUniformLocation(this.prg, "uMaterialDiffuse");
        this.prg.uMaterialAmbient = this.gl.getUniformLocation(this.prg, "uMaterialAmbient");
        this.prg.uMaterialSpecular = this.gl.getUniformLocation(this.prg, "uMaterialSpecular");
        this.prg.uLightDiffuse = this.gl.getUniformLocation(this.prg, "uLightDiffuse");
        this.prg.uLightAmbient = this.gl.getUniformLocation(this.prg, "uLightAmbient");
        this.prg.uLightSpecular = this.gl.getUniformLocation(this.prg, "uLightSpecular");
        this.prg.uLightDirection = this.gl.getUniformLocation(this.prg, "uLightDirection");
        this.prg.uShininess = this.gl.getUniformLocation(this.prg, "uShininess");
        //matrices
        this.prg.uPMatrix = this.gl.getUniformLocation(this.prg, "uPMatrix");
        this.prg.uNMatrix = this.gl.getUniformLocation(this.prg, "uNMatrix");
        this.prg.uMMatrix = this.gl.getUniformLocation(this.prg, "uMMatrix");
        this.prg.uVMatrix = this.gl.getUniformLocation(this.prg, "uVMatrix");
        this.prg.uAMatrix = this.gl.getUniformLocation(this.prg, "uAMatrix");
        //texture
        this.prg.aVertexTextureCoords = this.gl.getAttribLocation(this.prg, "aVertexTextureCoords");
        this.prg.uSampler = this.gl.getUniformLocation(this.prg, "uSampler");
        this.prg.uSamplerP = this.gl.getUniformLocation(this.prg, "uSamplerP");
        this.prg.uUseTexture = this.gl.getUniformLocation(this.prg, "uUseTexture");
        this.prg.uUseTextureP = this.gl.getUniformLocation(this.prg, "uUseTextureP");
        this.prg.uTexturePAlpha = this.gl.getUniformLocation(this.prg, "uTexturePAlpha");
        this.prg.uDoNotApplyVMatrix = this.gl.getUniformLocation(this.prg, "uDoNotApplyVMatrix");
        
        //picking
        this.prg.uPickingColor = this.gl.getUniformLocation(this.prg, "uPickingColor");
        this.prg.uOffscreen = this.gl.getUniformLocation(this.prg, "uOffscreen");
    },    
    initLights: function() {
        this.gl.uniform3fv(this.prg.uLightDirection, [0.0, 0.0, -1.0]);
        this.gl.uniform4fv(this.prg.uLightDiffuse, [1.0,1.0,1.0,1.0]); 
        this.gl.uniform4fv(this.prg.uLightSpecular, [1.0,1.0,1.0,1.0]); 
        this.gl.uniform4fv(this.prg.uLightAmbient, [1.0,1.0,1.0,1.0]);
        this.gl.uniform4fv(this.prg.uMaterialAmbient, [0.0,0.0,1.0,1.0]);
        this.gl.uniform4fv(this.prg.uMaterialDiffuse, [0.0,0.0,1.0,1.0]);
        this.gl.uniform4fv(this.prg.uMaterialSpecular, [1.0,1.0,1.0,1.0]);
        this.gl.uniform1f(this.prg.uShininess, 10.0);
    },    
    initBuffers: function() {
        for (var objName in this.objects) {
            this.initObjBuffers(objName, this.objects[objName]);
        }
        for (var i = 0;i<this.iconsCount;i++) {
            this.initObjBuffers('icon'+i, this.icons[i]);
        }
        /* for picking based on color */
        this.rBuffer = this.gl.createRenderbuffer(); //render buffer
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.rBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.w, this.h);

        this.pickingTexture = this.gl.createTexture(); //texture for picking
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.pickingTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.w, this.h, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

        this.fBuffer = this.gl.createFramebuffer(); //framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fBuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.pickingTexture, 0);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.rBuffer);

        /* unbind buffers */
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    },
    initObjBuffers: function(objName, obj) {
        var isIcon = (objName.substr(0,4)=='icon');
        obj.vbo = this.gl.createBuffer();//iconScaleSize
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vbo);
        if (isIcon) {
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(obj[this.mode + 'vertices']), this.gl.STATIC_DRAW);
            if (!obj[this.mode + 'normals'].length) {
                obj[this.mode + 'normals'] = glUtils.calculateNormals(obj[this.mode + 'vertices'], obj.indices);
            }
        } else {
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(obj.vertices), this.gl.STATIC_DRAW);
            if (!obj.normals.length) {
                obj.normals = glUtils.calculateNormals(obj.vertices, obj.indices);
            }
        }
        
        obj.nbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.nbo);
        if (isIcon) {
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(obj[this.mode + 'normals']), this.gl.STATIC_DRAW);
        } else {
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(obj.normals), this.gl.STATIC_DRAW);
        }
        obj.ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obj.indices), this.gl.STATIC_DRAW);
        /* texture */

        if (((objName=='sphere') || isIcon) && obj.textureCoords && (obj.textureCoords.length>0)) {
            obj.tbo = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.tbo);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(obj.textureCoords), this.gl.STATIC_DRAW);
        }
    },
    renderLoop: function(t2, t1) {
        if (!this.noRender) {
            this.update(t2, t1);
            this.render(t2, t1);
        }
        this.requestFrame();
    },
    updateSphere: function(t2, t1) {
        var sphere = this.objects['sphere'];
        if (!sphere) return;
        var dRotY = (sphere.rotYT - sphere.rotY) * this.globeMoveFactor;
        if (Math.abs(dRotY)<0.1) sphere.rotY = sphere.rotYT; else sphere.rotY += dRotY; 
        sphere.mMatrix = mat4.identity();
        mat4.rotate(sphere.mMatrix, sphere.rotY * this.PI_180, [0,1,0]);
        

        var dScale = (sphere.scaleT - sphere.scale) * this.globeMoveFactor;
        if (Math.abs(dScale)<0.0001) sphere.scale = sphere.scaleT; else sphere.scale += dScale; //was 0.01
        mat4.scale(sphere.mMatrix, [sphere.scale, sphere.scale, sphere.scale]);
        
        
        var ring = this.objects['ring'];
        if (!ring) return;
        ring.mMatrix = mat4.identity();
        mat4.scale(ring.mMatrix, [sphere.scale, sphere.scale, sphere.scale]);
    },
    update: function(t2, t1) {
        var d = (this.distanceTarget - this.distance) * this.zoomFactor;
        if (Math.abs(d)<0.1) this.distance = this.distanceTarget; else this.distance += d;
        
        var dRotX = (this.rotation.targetX - this.rotation.x) * this.zoomFactor;
        var dRotY = (this.rotation.targetY - this.rotation.y) * this.zoomFactor;
        
        var rotYOnT = false;
        var rotXOnT = false;
        if (Math.abs(dRotX)<0.02) {
            this.rotation.x = this.rotation.targetX;
            rotXOnT = true;
        } else this.rotation.x += dRotX;
        if (Math.abs(dRotY)<0.02) {
            this.rotation.y = this.rotation.targetY; 
            rotYOnT = true;
        } else this.rotation.y += dRotY;
        if (rotXOnT && rotYOnT && this.rotateCB) {
            this.rotateCB();
            this.unsetRotateCB();
        }

        
        /* update sphere */
        this.updateSphere(t2, t1);
        
        var iconScaleSize = this.calcIconScaleSize();
        if (iconScaleSize!=this.iconScaleSize && this.distance == this.distanceTarget) {
            this.iconScaleSize = iconScaleSize;
            this.rearrangeIcons();
        }
        this.iconsUpdate(t2, t1);
    },
    iconsUpdate: function(t2, t1) {
        var overScale = this[this.mode + 'overScale'];
        var scaleFromOnMouseOut = overScale/3*2;
        if (overScale <= 1) scaleFromOnMouseOut = 1;

        var icon;
        var pickIcon = null;
        var factor0, idt0, pFactor0, pdt0;
        var iconsOnTarget = 0;var onTarget;
        var iconsToggled = 0;
        var dLat, dLng, dR, dRotX, dRotY, dRotZ;
        var tdt0;
        for (var i = 0;i<this[this.mode + 'iconsCount'];i++) {
            onTarget = 0;
            icon = this[this.mode + 'icons'][i];
            idt0 = t2 - icon.t0;
            pdt0 = t2 - icon.pt0;
            
            if (!this.moving2StartPos && !pickIcon) {
                if (this.overPixel && icon.pColor && this.compareReadout(this.overPixel.color, icon.pColor)) {
                    pickIcon = icon;
                }
            }
            
            if (this.togglingMode !== false) {
                tdt0 = t2 - icon.tt0;
                if (!icon.toggling) {
                    tdt0 = 0;
                    icon.tt0 = t2;
                    icon.toggling = true;
                }

                if (icon.scale > 1) {
                    
                    
                    icon.scale = glUtils.easeOutQuad(tdt0, this.modeScaleRatio, (1-this.modeScaleRatio), this.togglingDuration);
                    if (icon.scale <= 1) {
                        icon.scale = 1;
                        icon.tt0 = 0;
                        icon.toggling = false;
                    }
                } else if (icon.scale < 1) {
                    
                    icon.scale = glUtils.easeOutQuad(tdt0, this.modeRevScaleRatio, (1-this.modeRevScaleRatio), this.togglingDuration);
                    if (icon.scale >= 1) {
                        icon.scale = 1;
                        icon.tt0 = 0;
                        icon.toggling = false;
                    }
                    
                } else {
                    icon.scale = 1;
                    icon.tt0 = 0;
                    icon.toggling = false;
                }
                
                if (!icon.toggling) iconsToggled++;
                
            } else {
            
                if (pickIcon && (pickIcon.n==icon.n)) {
                    factor0 = 1;
                    pFactor0 = 0;
                    if ((this.pickIcon===null) || (this.pickIcon.n!=icon.n)) {
                        icon.t0 = t2;
                        idt0 = 0;
                        factor0 = icon.scale;

                        icon.pt0 = t2;
                        pdt0 = 0;
                        pFactor0 = icon.pAlpha;
                    }
                    icon.pAlpha = glUtils.easeOutQuad(pdt0, pFactor0, (1-pFactor0), this.pIconAlphaDuration);
                    if (icon.pAlpha>=1) icon.pAlpha = 1;
                    icon.scale = glUtils.easeOutQuad(idt0, factor0, (overScale-factor0), this.overScaleDuration);
                    if (icon.scale>=overScale) icon.scale = overScale;
                } else if (icon.scale>1) {
                    factor0 = scaleFromOnMouseOut;
                    icon.pAlpha = 0;
                    if ((this.pickIcon!==null) && (this.pickIcon.n==icon.n)) { 
                        icon.t0 = t2;
                        idt0 = 0;
                        if (icon.scale>=scaleFromOnMouseOut) icon.scale = scaleFromOnMouseOut;
                        factor0 = icon.scale;
                    }
                    icon.scale = glUtils.easeOutQuad(idt0, factor0, (1-factor0), this.overScaleDuration);
                    if (icon.scale<=1) icon.scale = 1;
                } else {
                    icon.pAlpha = 0;
                    icon.scale = 1;
                    icon.t0 = 0;
                }
            
            }
            
            dLat = (icon.latT - icon.lat) * this.iconMoveFactor;
            if (Math.abs(dLat)<0.1) {
                icon.lat = icon.latT; 
                onTarget++;
            } else icon.lat += dLat;
            
            dLng = (icon.lngT - icon.lng) * this.iconMoveFactor;
            if (Math.abs(dLng)<0.1) {
                icon.lng = icon.lngT; 
                onTarget++;
            } else icon.lng += dLng;
            
            dR = (icon.rT - icon.r) * this.iconMoveFactor;
            if (Math.abs(dR)<0.1) {
                icon.r = icon.rT; 
                onTarget++;
            } else icon.r += dR;   
            
            
            dRotX = (icon.rotXT - icon.rotX) * this.iconMoveFactor;
            if (Math.abs(dRotX)<0.1) {
                icon.rotX = icon.rotXT; 
                onTarget++;
            } else icon.rotX += dRotX;
            dRotY = (icon.rotYT - icon.rotY) * this.iconMoveFactor;
            if (Math.abs(dRotY)<0.1) {
                icon.rotY = icon.rotYT; 
                onTarget++;
            } else icon.rotY += dRotY;
            dRotZ = (icon.rotZT - icon.rotZ) * this.iconMoveFactor;
            if (Math.abs(dRotZ)<0.1) {
                icon.rotZ = icon.rotZT;
                onTarget++;
            } else icon.rotZ += dRotZ;
            

            if (onTarget==6) iconsOnTarget++; 
            icon.mMatrix = mat4.identity();
            mat4.rotate(icon.mMatrix, icon.lng * this.PI_180, [0,1,0]);
            mat4.rotate(icon.mMatrix, -icon.lat * this.PI_180, [1,0,0]);
            mat4.translate(icon.mMatrix, [0,0,icon.r]);
            
        }
        if (pickIcon) {
            this.canvas.style.cursor = 'pointer';
            this.showIconTooltip(pickIcon, this.overPixel.x, this.overPixel.y);
        } else {
            if (!this.mouse.drag) this.canvas.style.cursor = 'default';
            else this.canvas.style.cursor = 'move';
            this.clearIconTooltips();
        }
        
        this.pickIcon = pickIcon;
        
        var toggleDone = ((this.togglingMode === false) || (iconsToggled >= this.faviconsCount));
        var moveDone = (iconsOnTarget >= this[this.mode + 'iconsCount']);
        
        if (this.moving2StartPos) {
            if (toggleDone && moveDone) {
                
                if (this.icons2StartPositionCB) {
                    this.icons2StartPositionCB();
                    this.unsetIcons2StartPositionCB();
                }
                
                this.resetIconScales();
                this.moving2StartPos = false;
                this.togglingMode = false;
            }
        }

    },
    resetIconScales: function() {
        var icon;
        for (var i = 0;i<this.iconsCount;i++) {
            icon = this.icons[i];
            icon.scale = 1;
            icon.tt0 = 0;
            icon.toggling = false;
        }
    },
    draw: function(offbuffer) {
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
//        this.gl.enable(this.gl.ANTIALIAS);
        this.gl.depthFunc(this.gl.LEQUAL);
//        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true); //for texture
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.viewport(0, 0, this.w, this.h);

        this.gl.uniformMatrix4fv(this.prg.uVMatrix, false, this.vMatrix);
        this.gl.uniformMatrix4fv(this.prg.uPMatrix, false, this.pMatrix);
        
        /*draw objects here*/
        this.gl.enableVertexAttribArray(this.prg.aVertexPosition);
        this.gl.enableVertexAttribArray(this.prg.aVertexNormal);


        for (var i = 0;i<this[this.mode + 'iconsCount'];i++) {
            this.repaintObj('icon'+i, this[this.mode + 'icons'][i], offbuffer);
        }
        for (var objName in this.objects) {
            if (!offbuffer || (objName=='sphere')) {//only icons and globe are pickable
                this.repaintObj(objName, this.objects[objName], offbuffer);
            }
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    },
    getFrustrum: function() {
        var zDist = Math.abs(this.distance);
        var maxZ = this.radius+this.maxIconsAboveH+5;
        if (zDist<maxZ) {
            zDist = maxZ;
        }
        var xDist = this.distance;
        var yDist = this.distance;
        var kX = 1;var kY = 1;
        if (this.fixedSize) {
            kX = this.w/this.iniW;
            kY = this.h/this.iniH;
        } else {
            if (this.w>=this.h) {
                kX = this.w/this.h;
            } else {
                kY = this.h/this.w;
            }
        }
        xDist *= kX;
        yDist *= kY;
        
        return [xDist, yDist, zDist];
    },
    render: function(t2, t1) {
        /* view matrix */
        mat4.identity(this.vMatrix);
        mat4.rotate(this.vMatrix, this.rotation.x*this.PI_180, [1,0,0]);
        mat4.rotate(this.vMatrix, this.rotation.y*this.PI_180, [0,1,0]);

        /* projection matrix */
        mat4.identity(this.pMatrix);
        //frustrum
        var frustrum = this.getFrustrum();
        mat4.ortho(-frustrum[0], frustrum[0], -frustrum[1], frustrum[1], -frustrum[2], frustrum[2], this.pMatrix);
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fBuffer);
        this.gl.uniform1i(this.prg.uOffscreen, true);
        this.draw(true); 
        
        this.gl.uniform1i(this.prg.uOffscreen, false);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.draw(false); 
        return;
    },
    repaintObj: function(objName, obj, offbuffer) {
        var isIcon = (objName.substr(0,4)=='icon');
        /* texture buffer */
        var useTexture = !offbuffer && obj.textureCoords && (obj.textureCoords.length>0)
        && (((objName=='sphere') && this.textureCanBeUsed) || (isIcon && obj.textureCanBeUsed));

        var iconScale = this.distance/this.maxDistance;
        if (isIcon) {
            if (!offbuffer && (obj.scale != 1)) {
                iconScale *= obj.scale;
            }
            
            mat4.identity(obj.aMatrix);
            mat4.rotate(obj.aMatrix, obj.rotZ*this.PI_180, [0,0,1]);
            mat4.rotate(obj.aMatrix, obj.rotX*this.PI_180, [1,0,0]);
            mat4.rotate(obj.aMatrix, obj.rotY*this.PI_180, [0,1,0]);
            mat4.scale(obj.aMatrix, [iconScale, iconScale, 0]);
        }


        this.gl.uniform4fv(this.prg.uMaterialAmbient, obj.ambient);
        this.gl.uniformMatrix4fv(this.prg.uMMatrix, false, obj.mMatrix);
        this.gl.uniformMatrix4fv(this.prg.uAMatrix, false, obj.aMatrix);

        if (useTexture) {
            this.gl.enableVertexAttribArray(this.prg.aVertexTextureCoords);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.tbo);
            this.gl.vertexAttribPointer(this.prg.aVertexTextureCoords, 2, this.gl.FLOAT, false, 0, 0);
            
            if (isIcon) {

                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, obj.texture);
                this.gl.uniform1i(this.prg.uSampler, 0);
                
                if ((obj.pAlpha>0) && obj.pTextureCanBeUsed) {
                    this.gl.activeTexture(this.gl.TEXTURE1);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, obj.pTexture);
                    this.gl.uniform1i(this.prg.uSamplerP, 1);

                    this.gl.uniform1i(this.prg.uUseTextureP, true);
                    this.gl.uniform1f(this.prg.uTexturePAlpha, obj.pAlpha);
                } else {
                    this.gl.uniform1i(this.prg.uUseTextureP, false);
                }
            } else {
                this.gl.uniform1i(this.prg.uUseTextureP, false);
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
                this.gl.uniform1i(this.prg.uSampler, 0);
            }

            this.gl.uniform1i(this.prg.uUseTexture, true);
        } else {
            this.gl.uniform1i(this.prg.uUseTexture, false);
            this.gl.uniform1i(this.prg.uUseTextureP, false);
        }
        if (objName=='ring') {
            this.gl.uniform1i(this.prg.uDoNotApplyVMatrix, true);
        } else {
            this.gl.uniform1i(this.prg.uDoNotApplyVMatrix, false);
        }
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.nbo);
        this.gl.vertexAttribPointer(this.prg.aVertexNormal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, obj.vbo);
        this.gl.vertexAttribPointer(this.prg.aVertexPosition, 3, this.gl.FLOAT, false, 0, 0);
        
        if (offbuffer && obj.pColor) {
            this.gl.uniform4fv(this.prg.uPickingColor, obj.pColor);
        }
        this.drawObj(obj);

    },
    //draw object call
    drawObj: function(obj) {      
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, obj.ibo);
        switch (obj.drawMethod) {
            case 'triangles':
                this.gl.drawElements(this.gl.TRIANGLES, obj.indices.length, this.gl.UNSIGNED_SHORT, 0);
            break;
            case 'lines':
                this.gl.drawElements(this.gl.LINES, obj.indices.length, this.gl.UNSIGNED_SHORT, 0);
            break;                
            case 'line_loop':
                this.gl.drawElements(this.gl.LINE_LOOP, obj.indices.length, this.gl.UNSIGNED_SHORT, 0);
            break;
            default:
            break;
        }
    },
    requestFrame: function() {
        var t1 = glUtils.getAnimTime();
        var ths = this;
        glUtils.getCanvasRequestAnimFrameFunc()(function(t2){
            t2 = t2 || (new Date() - 0);
            ths.renderLoop(t2, t1);
        });
    }
    
}