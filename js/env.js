//==============================================================================
// Author: Nergal
// Date: 2014-06-12
//==============================================================================
"use strict";

function Object3D() {
    // THREE.Mesh.apply(this, arguments); inherite from mesh
    this.mesh;
    this.uniforms;
    this.attributes;
    this.time;
    this.remove = 0;
    this.meshes = new Array();

    Object3D.prototype.Die = function() {
        //game.scene.remove(this.mesh);
        for(var i = 0; i < this.meshes.length; i++) {
            game.scene.remove(this.meshes[i]);
        }
        this.remove = 1;
    };

    Object3D.prototype.Hit = function() {
        if(this.type != "water" && this.type != "terrain") {
            //	    ExplodeMesh(this);
        }
    };

    Object3D.prototype.GetObject = function() {
        return this.mesh;
    };

    Object3D.prototype.Draw = function() {
        //draw object
        if(this.hit) {
            if(this.time_start == -1) {
                this.time_start = time;
            } 
            time = 0.1+(time - this.time_start);

            var g = -(10+Math.random()*10);
            power = 1;
            compvely = 5;

            var y_ = GetWorldY(this.mesh);
            if(this.mesh.position.y > 0 && this.mesh.position.y > y_) {
                var t = time/5;
                this.mesh.translateY((compvely * t) + (0.4)*g*(t*t));
                this.mesh.translateZ(1*power);
                //this.mesh.translateX(0.5-Math.random()*2+Math.sin(Math.PI*delta));

                this.uniforms.time.value += 0.5;
            } else {
                this.Die();
            }
        }
    };

    Object3D.prototype.AddToScene = function(scene) {
        scene.add(this.mesh);
    };
}

/////////////////////////////////////////////////////////////
// Tree
/////////////////////////////////////////////////////////////
function Tree() {
    Object3D.call(this);
    Tree.prototype.type = "tree";

    Tree.prototype.Create = function(x, y, z, s, id) {
        var group = new THREE.Object3D();
        var combined = new THREE.Geometry();
        this.id = id;

        // Create leaves
        var texture = THREE.ImageUtils.loadTexture( "textures/leaves2.png" );
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        var tree_material = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, ambient: 0x00FFAA, map: texture } ); // 336633
        for(var i = 0; i < 5; i++) {
            var object = new THREE.Mesh( new THREE.SphereGeometry( 15, 15, 5 ), tree_material );
            object.position.set( Math.random()*13, Math.random()*15+25, Math.random()*13);
            THREE.GeometryUtils.merge(combined, object);
            combined.geometry.merge(object);
        }
        var mesh = new THREE.Mesh(combined, tree_material);

        //	mesh.castShadow = true;
        //	mesh.receiveShadow = true;
        group.add(mesh);

        // Create tree-base
        var texture = THREE.ImageUtils.loadTexture( "textures/wood1.jpg" );
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 2, 2 );
        var base_material = new THREE.MeshLambertMaterial( { color: 0x996600, map: texture} ); // 996600
        var object = new THREE.Mesh( new THREE.CylinderGeometry( 2, 7, 35, 20, 5, true ), base_material);
        object.position.set( 5, 0, 5 );
        //object.castShadow = true;
        //object.receiveShadow = true;
        group.add( object );
        group.scale.set(s, s, s);
        group.position.set(x, y ,z);
        this.mesh = group;
        CreateBoundingBox(this);
        game.scene.add(group);
    };

    Tree.prototype.Draw = function(time, delta , index) {

    };
}
Tree.prototype = new Object3D();
Tree.prototype.constructor = Tree;


