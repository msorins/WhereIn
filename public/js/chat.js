//Connection to Socket.IO
var socket = io("http://188.213.21.45:8000");

socket.on("disconnect", function(){
	printMessage("Deconectat de la server !");
});

socket.on("connect", function(){
	
});

socket.on("message", function(message){
	printMessage(message);
});


document.forms[0].onsubmit = function () {
    var input = document.getElementById("message");
    var msg = {};
    msg.user = user;	msg.msg = input.value;
    socket.emit("chat", msg);
    input.value = '';
};

function printMessage(message){
	var p = document.createElement("p");
	if(typeof message.user !== 'undefined')
		p.innerText  = `${message.user.name}: ${message.msg}`;
	else
		p.innerText = message;

	document.querySelector("div.chatbox").appendChild(p);
}