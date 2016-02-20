get_theme_cookie();

function theme()
{
	var ls = document.getElementById("theme_list");
	var thm = ls.options[ls.selectedIndex].value;
	change_theme(thm);
}

function change_theme(id)
{
	var navbar = document.querySelector("#navbar");
	var footerbar = document.querySelector("#footerbar");
	if(id === "1"){
		navbar.style.backgroundColor = "rgba(52, 73, 94, 0.85098)";
		footerbar.style.backgroundColor = "rgba(52, 73, 94, 0.85098)";
		send_theme_cookie(1);
		}
	else if(id === "2"){
		navbar.style.backgroundColor = "rgba(211, 84, 0, 0.85098)";
		footerbar.style.backgroundColor = "rgba(211, 84, 0, 0.85098)";
		send_theme_cookie(2);
		}
	else if(id === "3"){
		navbar.style.backgroundColor = "rgba(192, 57, 43, 0.9)";
		footerbar.style.backgroundColor = "rgba(192, 57, 43, 0.9)";
		send_theme_cookie(3);
	}
}

function send_theme_cookie(id){
	var xmlhttp;
	if (window.XMLHttpRequest)
	  xmlhttp=new XMLHttpRequest();
	else
	  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");

	xmlhttp.open("GET","/set_theme_cookie/"+id,true);
	xmlhttp.send();
}

function get_theme_cookie()
{
	var xmlhttp;
	if (window.XMLHttpRequest)
	  xmlhttp=new XMLHttpRequest();
	else
	  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");

	xmlhttp.onreadystatechange=function()
	  {
	  if (xmlhttp.readyState==4)
	    {
	    	var  obj = JSON.parse(xmlhttp.responseText);
	    	if(obj["theme_id"]!= null )
	    		change_theme(obj["theme_id"]);
	    }

	  }
	xmlhttp.open("GET","/get_cookies",true);
	xmlhttp.send();
}