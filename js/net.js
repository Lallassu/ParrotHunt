/////////////////////////////////////////////////////////////
// Autor: Nergal
// Date: 2014-06-23
/////////////////////////////////////////////////////////////
"use strict";

/////////////////////////////////////////////////////////////
// Network base 'class'
/////////////////////////////////////////////////////////////
function Net() {
    this.socket = undefined;


    /////////////////////////////////////////////////////////////
    // Senders 
    /////////////////////////////////////////////////////////////
    Net.prototype.send_Score = function(name_, score_, hits_) {
        this.socket.emit("SetScore", { name: name_, score: score_ , hits: hits_});
    };

    Net.prototype.send_GetScore = function() {
        this.socket.emit("GetScore", {});
    };

    Net.prototype.send_GetStat = function() {
        this.socket.emit("GetStat", {});
    };

    /////////////////////////////////////////////////////////////
    // Socket event bindings
    /////////////////////////////////////////////////////////////
    Net.prototype.Initialize = function(host) {
        this.socket = io.connect(host);
        this.socket.on("scoreboard", this.recv_ScoreBoard.bind(this));
        this.socket.on("stat", this.recv_Stats.bind(this));

        var s = this.socket;
        setInterval(function() {
            if(!s.socket.connected) {
                $('#msgboard').html("<font class='bit_font' size='5px' color='#FF0000'>[ERROR] Connection to server lost. Please reload the page.</font>");
                $('#hud').hide();
                $('#msgboard').show();
            }	
        }, 5000);
    };
    /////////////////////////////////////////////////////////////
    // Receivers
    /////////////////////////////////////////////////////////////
    Net.prototype.recv_Stats = function(data) {
        $('#stat').html('<p style="font-size: 8px;" class="bit_font"><font color="#66CCFF">Parrots killed:&nbsp;</font>'+data.hits+'&nbsp;&nbsp;&nbsp;<font color="#66CCFF">Rounds Played:&nbsp;</font>'+data.players+'</p>');
    };

    Net.prototype.recv_ScoreBoard = function(data) {
        $("#ranking").find('tr').slice(1,$("#ranking tr").length).remove()
        for(var i=0; i < data.score.length; i++) {
            var pos = i+1;
            $('#ranking tr:last').after("<tr>"+
                                        "<td><font color='#66CCFF'>"+pos+"</font></td>"+
                                        "<td>"+data.score[i].name+"</td>"+
                                        "<td> <font color='#33FF33'>"+data.score[i].score+"</font></td>"+
                                        "<td><font color='#AAAAAA'>"+data.score[i].date+"</font></td>"+
                                        +"</tr>");
        }
    };
}
