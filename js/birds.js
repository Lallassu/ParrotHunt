//==============================================================================
// Author: Nergal
// Date: 2014-06-12
//==============================================================================
/////////////////////////////////////////////////////////////
// Enemies base 'class'
/////////////////////////////////////////////////////////////
function Enemies() {
    Enemies.prototype.hits = 10;

    this.mesh;
    this.hit = 0;
    this.max_speed = 10;
    this.boundary_maxx;
    this.boundary_minx;
    this.boundary_maxz;
    this.boundary_minz;
    this.boundary_miny;
    this.boundary_maxy;

    this.meshes = new Array();
    this.uniforms;
    this.attributes;
    this.remove = 0;
    this.time_start = -1;

    this.scale = 10;
    this.pos_x = 0;
    this.pos_y = 0;
    this.pos_z = 0;
    this.offset_y = 0;

    this.canvas_px = -1;
    this.canvas_py = -1;
    this.canvas_fstyle = -1;
    this.name = "undefined";

    Enemies.prototype.type = "enemy";

    Enemies.prototype.Create = function(args) {
        this.scale = args.scale;
        this.id = args.id;
        this.max_speed = args.max_speed;
        this.boundary_maxx = args.boundary_maxx;
        this.boundary_minx = args.boundary_minx;
        this.boundary_miny = args.boundary_miny;
        this.boundary_maxy = args.boundary_maxy;
        this.boundary_minz = args.boundary_minz;
        this.boundary_maxz = args.boundary_maxz;
        this.Spawn();
    };

    Enemies.prototype.UpdateCanvas = function(x, y) {
        var canvas  = document.getElementById('radar');
        var context = canvas.getContext('2d');
        if(this.canvas_fstyle != -1) {
            context.fillStyle = this.canvas_fstyle;
            context.fillRect(this.canvas_px, this.canvas_py, 2, 2);
        }

        this.canvas_px = x;
        this.canvas_py = y;

        var p = context.getImageData(x, y, 2, 2).data;
        if(!((p[1] == 255 || p[0] == 255) && p[1] == 0 && p[2] == 0)) {
            this.canvas_fstyle = "rgb("+p[0]+","+p[1]+","+p[2]+")";
        }	

        context.fillStyle = "rgb(255,0,0)";
        context.fillRect(x, y, 2, 2);
    };

    Enemies.prototype.Die = function() {
        game.scene.remove(this.mesh);
        for(var i = 0; i < this.meshes.length; i++) {
            game.scene.remove(this.meshes[i]);
        }
        this.remove =  1;
    };

    Enemies.prototype.Hit = function(dmg, index) {
    };

    Enemies.prototype.Spawn = function() {
    };

    Enemies.prototype.GetObject = function() {
        return this.mesh;
    };

    Enemies.prototype.Draw = function(time, delta, index) {
        if(this.hit && this.type != "Flamingo") {
            if(this.uniforms.time.value < 250) {
                this.uniforms.time.value += 0.5;
            } else {
                this.Die();
            }
        }
    };
}

