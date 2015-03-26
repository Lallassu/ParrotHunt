//==============================================================================
// Author: Nergal
// Date: 2014-06-12
//==============================================================================


THREE.PerspectiveCamera.prototype.setRotateX = function( deg ){
    if ( typeof( deg ) == 'number' && parseInt( deg ) == deg ){
        this.rotation.x = deg * ( Math.PI / 180 );
    }
};
THREE.PerspectiveCamera.prototype.setRotateY = function( deg ){
    if ( typeof( deg ) == 'number' && parseInt( deg ) == deg ){
        this.rotation.y = deg * ( Math.PI / 180 );
    }
};
THREE.PerspectiveCamera.prototype.setRotateZ = function( deg ){
    if ( typeof( deg ) == 'number' && parseInt( deg ) == deg ){
        this.rotation.z = deg * ( Math.PI / 180 );
    }
};
THREE.PerspectiveCamera.prototype.getRotateX = function(){
    return Math.round( this.rotation.x * ( 180 / Math.PI ) );
};
THREE.PerspectiveCamera.prototype.getRotateY = function(){
    return Math.round( this.rotation.y * ( 180 / Math.PI ) );
};
THREE.PerspectiveCamera.prototype.getRotateZ = function(){
    return Math.round( this.rotation.z * ( 180 / Math.PI ) );
};


function MsgBoard(msg) {
    $('#msgboard').fadeIn(1000);
    $('#msgboard_msg').html("<font color='#FF0000'>"+msg+"</font>");
    setTimeout(function() { 
        $('#msgboard').fadeOut(1000);
    }, 2000);
}

function ExplodeMesh(obj) {
    /*
       var geos = new Array();
       if(obj.mesh.children.length == 0) {
       geos.push(obj.mesh);
       } else {
       for(var i = 0; i < obj.mesh.children.length; i++) {
       if(obj.mesh.children[i].geometry != undefined) {
       geos.push(obj.mesh.children[i]);
       }
       }
       }
       for(var g = 0; g < geos.length; g++) {
       */
    obj.attributes = {
        displacement: {	type: 'v3', value: [] },
        customColor:  {	type: 'c', value: [] }
    };

    obj.uniforms = {
        time: { type: "f", value: 0.0 }
    };

    var shaderMaterial = new THREE.ShaderMaterial( {
        uniforms: 	obj.uniforms,
        attributes:     obj.attributes,
        vertexShader:   document.getElementById( 'vertexshaderExplode' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshaderExplode' ).textContent,
        shading: 		THREE.FlatShading,
        side: 			THREE.DoubleSide
    });

    var geometry = obj.mesh.geometry.clone();
    //	var geometry = geos[g].geometry.clone();

    assignUVs(geometry);
    geometry.dynamic = true;
    THREE.GeometryUtils.center( geometry );

    var tessellateModifier = new THREE.TessellateModifier( 4 );
    for ( var i = 0; i < 6; i ++ ) {
        tessellateModifier.modify( geometry );
    }
    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify( geometry );

    var vertices = geometry.vertices;
    var colors = obj.attributes.customColor.value;
    var displacement = obj.attributes.displacement.value;
    var nv, v = 0;
    for ( var f = 0; f < geometry.faces.length; f ++ ) {
        var face = geometry.faces[ f ];
        if ( face instanceof THREE.Face3 ) {
            nv = 3;
        } else {
            nv = 4;
        }
        //	var x = 2 * ( 0.5 - Math.random() );
        //	var y = 2 * ( 0.5 - Math.random() );
        //	var z = 2 * ( 0.5 - Math.random() );
        var x = 2 * ( 0.5 - Math.random() );
        var y = 2 * ( -0.5 - Math.random() );
        var z = 2 * ( 0.5 - Math.random() );
        for ( var i = 0; i < nv; i ++ ) {
            colors[ v ] = new THREE.Color(0x800000);
            displacement[ v ] = new THREE.Vector3();
            displacement[ v ].set( x, y, z );
            v += 1;
        }
    }

    mesh = new THREE.Mesh( geometry, shaderMaterial );
    mesh.rotation.set( 0.5, 0.5, 0 );
    mesh.doubleSided = true;
    var vector = new THREE.Vector3();
    vector.setFromMatrixPosition(obj.mesh.matrixWorld);
    mesh.position.set(vector.x, vector.y, vector.z);

    game.scene.remove(obj.mesh);
    //obj.mesh = mesh;
    obj.meshes.push(mesh);
    game.scene.add(mesh);
    //    }
}

function assignUVs( geometry ){
    geometry.computeBoundingBox();

    var max     = geometry.boundingBox.max;
    var min     = geometry.boundingBox.min;

    var offset  = new THREE.Vector2(0 - min.x, 0 - min.y);
    var range   = new THREE.Vector2(max.x - min.x, max.y - min.y);

    geometry.faceVertexUvs[0] = [];
    var faces = geometry.faces;

    for (i = 0; i < geometry.faces.length ; i++) {

        var v1 = geometry.vertices[faces[i].a];
        var v2 = geometry.vertices[faces[i].b];
        var v3 = geometry.vertices[faces[i].c];

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2( ( v1.x + offset.x ) / range.x , ( v1.y + offset.y ) / range.y ),
            new THREE.Vector2( ( v2.x + offset.x ) / range.x , ( v2.y + offset.y ) / range.y ),
            new THREE.Vector2( ( v3.x + offset.x ) / range.x , ( v3.y + offset.y ) / range.y )
        ]);

    }

    geometry.uvsNeedUpdate = true;

}

