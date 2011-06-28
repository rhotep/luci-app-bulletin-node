
	function include_css(src, media){
		var link = document.createElement('link');
		link.setAttribute('rel','stylesheet');
		link.setAttribute('type', 'text/css');
		link.setAttribute('href','/bulletin-node/'+src);
		link.setAttribute('media', media);
	 	document.getElementsByTagName('head')[0].appendChild(link);	
	}

	function include_js(src){
		var js = document.createElement('script');
		js.setAttribute('src','/bulletin-node/'+src);
		js.setAttribute('type', 'text/javascript');
	 	document.getElementsByTagName('head')[0].appendChild(js);		
	}

	function in_array(needle, haystack){
		for (var key in haystack){
			if (needle == haystack[key]) return (true)
		}
		return(false)
	}

	function h24(time){							//milliseconds
		if(time !=null){
			nD	= new Date(time);
			h	= ("0"+nD.getHours()).slice(-2);
			m	= ("0"+nD.getMinutes()).slice(-2);
			return(h+":"+m);
		}else{
			return("");
		}
	}


	function gEBI(id){
		return(document.getElementById(id));
	}


	function e(tag, tribs, text){				//document.creatElement...
		var el = document.createElement(tag);
		sA(el, tribs);
		if(text){el.appendChild(document.createTextNode(text))};
		return(el);
	}


	function sA(el, tribs){
		for(var attr in tribs){
			eval("el."+attr+"=tribs[attr]");
		}		
	}

	function sABC(c,tribs){						//set Attributes BY Class
		var els=document.getElementsByClassName(c);
		for(var i = 0; i<els.length; i++){
			sA(els[i], tribs);				
		}
	}

	function vStretch(obj, speed){
		var body = document.getElementsByTagName('body')[0];
		var h 	= 0;		
		var s 	= speed ? speed : 100;

		obj.style.height=h+"px";

		var dir = body.scrollWidth == window.innerWidth ? 1 : -1;
		var ldir= dir;	

		if(dir<0){
			return(null);
		}

		while(h >=0 && h < window.innerHeight && s>=1){	
			dir = body.scrollWidth == window.innerWidth ? 1 : -1;
			s = dir == ldir? s : Math.floor(s/2);
			h= dir*s+h;
			obj.style.height=h+"px";			
			ldir = dir;		
		}
		if(h<=0){
			 h = 1;
		}
		while(body.scrollWidth != window.innerWidth){
			h--;
			obj.style.height=h+"px";
		}

	}	

	function init(){
		var objs=document.getElementsByClassName('vstretch');
		for(var i=0; i<objs.length;i++){
			vStretch(objs[i], 100);
		}
	}

	window.onresize=init;
	//window.setInterval(init, 2000);

	include_css("default.css", "all");
	