/////////////////////////////////////////////////////////////
// Parrot
/////////////////////////////////////////////////////////////
function Parrot() {
    Enemies.call(this);
    this.name = "Parrot";
    this.id = 0;

    Parrot.prototype.Hit = function(dmg, index) {
        if(this.hit) { return; }
        game.UpdateScore(150);
        game.hits++;
        this.hit = 1;
        game.soundLoader.PlaySound("hit"+(1+Math.round(Math.random()*1)), this.mesh.position, 25000);

        // EXPLODE
        ExplodeMesh(this);	
        $('#duck'+Enemies.prototype.hits).attr('src', 'css/duck_dead.png');
        Enemies.prototype.hits--;
        if(Enemies.prototype.hits == 0) {
            game.EndGame();
        }

    };

    Parrot.prototype.Spawn = function() {
        var id = 1+Math.round(Math.random()*3);
        var object = game.modelLoader.GetModel('parrot');


        var world = game.terrain.GetNoise();

        if ( object.geometry.morphColors && object.geometry.morphColors.length ) {
            var colorMap = object.geometry.morphColors[ 0 ];
            for ( var i = 0; i < colorMap.colors.length; i ++ ) {
                object.geometry.faces[ i ].color = colorMap.colors[ i ];	
            }
        }

        this.pos_x = -2000+Math.random()*4000;
        this.pos_z = -2000+Math.random()*4000;
        this.pos_y = 200+Math.random()*200;
        object.position.set(this.pos_x, this.pos_y, this.pos_z);
        object.scale.set(this.scale,this.scale,this.scale);
        this.mesh = object;

        this.mesh.that = this;

        CreateBoundingBox(this);
        game.scene.add(this.mesh);
    };

    Parrot.prototype.Draw = function(time, delta, index) {
        if(this.mesh == undefined) { return; }

        if(Math.random()*1000 < 2) {
            game.soundLoader.PlaySound("parrot"+(1+Math.round(Math.random()*1)), this.mesh.position, 700);
        }

        if(!this.hit) {
            this.mesh.updateAnimation(500*delta);
            this.mesh.phase = ( this.mesh.phase + ( Math.max( 0, this.mesh.rotation.z ) + 10.1 )  ) % 62.83;

            var angle = (Math.PI/0.3)*delta;
            var distance = this.max_speed * delta;

            if(Math.random()*10 < 0.15) {	
                if(this.pos_x < this.boundary_minx || this.pos_x > this.boundary_maxx) {
                    this.mesh.rotateOnAxis( new THREE.Vector3(0,1,0), -Math.PI/4);
                } else if(this.pos_z < this.boundary_minz || this.pos_z > this.boundary_maxz) {
                    this.mesh.rotateOnAxis( new THREE.Vector3(0,1,0), +Math.PI/4);
                } else if(this.pos_y < this.boundary_miny || this.pos_y > this.boundary_maxy) {
                    this.mesh.rotateOnAxis( new THREE.Vector3(0,1,0), +Math.PI/4);
                }
            }
            this.mesh.translateZ(distance);
            if(Math.random()*10 < 0.2) {
                if(Math.random()*10 < 0.2) {
                    this.mesh.translateZ(-distance);
                } else {
                    this.mesh.translateY(distance);
                }
            }
            this.pos_x = this.mesh.position.x;
            this.pos_z = this.mesh.position.z;
            this.pos_y = this.mesh.position.y;
            this.mesh.position.set(this.pos_x, this.pos_y, this.pos_z);
            //this.UpdateCanvas(Math.round((this.pos_y/10)+150), (this.pos_z/10)+150);
        }
        Enemies.prototype.Draw.call(this, time, delta);
    };

}
Parrot.prototype = new Enemies();
Parrot.prototype.constructor = Parrot;


/////////////////////////////////////////////////////////////
// Flamingo
/////////////////////////////////////////////////////////////
function Flamingo() {
    Enemies.call(this);
    this.type = "Flamingo";

    Flamingo.prototype.Hit = function() {
        if(this.hit) { return; }
        this.hit = 1;
        MsgBoard("It's not Flamingo season yet!");
        game.UpdateScore(-100);
        game.flamingos -= 100;
    };

    Flamingo.prototype.Spawn = function() {
        var object = game.modelLoader.GetModel('flamingo');

        if ( object.geometry.morphColors && object.geometry.morphColors.length ) {
            var colorMap = object.geometry.morphColors[ 0 ];
            for ( var i = 0; i < colorMap.colors.length; i ++ ) {
                object.geometry.faces[ i ].color = colorMap.colors[ i ];	
            }
        }
        object.position.set(Math.random()*4000-1500, 520+Math.random()*400, Math.random()*4000-1500);
        object.scale.set(this.scale,this.scale,this.scale);
        this.mesh = object;
        this.mesh.speed = Math.random()*2;
        this.mesh.duration = 1000;
        this.mesh.time = 1000;
        this.mesh.that = this;

        CreateBoundingBox(this);
        game.scene.add(this.mesh);
    };

    Flamingo.prototype.Draw = function(time, delta, index) {
        //if(!this.hit) {
        if(this.mesh == undefined) { return; }
        if(Math.random()*1000 < 2) {
            game.soundLoader.PlaySound("flamingo", this.mesh.position, 1000);
        }
        this.mesh.position.z += this.max_speed;
        if(this.mesh.position.z > 4000) {
            this.mesh.position.z = -4000;
            this.mesh.position.x = Math.random()*4000-1500;
            this.mesh.position.y = 320+Math.random()*400;
        }

        this.mesh.updateAnimation(200*delta);
        this.mesh.phase = ( this.mesh.phase + ( Math.max( 0, this.mesh.rotation.z ) + 10.1 )  ) % 62.83;
        //	}
        //	Enemies.prototype.Draw.call(this, time, delta);
    };

}
Flamingo.prototype = new Enemies();
Flamingo.prototype.constructor = Flamingo;
