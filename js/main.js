//==============================================================================
// Author: Nergal
// Date: 2014-06-12
//==============================================================================
"use strict";

function Game() {
    this.net;
    this.container;
    this.scene;
    this.camera;
    this.renderer;
    this.stats;
    this.clock;
    this.objects = [];
    this.collision_objects = [];    
    this.draw_objects = [];
    this.screen_width = window.innerWidth;
    this.screen_height = window.innerHeight;
    this.view_angle = 75;
    this.aspect = this.screen_width/this.screen_height;
    this.near = 0.1;
    this.far = 13500;
    this.inv_max_fps = 1/60;
    this.frameDelta = 0;
    this.update_end = 0;
    this.anim_id = 0;
    this.spectate = 0;
    this.modelLoader;
    this.terrain;
    this.player;
    this.keyboard;
    this.targets = [];

    this.score = 0;
    this.hits = 0;
    this.flamingos = 0;
    this.misses = 0;
    this.time = 0;
    this.started = 0;

    Game.prototype.StartGame = function() {
        // TBD: Enter name for player
        game.Reset();
        game.player.Reset();

        $('#score').text(game.score);
        $('#round_msg').text("Prepare");
        $('#round_msg2').text("3");
        $('#round').fadeIn(1000);
        $('#timer').show();
        $('#timer_msg').text("0 sec.");
        this.spectate = 0;
        $('#info').hide();
        $('#hud').show();
        this.camera.position.set(this.tower.mesh.position.x-10, this.tower.mesh.position.y+120, this.tower.mesh.position.z);
        this.camera.setRotateX(this.camera.getRotateX()-3);


        setTimeout(function() {
            $('#round_msg2').text("3");
            game.soundLoader.PlaySound("countdown", game.tower.position, 500);
        }, 2500);
        setTimeout(function() {
            $('#round_msg2').text("2");
            game.soundLoader.PlaySound("countdown", game.tower.position, 500);
        }, 3500);
        setTimeout(function() {
            $('#round_msg2').text("1");
            $('#round').fadeOut(300);
            game.soundLoader.PlaySound("countdown", game.tower.position, 1000);
        }, 4500);
        setTimeout(function() {
            game.soundLoader.PlaySound("start", game.tower.position, 1000);
            game.started = 1;
        }, 5000);

    };

    Game.prototype.EndGame = function() {
        this.started = 0;
        this.spectate = 1;
        this.soundLoader.PlaySound("end", game.tower.position, 500);
        $('#hud').fadeOut(2000);
        $('#timer').fadeOut(2000);
        $('#msgboard').fadeOut(1000);
        $('#round').fadeIn(1000);
        var gtime = Math.round(this.time)*30;
        var gammo = this.player.ammo*30;
        var total = this.score - gtime + gammo;
        if(total < 0) {
            total = 0;
        }
        $('#round_msg2').html("");
        $('#round_msg').html("Parrot score: <font color='#33FF33'>"+this.score+"</font><br>Ammo left: <font color='#33FF33'>"+gammo+"</font><br>Time: <font color='#FF3333'>-"+gtime+"</font><br>Flamingos: <font color='#FF3333'>"+this.flamingos+"</font><br><br>Your score: <font color='#33FF33'>"+total+"</font>");

        //TBD: Check with server for position in score list
        // show position that was user got.
        // SAVE TO DATABASE ON SERVER!

        this.score = total;
        console.log("HITS: "+this.player.hits);
        this.net.send_Score(this.player.name, this.score, this.hits);

        setTimeout(function() {
            game.net.send_GetScore();
            game.net.send_GetStat();
            $('#round').fadeOut(2000);
            $('#info').fadeIn(2000);
        }, 5000);

    };

    Game.prototype.UpdateScore = function(score) {
        this.score += score;
        if(this.score < 0) {
            this.score = 0;
        }
        if(score < 0) {
            $('#score').html("<font color='#FF3333'>"+this.score+"</font>");
        } else {
            $('#score').html("<font color='#33FF33'>"+this.score+"</font>");
        }
        setTimeout(function() {
            $('#score').html("<font color='#FFFFFF'>"+game.score+"</font>");
        }, 1000);
    };


    Game.prototype.Reset = function() {
        this.update_end = 1;
        for(var i = 0; i < 0; i++) {
            if(this.objects[i].type != "player") {
                this.objects[i].Remove();
                this.objects.slice(i, 1);
            }
        }
        this.targets = [];
        this.objects = [];
        this.flamingos = 0;
        this.objects.push(this.player);
        this.spectate = 1;
        this.player.Reset();
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.time = 0;
        /*
           for(var i = 0; i < this.scene.children.length; i++) {
           console.log("REMOVE: "+i);
           this.scene.remove(this.scene.children[i]);
           }
           */

        for(var i = 1; i <= 10; i++) {
            $('#duck'+i).attr('src', 'css/duck_alive.png');
        }
        this.InitScene();
        this.BuildScene();
    };


    Game.prototype.InitScene = function() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(this.view_angle, this.aspect, this.near, this.far);
        this.scene.add(this.camera);

        this.scene.fog = new THREE.FogExp2( 0x000000, 0.00025 );

        this.camera.lookAt(this.scene.position);

        this.camera.rotation.order = "YXZ";
        this.camera.up = new THREE.Vector3(0,1,0);
    };

    Game.prototype.Init = function() {
        this.net = new Net();
        this.net.Initialize("http://localhost:8080");

        this.net.send_GetScore();
        this.net.send_GetStat();

        this.clock = new THREE.Clock();
        this.stats = new Stats();
        $('#stats').append(stats.domElement);

        this.InitScene();

        this.renderer = new THREE.WebGLRenderer( {antialias: true} );
        this.renderer.setSize(this.screen_width, this.screen_height);
        this.renderer.setClearColor(0x000000, 1);

        this.keyboard = new THREEx.KeyboardState();
        this.container = document.getElementById('container');
        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        THREEx.WindowResize(this.renderer, this.camera);

        this.renderer.shadowMapEnabled = true;
        //    this.renderer.shadowMapSoft = true;


        this.projector = new THREE.Projector();

        this.modelLoader = new ModelLoader();
        this.soundLoader = new SoundLoader();

        // Add models
	this.modelLoader.AddJSON({ subDivides: 0,
			      obj: 'models/watch_tower2/tower.js',
				   name: "watchtower" });
	
	this.modelLoader.Add({ subDivides: 0,
			       mtl: 'models/Flower/test/Flower.mtl',
			       obj: 'models/Flower/test/Flower.obj',
			       name: "flower1" });
	this.modelLoader.Add({ subDivides: 0,
			       mtl: 'models/Flower/test/Flower2.mtl',
			       obj: 'models/Flower/test/Flower.obj',
			       name: "flower2" });
	this.modelLoader.Add({ subDivides: 0,
			       mtl: 'models/Flower/test/Flower3.mtl',
			       obj: 'models/Flower/test/Flower.obj',
			       name: "flower3" });
	this.modelLoader.AddMorph({ subDivides: 1,
				    obj: 'models/flamingo/stork_flamingo.js',
				    name: "flamingo" });
	this.modelLoader.AddMorph({ subDivides: 2,
				    obj: 'models/parrot/parrot.js',
				    name: "parrot" });

	// Add sounds
	this.soundLoader.Add({file: "sounds/shot.mp3",
			      name: "shoot"});
	this.soundLoader.Add({file: "sounds/reload.mp3",
			      name: "reload"});
	this.soundLoader.Add({file: "sounds/flamingo.mp3",
			      name: "flamingo"});
	this.soundLoader.Add({file: "sounds/parrot1.mp3",
			      name: "parrot1"});
	this.soundLoader.Add({file: "sounds/parrot2.mp3",
			      name: "parrot2"});
	this.soundLoader.Add({file: "sounds/hit1.mp3",
			      name: "hit1"});
	this.soundLoader.Add({file: "sounds/hit2.mp3",
			      name: "hit2"});
	this.soundLoader.Add({file: "sounds/zoom.wav",
			      name: "zoom"});
	this.soundLoader.Add({file: "sounds/end2.mp3",
			      name: "end"});
	this.soundLoader.Add({file: "sounds/countdown.mp3",
			      name: "countdown"});
	this.soundLoader.Add({file: "sounds/start.mp3",
			      name: "start"});

                  // Add player
                  this.player = new Player();
                  this.player.Create();
                  this.objects.push(this.player);

                  this.InitiateModels();
                  this.animate();
    };

    Game.prototype.InitiateModels = function() {
        var x = this.modelLoader.PercentLoaded();
        if(x < 100) {
            var that = this;
            setTimeout(function() { that.InitiateModels()}, 500);
            return;
        }
        $('#info_loadbar').fadeOut(1000);
        this.BuildScene();
    };

    Game.prototype.BuildScene = function() {

        // Prepare radar
        /*
           var canvas  = document.getElementById('radar');
           var context = canvas.getContext('2d');

           for(var x = 0; x < 300; x++)
           {
           for(var y = 0; y < 3000; y++)
           {
           context.fillStyle = "#339933";
           context.fillRect(x, y, 1, 1);
           }
           }
           */
        // Light!
        var sun = new Sun();
        sun.Create(0,200,0,this. scene, this.renderer);

        // Clouds
        // Clouds
        for(var i= 0; i < 10; i++) {
            var cloud = new Cloud();
            cloud.Create(Math.random()*4000-1500, 450+Math.random()*400, Math.random()*4000-1500, 4, this.scene);
            this.objects.push(cloud);
        } 


        // add water
        var water = new Water();
        water.Create(this.scene);
        this.objects.push(water);


        // Add tower
        this.tower = undefined;
        var set = 0;
        while(this.tower == undefined) {	
            // Add terrain
            this.terrain = new Terrain();
            this.terrain.Create(this.scene);
            for(var x = 0; x < 300; x++) {
                for(var y= 0; y < 300; y++) {	
                    if(this.terrain.noise[x][y] > 0.85) {
                        if(Math.random()*100 > 99.7) {
                            this.tower = new Tower();
                            this.tower.Create((x*10)-1500,
                                              this.terrain.noise[x][y]*200,
                                              (y*10)-1500,
                                              200); // 300
                                              set = 1;
                                              break;
                        }
                    }
                }
                if(set) { break; }
            }
        }

        //this.camera.position.set(500,600, 2000);
        // +120

        this.camera.position.set(this.tower.mesh.position.x, this.tower.mesh.position.y+120, this.tower.mesh.position.z-30);
        this.camera.setRotateX(this.camera.getRotateX()-3);
        this.spectate = 1;

        // Add trees/stones/grass/clouds

        // add flowers
        var max_flowers = 100;
        for(var x = 0; x < 300; x++) {
            for(var y= 0; y < 300; y++) {	
                if(this.terrain.noise[x][y] > 0.45 && this.terrain.noise[x][y] < 0.6) {
                    if(Math.random()*100 > 99.3) {
                        var size = Math.random()*1.0+5.5;
                        var type = Math.round(1+Math.random()*2);
                        var flower = new Flower();
                        max_flowers--;
                        flower.Create((x*10)-1500,
                                      this.terrain.noise[x][y]*200,
                                      (y*10)-1500,
                                      size,
                                      type);
                    }
                }
            }
            if(max_flowers <= 0) {
                break;
            }
        }

        // Add trees
        var max_trees = 20;
        for(var x = 0; x < 300; x++) {
            for(var y= 0; y < 300; y++) {	
                if(this.terrain.noise[x][y] > 0.45 && this.terrain.noise[x][y] < 0.57) {
                    if(Math.random()*100 > 99.7) {
                        max_trees--;
                        var size = Math.random()*1.0+2.5;
                        var type = Math.round(1+Math.random()*2);
                        var tree = new Tree();
                        tree.Create((x*10)-1500,
                                    this.terrain.noise[x][y]*200,
                                    (y*10)-1500,
                                    size,
                                    type);
                    }
                }
            }
            if(max_trees <= 0) {
                break;
            }
        }

        // TBD: When loading game.
        this.AddParrots();
        this.AddFlamingos();
        this.update_end = 0;
    };


    Game.prototype.AddFlamingos = function() {
        for(var i = 0; i < 5; i++) {
            var parrot = new Flamingo();
            parrot.Create({
                scale: 0.5+Math.random()*1.0, health: 50, damage: 2, max_speed: 10+Math.random()*5,
                boundary_minx: this.tower.mesh.position.x-1000., boundary_maxx: this.tower.mesh.position.x+1000,
                boundary_miny: -50, boundary_maxy: -155,
                boundary_minz: this.tower.mesh.position.z-1000, boundary_maxz: this.tower.mesh.position.z+1000
            });
            this.objects.push(parrot);
        }
    };

    Game.prototype.AddParrots = function() {
        for(var i = 0; i < 10; i++) {
            var parrot = new Parrot();
            parrot.Create({
                id: i+1,
                scale: 0.5+Math.random()*1.0, health: 50, damage: 2, max_speed: 45+Math.random()*120,
                boundary_minx: this.tower.mesh.position.x-1000., boundary_maxx: this.tower.mesh.position.x+1000,
                boundary_miny: -100, boundary_maxy: -10,
                boundary_minz: this.tower.mesh.position.z-1000, boundary_maxz: this.tower.mesh.position.z+1000
            });
            this.objects.push(parrot);
        }
    };

    Game.prototype.render = function() {
        this.renderer.render(this.scene, this.camera);
    };

    Game.prototype.animate = function() {
        this.anim_id = requestAnimationFrame(this.animate.bind(this));
        this.render();
        this.update();
    };

    Game.prototype.update = function() {
        var delta = this.clock.getDelta(),
            time = this.clock.getElapsedTime() * 10;
        if(this.started) {
            this.time += delta;
            $('#timer_msg').text(Math.round(this.time)+" sec.");
        }

        if(this.update_end) {
            cancelAnimationFrame(this.anim_id);
            this.ResetScene();
            this.update_end = 0;
            return;
        }

        this.frameDelta += delta;

        while(this.frameDelta >= this.inv_max_fps) {
            THREE.AnimationHandler.update(this.inv_max_fps);
            for(var i = 0; i < this.objects.length; i++) {
                if(this.objects[i] != undefined) {
                    if(this.objects[i].remove == 1) { 
                        this.objects.splice(i, 1);
                    } else {
                        this.objects[i].Draw(time, this.inv_max_fps, i);
                    }
                }
            }
            this.frameDelta -= this.inv_max_fps;

            if(this.spectate) {
                this.camera.position.x = Math.floor(Math.cos(time/100) * 2000);
                this.camera.position.z = Math.floor(Math.sin(time/100) * 2000);
                this.camera.lookAt(this.tower.mesh.position);
            }
        }	
        this.stats.update();
    };
}