/////////////////////////////////////////////////////////////
// Sun
/////////////////////////////////////////////////////////////
function Sun() {
    Object3D.call(this);
    this.renderer = 0;
    this.skycolor = 0;

    Sun.prototype.Create = function(x, y, z, scene, renderer) {
        this.renderer = renderer;
        var lightTarget = new THREE.Object3D();
        lightTarget.position.set(0, 0, 0);
        scene.add(lightTarget);
        var spotlight = new THREE.SpotLight(0xffffff);
        spotlight.position.set(0, 6500, 0);
        spotlight.shadowCameraVisible = false; //true;
        spotlight.shadowDarkness = 0.65; // 0.35
        spotlight.shadowCameraNear = 3000;
        spotlight.shadowCameraFar = 10000;
        spotlight.intensity = 1.7; // 0.5; day = 1.9
        //spotlight.castShadow = true;
        spotlight.shadowMapHeight =  1024;
        spotlight.shadowMapWidth = 1024;
        spotlight.target = lightTarget;
        this.light = spotlight;
        scene.add(spotlight);

        var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
        hemiLight.color.setHSL( 0.2, 1, 0.2 );
        hemiLight.groundColor.setHSL( 1, 1, 1 );
        hemiLight.position.set( 0, 1000, 0 );
        hemiLight.intensity = 0.7; // 0.06 day = 1.0

        // Without draw
        this.skycolor = 255; // day = 255
        this.renderer.setClearColor(rgbToHex(this.skycolor-200, this.skycolor-100, this.skycolor), 1);
        scene.fog = new THREE.FogExp2(rgbToHex(this.skycolor-200, this.skycolor-100, this.skycolor), 0.00015 );

        scene.add( hemiLight );
        this.hemiLight = hemiLight;

        var customMaterial = new THREE.ShaderMaterial( 
                                                      {
                                                          uniforms: {  },
                                                          vertexShader:   document.getElementById( 'sunVertexShader'   ).textContent,
                                                          fragmentShader: document.getElementById( 'sunFragmentShader' ).textContent,
                                                          side: THREE.BackSide,
                                                          blending: THREE.AdditiveBlending,
                                                          transparent: true
                                                      }   );

    };


    Sun.prototype.Draw = function(time, delta) {
        var e_angle = 0.01 * time * 0.1;
        this.light.position.set(6500* Math.cos(e_angle), 6500* Math.sin(e_angle)-1000, 0); // 6500

        if(this.light.position.y > -500 && this.light.position.x > 0) {
            if(this.skycolor < 254) {
                this.renderer.setClearColor(rgbToHex(this.skycolor-200, this.skycolor-100, this.skycolor), 1);
                scene.fog = new THREE.FogExp2(rgbToHex(this.skycolor-200, this.skycolor-100, this.skycolor), 0.00015 );
                this.skycolor += 1;
            }

            if(this.hemiLight.intensity < 0.6) {
                this.hemiLight.intensity += 0.001;
            }
            if(this.light.intensity < 1.5) {
                this.light.intensity += 0.001;
            }
        }
        if(this.light.position.y < 300 && this.light.position.x < 0) {	
            if(this.skycolor > 1) {
                this.renderer.setClearColor(rgbToHex(this.skycolor-200, this.skycolor-100, this.skycolor), 1);
                scene.fog = new THREE.FogExp2(rgbToHex(this.skycolor-200, this.skycolor-100, this.skycolor), 0.00025 );
                this.skycolor -= 1;
            }
            if(this.hemiLight.intensity > 0.05) {
                this.hemiLight.intensity -= 0.001;
            }
            if(this.light.intensity > 0.005) {
                this.light.intensity -= 0.001;
            }
        }
        if(this.light.position.z > 5000) {
            this.light.position.z = -5000;
            this.mesh.position.z = -5000;
        }
    };
}
Sun.prototype = new Object3D();
Sun.prototype.constructor = Sun;

/////////////////////////////////////////////////////////////
// Tower
/////////////////////////////////////////////////////////////
function Tower() {
    Object3D.call(this);

    Tower.prototype.Create = function(x, y, z, scale) {
        var object = game.modelLoader.GetModel("watchtower");
        object.position.set(x,y,z);
        object.scale.set(scale, scale, scale);
        this.mesh = object;
        game.scene.add(object);
    };

}
Tower.prototype = new Object3D();
Tower.prototype.constructor = Tower;

/////////////////////////////////////////////////////////////
// Flower
/////////////////////////////////////////////////////////////
function Flower() {
    Object3D.call(this);

    Flower.prototype.Create = function(x, y, z, scale, type) {
        var object = modelLoader.GetModel('flower'+type);
        object.position.set(x,y,z);
        object.rotation.set(0, Math.random()*Math.PI, 0);
        object.scale.set(scale, scale, scale);
        CreateBoundingBox(this);
        scene.add(object);
    };

}
Flower.prototype = new Object3D();
Flower.prototype.constructor = Flower;