function CreateBoundingBox(obj) {
    var object3D = obj.mesh;
    var box = null;
    object3D.traverse(function (obj3D) {
        var geometry = obj3D.geometry;
        if (geometry === undefined)  {
            return;
        }
        geometry.computeBoundingBox();
        if (box === null) {
            box = geometry.boundingBox;
        } else {
            box.union(geometry.boundingBox);
        }
    });


    var x = box.max.x - box.min.x; 
    var y = box.max.y - box.min.y; 
    var z = box.max.z - box.min.z;

    /*
       obj.bsize_x = (x/2)*obj.mesh.scale.x;
       obj.bsize_y = (y/2)*obj.mesh.scale.y;
       obj.bsize_z = (z/2)*obj.mesh.scale.z;
       */
    obj.bbox = box;

    var bcube = new THREE.Mesh( new THREE.BoxGeometry( x, y, z ), 
                               new THREE.MeshNormalMaterial({ visible: false, wireframe: true, color: 0xAA3333}) );
    var bboxCenter = box.center();
    bcube.translateX(bboxCenter.x);
    bcube.translateY(bboxCenter.y);
    bcube.translateZ(bboxCenter.z);
    obj.bcube = bcube;
    object3D.add(bcube);

    bcube.that = obj.mesh.that;

    game.targets.push(bcube);
    //    return bcube;
}

function rgbToHex(r, g, b) {
    if(r < 0) r = 0;
    if(g < 0) g = 0;
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}


function GetWorldYVector(vector) {
    var world = game.terrain.GetNoise();
    var x = Math.round(vector.x/10)+world.length/2;
    var z = Math.round(vector.z/10)+world.length/2;
    var y = 0;
    if(x < world.length-1) {
        if(world[x] != undefined && z < world[x].length-1) {
            y = world[x][z]*200;
        }
    } else {
        y = 0;
    }
    return y;
}


function GetWorldY(mesh) {
    var world = game.terrain.GetNoise();
    var x = Math.round(mesh.position.x/10)+world.length/2;
    var z = Math.round(mesh.position.z/10)+world.length/2;
    var y = 0;
    if(x < world.length-1) {
        if(world[x] != undefined && z < world[x].length-1) {
            y = world[x][z]*200;
        }
    } else {
        y = 0;
    }
    return y;
}


function ReleasePointer() {
    var instructions = document.getElementsByTagName("body")[0];
    instructions.removeEventListener( 'click', instrClick);
    keys_enabled = 0;
    document.exitPointerLock = document.exitPointerLock ||
        document.mozExitPointerLock ||
        document.webkitExitPointerLock;
    document.exitPointerLock();

}

// http://www.html5rocks.com/en/tutorials/pointerlock/intro/
function LockPointer() {
    var instructions = document.getElementsByTagName("body")[0];
    /*
       var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
       if ( havePointerLock ) {
       var element = document.body;
       var pointerlockchange = function ( event ) {
       if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
       $('#info').hide();
       $('#scoreboard').hide();
       keys_enabled = 1;
       return;
       } else {

       if(!$('#helpboard').is(":visible")) {
       $('#info').show();
       }
       keys_enabled = 0;
       }
       }
       */
    /*
       document.addEventListener( 'pointerlockchange', pointerlockchange, false );
       document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
       document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
       */
    instructions.addEventListener( 'click', instrClick, false);
    //  }
}

function instrClick( event ) {
    var element = document.body;
    keys_enabled = 1;
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

    if ( /Firefox/i.test( navigator.userAgent ) ) {
        var fullscreenchange = function ( event ) {
            if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                document.removeEventListener( 'fullscreenchange', fullscreenchange );
                document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
                element.requestPointerLock();
            }
        }

        document.addEventListener( 'fullscreenchange', fullscreenchange, false );
        document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

        element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
        element.requestFullscreen();
    } else {
        //	element.requestPointerLock();
    }
}

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    }

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    }

    request.send();
}

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
    this.loadBuffer(this.urlList[i], i);
}
