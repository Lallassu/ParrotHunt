/////////////////////////////////////////////////////////////
// Autor: Nergal
// Date: 2014-06-16
/////////////////////////////////////////////////////////////
"use strict";

/////////////////////////////////////////////////////////////
// Player base 'class'
/////////////////////////////////////////////////////////////
function Player() {
    // player stats
    this.name = "";
    this.ammo = 36;
    this.zoom = 0;
    this.zoom_time = 0;
    this.reloading = 0;
    this.shot = 3;
    this.type = "player";

    Player.prototype.Reset = function() {
	this.ammo = 36;
	this.zoom = 0;
	this.zoom_time = 0;
	this.reloading = 0;
	this.shot = 3;
    };

    Player.prototype.Create = function(args) {
	//LockPointer();
	keys_enabled = 1;
	this.AddBindings();
    };

    Player.prototype.OnMouseUp = function(event) {
	this.mouseDown = 0;
	var mouseButton = event.keyCode || event.which;
	if(!game.started) {
	    return;
	}
	if(this.reloading) {
	    MsgBoard("Reloading rifle.");
	    return;
	}
	if(mouseButton === 1){
	    game.soundLoader.PlaySound("shoot");
	    $('#shot'+this.shot).hide();
	    this.shot--;

	    var x = ( (event.clientX + (31/2)) / window.innerWidth ) * 2 - 1 ;
	    var y =- ( (event.clientY + (31/2)) / window.innerHeight ) * 2 + 1;

	    var vector = new THREE.Vector3( x, y, 1 );
	    game.projector.unprojectVector( vector, game.camera );
	    var ray = new THREE.Raycaster(game.camera.position, vector.sub(game.camera.position ).normalize());
	    var intersects = ray.intersectObjects(game.targets);
	    var parrot_hit = 0;
	    if (intersects.length > 0) {
		//console.log(intersects[0]);
		for(var i=0; i < intersects.length; i++) {
		    if(intersects[i].object.that.Hit != undefined) {
			parrot_hit = 1;
			intersects[i].object.that.Hit();
		    }
		    // Only smoke on first hit
		    if(intersects[i].object.that.type != "enemy") {
			var particleGroup = new SPE.Group({
			    texture: THREE.ImageUtils.loadTexture('textures/smokeparticle.png'),
			    maxAge: 0.5,
			    obj: intersects[i].object.that.mesh,
			});

			/*
			  // TBD: Fix terrain hits, shaded terrain must be taken into account.
			if(intersects[i].object.that.type == "terrain") {
			    var v = new THREE.Vector3(intersects[i].point.x, intersects[i].point.y, intersects[i].point.z);
			    intersects[i].point.y = GetWorldYVector(v)+5;
			}*/
			var emitter = new SPE.Emitter({
			    position: new THREE.Vector3(intersects[i].point.x, intersects[i].point.y, intersects[i].point.z),
			    positionSpread: new THREE.Vector3( 0, 10, 0 ),
			    
			    acceleration: new THREE.Vector3(0, 4, 0),
			    accelerationSpread: new THREE.Vector3( 10, 10, 10 ),
			    
			    velocity: new THREE.Vector3(10, 15, 10),
			    velocitySpread: new THREE.Vector3(10, 7.5, 10),
			    
			    colorStart: new THREE.Color(0x000000),
			    //colorStartSpread: new THREE.Vector3(255, 255, 255),
			    colorEnd: new THREE.Color(0x333333),
			    
			    duration: 0.5,
			    sizeStart: 2,
			    sizeEnd: 10,
			    particleCount: 500
			});
			particleGroup.addEmitter( emitter );
			game.objects.push(particleGroup);
			game.scene.add( particleGroup.mesh );
		    }
		    
		}
	    }

	    if(!parrot_hit) {
		game.misses++;
	    }

	    this.mouseDown = 0;
	    game.camera.fov = 75;
	    game.camera.updateProjectionMatrix();
	    this.zoom_time = 0;
	    this.zoom = 0;
	    if(this.shot < 1) {
		if(this.ammo == 0) {
		    MsgBoard("Out of ammo!");
		    game.EndGame();
		}
		var str = "";
		this.ammo -= 3;
		for(var i = 0; i < this.ammo; i++) {
		    str += "|";
		}
		$('#ammo').text(str);

		// reload
		this.reloading = 1;
		setTimeout(function() {
		    game.soundLoader.PlaySound("reload"); 
		    $('#shot1').show(500);
		}, 200);
		setTimeout(function() {
		    game.soundLoader.PlaySound("reload"); 
		    $('#shot2').show(500);
		}, 900);
		var that = this;
		setTimeout(function() {
		    game.soundLoader.PlaySound("reload"); 
		    $('#shot3').show(500);
		    that.reloading = 0;
		}, 1600);
		this.shot = 3;
	    }
	}
    };

    Player.prototype.OnMouseDown = function(event) {
	if(this.reloading || !game.started) {
	    return;
	}
	var mouseButton = event.keyCode || event.which;
	if(mouseButton === 1){ 
	    this.mouseDown = 1;
	}
    };

    Player.prototype.OnMouseMove = function(jevent) {
    };

    Player.prototype.RemoveBindings = function() {
//	$(document).unbind('mousemove');
	$(document).unbind('mouseup');
	$(document).unbind('mousedown');
	this.attached_camera = 0;
    };
    
    Player.prototype.AddBindings = function() {
	$(document).mouseup(this.OnMouseUp.bind(this));
	$(document).mousedown(this.OnMouseDown.bind(this));
//	$(document).mousemove(this.OnMouseMove.bind(this));
    };

    Player.prototype.Draw = function(time, delta) {
	if(this.mouseDown) {
	    this.zoom_time += delta;
	    if(game.camera.fov > 40 && this.zoom_time > 0.3) {
		game.camera.fov -= 0.5;
		game.camera.updateProjectionMatrix();
		if(game.camera.fov%10 == 0) {
		    game.soundLoader.PlaySound("zoom", game.tower.position, 500);
		    this.zoom = 1;
		}
	    }
	}
	var anim = "stand";
    	if(this.dead == 1) {
	    //this.Dead(time, delta);
	    if ( game.keyboard.pressed("L") ) {
		if(this.respawn) {
		    net.send_PlayerRespawn(this.id);
		    this.respawn = 0;
		}
	    }
	    return;
	}

	var rotateAngle = (Math.PI / 1.5) * delta ;
	var moveDistance;
	if(game.camera.fov == 75) {
	    moveDistance = 50 * delta;
	} else {
	    moveDistance = 25 * delta;
	}

	moveDistance = 1;

	if (game.keyboard.pressed("left") || game.keyboard.pressed("A")) {
	    game.camera.setRotateY(game.camera.getRotateY()+moveDistance);
	    //game.camera.rotateY(moveDistance);
	}
	if (game.keyboard.pressed("right") || game.keyboard.pressed("D")) {
	    game.camera.setRotateY(game.camera.getRotateY()-moveDistance);
	//    game.camera.rotateY(-moveDistance);
	}
    };
   
}
Player.prototype = new Player();
Player.prototype.constructor = Player;