/////////////////////////////////////////////////////////////
// Terrain
/////////////////////////////////////////////////////////////
function Terrain() {
    Object3D.call(this);
    this.noise = 0;
    this.type = "terrain";

    Terrain.prototype.GetNoise = function()  {
        return this.noise;
    };
    Terrain.prototype.GetTerrain = function()  {
        return this.mesh.geometry.vertices;
    };

    Terrain.prototype.Create = function(scene) {
        var noise     = this.GenerateNoise();

        var canvas  = document.getElementById('noise_1');
        var context = canvas.getContext('2d');

        for(var x = 0; x < noise.length; x++)
        {
            for(var y = 0; y < noise[x].length; y++)
            {
                var color = Math.round((255 * noise[x][y]));
                if(color < 0) color = 0;
                context.fillStyle = "rgb("+color+", "+color+", "+color+")";
                context.fillRect(x, y, 1, 1);
            }
        }
        //	context2.drawImage(canvas, 0, 0);
        this.noise = noise;

        var bumpTexture = new THREE.ImageUtils.loadTexture(canvas.toDataURL());
        bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping; 
        var bumpScale   = 200.0;


        var oceanTexture = new THREE.ImageUtils.loadTexture( 'textures/sand-512.jpg' );
        oceanTexture.wrapS = oceanTexture.wrapT = THREE.RepeatWrapping; 

        var sandyTexture = new THREE.ImageUtils.loadTexture( 'textures/sand2.png' );
        sandyTexture.wrapS = sandyTexture.wrapT = THREE.RepeatWrapping; 

        var grassTexture = new THREE.ImageUtils.loadTexture( 'textures/grass.png' );
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping; 

        var rockyTexture = new THREE.ImageUtils.loadTexture( 'textures/rock_n1.jpg' );
        rockyTexture.wrapS = rockyTexture.wrapT = THREE.RepeatWrapping; 

        var snowyTexture = new THREE.ImageUtils.loadTexture( 'textures/snow-512.jpg' );
        snowyTexture.wrapS = snowyTexture.wrapT = THREE.RepeatWrapping; 


        var customUniforms = {
            bumpTexture:	{ type: "t", value: bumpTexture },
            bumpScale:	    { type: "f", value: bumpScale },
            oceanTexture:	{ type: "t", value: oceanTexture },
            sandyTexture:	{ type: "t", value: sandyTexture },
            grassTexture:	{ type: "t", value: grassTexture },
            rockyTexture:	{ type: "t", value: rockyTexture },
            snowyTexture:	{ type: "t", value: snowyTexture },
        };

        var customMaterial = new THREE.ShaderMaterial( 
                                                      {
                                                          uniforms: customUniforms,
                                                          vertexShader:   document.getElementById( 'terrainVertexShader'   ).textContent,
                                                          fragmentShader: document.getElementById( 'terrainFragmentShader' ).textContent,
                                                          transparent: true,
                                                          depthWrite: true,
                                                          depthTest: true,
                                                      }   );

                                                      var planeGeo = new THREE.PlaneGeometry( 3000, 3000, 100, 100 );
                                                      var plane = new THREE.Mesh(	planeGeo, customMaterial );
                                                      plane.rotation.x = -Math.PI / 2;
                                                      this.mesh = plane;
                                                      scene.add( plane );
    };

    Terrain.prototype.GenerateNoise = function () {
        var noiseArr = new Array();

        for(var i = 0; i <= 15; i++)
        {
            noiseArr[i] = new Array();

            for(var j = 0; j <= 15; j++)
            {
                var height = Math.random();

                if(i == 0 || j == 0 || i == 5 || j == 5 || j == 10 || i == 10)
                    height = -0.15;

                noiseArr[i][j] = height;
            }
        }

        // return(this.Flatten(this.Interpolate(noiseArr)));
        return(this.Interpolate(noiseArr));
    };

    Terrain.prototype.Interpolate = function (points) {
        var noiseArr = new Array()
        var x = 0;
        var y = 0;
        var p = 60;

        for(var i = 0; i < 300; i++) // 450
        {
            if(i != 0 && i % p == 0)
                x++;

            noiseArr[i] = new Array();
            for(var j = 0; j < 300; j++)
            {

                if(j != 0 && j % p == 0)
                    y++;

                var mu_x = (i%p) / p;
                var mu_2 = (1 - Math.cos(mu_x * Math.PI)) / 2;

                var int_x1     = points[x][y] * (1 - mu_2) + points[x+1][y] * mu_2;
                var int_x2     = points[x][y+1] * (1 - mu_2) + points[x+1][y+1] * mu_2;

                var mu_y = (j%p) / p;
                var mu_2 = (1 - Math.cos(mu_y * Math.PI)) / 2;
                var int_y = int_x1 * (1 - mu_2) + int_x2 * mu_2;

                noiseArr[i][j] = int_y;
            }
            y = 0;
        }        
        return(noiseArr);
    };

    Terrain.prototype.Flatten = function(points) {
        var noiseArr = new Array();
        for(var i = 0; i < points.length; i++)
        {
            noiseArr[i] = new Array()
            for(var j = 0; j < points[i].length; j++)
            {
                if(points[i][j] < 0.2)
                    noiseArr[i][j] = 0;

                else if(points[i][j] < 0.4)
                    noiseArr[i][j] = 0.2;

                else if(points[i][j] < 0.6)
                    noiseArr[i][j] = 0.4;

                else if(points[i][j] < 0.8)
                    noiseArr[i][j] = 0.6;

                else
                    noiseArr[i][j] = 1;
            }
        }

        return(noiseArr);
    };

    Terrain.prototype.Draw = function(time) {

    };
}
Terrain.prototype = new Object3D();
Terrain.prototype.constructor = Terrain;


/////////////////////////////////////////////////////////////
// Water
/////////////////////////////////////////////////////////////
function Water() {
    Object3D.call(this);
    this.type = "water";

    Water.prototype.Create = function(scene) {
        var geometry = new THREE.PlaneGeometry( 15000, 15000, 128 - 1, 128 - 1 );
        geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
        geometry.dynamic = true;

        var i, j, il, jl;
        for ( i = 0, il = geometry.vertices.length; i < il; i ++ ) {
            geometry.vertices[ i ].y = 35 * Math.sin( i/2 );
        }

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();


        var texture2 = THREE.ImageUtils.loadTexture( "textures/water4.jpg" );
        texture2.wrapS = texture2.wrapT = THREE.RepeatWrapping;
        texture2.repeat.set( 32,32 );

        // two types of water
        var material2 = new THREE.MeshBasicMaterial( { color: 0x00CCFF, map: texture2, transparent: true, opacity: 0.3} );
        var mesh = new THREE.Mesh(geometry, material2);
        mesh.position.set(0,60,0);
        mesh.that = this;
        game.targets.push(mesh);

        this.mesh = mesh;
        game.scene.add(this.mesh);
    };

    Water.prototype.Draw = function(time, delta, index) {
        for ( var i = 0, l = this.mesh.geometry.vertices.length; i < l; i ++ ) {
            this.mesh.geometry.vertices[ i ].y = 3.1 * Math.sin( i / 10 + ( time + i ) / 7 );    
            this.mesh.geometry.vertices[ i ].y += 1.8 * Math.sin( i / 10 + ( time + i ) / 4 );
        }
        this.mesh.geometry.verticesNeedUpdate = true;
    };
}
Water.prototype = new Object3D();
Water.prototype.constructor = Water;

/////////////////////////////////////////////////////////////
// Skybox
/////////////////////////////////////////////////////////////
function Skybox() {
    Object3D.call(this);

    Skybox.prototype.Create = function(scene) {
        var imagePrefix = "skybox/";
        var directions  = ["xpos", "xneg", "ypos", "yneg", "zpos", "zneg"];
        var imageSuffix = ".png";
        var skyGeometry = new THREE.CubeGeometry( 5000, 5000, 5000 );	

        var materialArray = [];
        for (var i = 0; i < 6; i++)
        materialArray.push( new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture( imagePrefix + directions[i] + imageSuffix ),
            side: THREE.BackSide
        }));
        var skyMaterial = new THREE.MeshFaceMaterial( materialArray );
        var skyBox = new THREE.Mesh( skyGeometry, skyMaterial );
        scene.add( skyBox );
    };
}
Skybox.prototype = new Object3D();
Skybox.prototype.constructor = Skybox;


/////////////////////////////////////////////////////////////
// Clouds
/////////////////////////////////////////////////////////////
function Cloud() {
    Object3D.call(this);
    this.speed = 0;
    this.type = "cloud";

    Cloud.prototype.Create = function(x ,y ,z, s, scene) {
        this.speed = 0.5+Math.random()*1;
        var group = new THREE.Object3D();
        var combined = new THREE.Geometry();
        var texture = THREE.ImageUtils.loadTexture( "textures/cloud.png" );
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        var cloud_material = new THREE.MeshBasicMaterial( { color: 0xFFFFFF, ambient: 0x000000 } );
        for(var i = 0; i < 4; i++) {
            for(var n = 0; n < 3; n++) {
                var size1 = Math.random()*15+5;
                var size2 = Math.random()*15+7;
                var object = new THREE.Mesh( new THREE.SphereGeometry( size1, size1, 5), cloud_material);
                object.position.set(Math.random()*15*i, Math.random()*7, Math.random()*20*n);
                object.castShadow = true;
                group.add(object);
                var object = new THREE.Mesh( new THREE.SphereGeometry( size2, size2, 5 ), cloud_material);
                object.position.set(Math.random()*15*i, Math.random()*7, Math.random()*20*n);
                object.castShadow = true;
                group.add(object);
                //THREE.GeometryUtils.merge(combined, object);
            }
        }
        //	var mesh = new THREE.Mesh(group, cloud_material);
        group.scale.set(s, s, s);
        group.position.set(x, y ,z);
        //	mesh.scale.set(s, s, s);
        //	mesh.position.set(x, y, z);
        //	this.mesh = mesh;
        this.mesh = group;

        game.scene.add(this.mesh);
    };

    Cloud.prototype.Draw = function(time, delta, index) {
        this.mesh.position.z += this.speed;
        if(this.mesh.position.z > 4000) {
            this.mesh.position.z = -4000;
            this.mesh.position.x = Math.random()*4000-1500;
            this.mesh.position.y = 465+Math.random()*400;
        }
    };
}
Cloud.prototype = new Object3D();
Cloud.prototype.constructor = Cloud;

/////////////////////////////////////////////////////////////
// Tree
/////////////////////////////////////////////////////////////
function Tree() {
    Object3D.call(this);
    this.type = "tree";
    this.id;

    Tree.prototype.Create = function(x, y, z, s, id) {
        var group = new THREE.Object3D();
        var combined = new THREE.Geometry();
        this.id = id;

        // Create leaves
        var texture = THREE.ImageUtils.loadTexture( "textures/leaves2.png" );
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
        var tree_material = new THREE.MeshLambertMaterial( { color: 0xFFFFFF, ambient: 0x00FFAA, map: texture } ); // 336633
        for(var i = 0; i < 5; i++) {
            var object = new THREE.Mesh( new THREE.SphereGeometry( 15, 15, 5 ), tree_material );
            object.position.set( Math.random()*13, Math.random()*15+15, Math.random()*13);
            THREE.GeometryUtils.merge(combined, object);
            // combined.geometry.merge(object);
        }
        var mesh = new THREE.Mesh(combined, tree_material);

        //	mesh.castShadow = true;
        //	mesh.receiveShadow = true;
        group.add(mesh);

        // Create tree-base
        var texture = THREE.ImageUtils.loadTexture( "textures/wood1.jpg" );
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 2, 2 );
        var base_material = new THREE.MeshLambertMaterial( { color: 0x996600, map: texture} ); // 996600
        var object = new THREE.Mesh( new THREE.CylinderGeometry( 2, 7, 35, 20, 5, true ), base_material);
        object.position.set( 5, 0, 5 );
        //object.castShadow = true;
        //object.receiveShadow = true;
        group.add( object );
        group.scale.set(s, s, s);
        group.position.set(x, y+10 ,z);
        this.mesh = group;
        //	CreateBoundingBox(this);
        game.scene.add(group);
        this.mesh.that = this;
        CreateBoundingBox(this);

    };

    Tree.prototype.Draw = function(time, delta , index) {

    };
}
Tree.prototype = new Object3D();
Tree.prototype.constructor = Tree;

/////////////////////////////////////////////////////////////
// Flower
/////////////////////////////////////////////////////////////
function Flower() {
    Object3D.call(this);
    this.type = "flower";

    Flower.prototype.Create = function(x, y, z, scale, type) {
        var object = game.modelLoader.GetModel('flower'+type);
        object.position.set(x,y,z);
        object.rotation.set(0, Math.random()*Math.PI, 0);
        object.scale.set(scale, scale, scale);
        this.mesh = object;
        this.mesh.that = this;
        CreateBoundingBox(this);
        game.scene.add(object);
    };

}
Flower.prototype = new Object3D();
Flower.prototype.constructor = Flower;
