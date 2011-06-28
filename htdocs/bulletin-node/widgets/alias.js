	//Begin Alias object

	function Alias(parent_id){
		var self 				= this;

		this.value 				= "<unnamed>";
		this.update_interval 	= this.update_interval = window.setInterval(function(){self.save();}, 60000);  // tell the server I'm still around
		this.xhr 				= new XHR();
		this.color 				= "#ddff88";
		this.parent_node 		= gEBI(parent_id); 
		this.input_node 		= null;
		this.color_node 		= null;
		this.palette_node 		= null;
		this.id 				= null;
		this.host				= null;
		
		this.save = function(){
			if(this.value) 		document.cookie = "alias="+this.value;		
			if(this.color) 		document.cookie = "color="+this.color;
			if(this.id)			document.cookie = "alias_id="+this.id;
			if(this.input_node)	this.input_node.value = this.value;

			var callback = function(xhr, json){
				if(json){
					self.parent_node.setAttribute("class", "widget");
					self.id		= json["id"];
					self.host 	= json["host"];
					self.bloom();
				}
			}
			this.xhr.abort();
			this.xhr.get("/cgi-bin/luci/freifunk/bulletin/update_alias", null, callback); 	// asks server to update alias data
			this.parent_node.setAttribute("class", "widget updating");
			this.bloom();
		}

		this.update = function(){
			with(this.input_node){
				value = value.replace(/[^-a-zA-Z0-9_äöüÄÖÜß]/g, "_");
				value = value.replace(/^_*/g, "");
				value = value.replace(/^root$/gi, "troll");
				this.set_value(value);
			}
		}

		this.bloom = function(){										//have changes effect the display immidiatly
			sABC("bg-"+this.id, 	{"style.backgroundColor" : this.color});	
			sABC("alias-"+this.id, 	{"firstChild.data" : (this.value != "" ?  this.value : "<unnamed>")});
			sABC("host-"+this.id, 	{"firstChild.data" : (this.host != "" ?  this.host : "<unknown>")});
			sABC("color-"+this.id, 	{"style.backgroundColor" : this.color});		

		}

		this.set_id = function(id){
			if(this.id != id){
				this.id = id;
				this.save();
			}
		}

		this.set_value = function(value){
			if (this.value != value){
				this.value=value;
				this.save();
			}
		}

		this.set_color = function(color){			
			if (this.color!=color){
				this.color=color;
				this.save();
			}
		}


		this.render = function(){
			var DIV 			= e("div", 			{"className" : "alias_panel"}, null);
			this.color_node 	= e(	"div",		{"className" : "color color-"+this.id, "style.backgroundColor": this.color, "onclick" : function(){self.toggle_palette()}}, null);
			this.input_node 	= e(	"input", 	{"type" : "text", "onkeyup" : function(){self.update()}, "onblur" : function(){self.update()}, "value" :  this.value}, null);
			this.palette_node	= e("div",			{"className" : "palette", "style.display" : "none", }, null);
			var CLOSE			= e(	"div",		{"className" : "close", "onclick" : function(){PAL.style.display = "none"}}, "\u00d7");


			this.palette_node.appendChild(CLOSE);

			var colors = {	
				"row1":{"a1": "#deefff",	"b1": "#efffbb", 	"c1": "#ffefcc",	"e1": "#ffe4d4",	"f1": "#ffddff"},						
				"row2":{"a2": "#bbddee",	"b2": "#ddff88", 	"c2": "#ffeeaa", 	"e2": "#ffccc4",	"f2": "#ffccff"},
			}			
			for(var row in colors){
				var ROWDIV = e("div", {}, null);
					for(var column in colors[row]){
						ROWDIV.appendChild(	e(	"div", 
												{	"className" : "color", 
													"title": colors[row][column], 
													"style.backgroundColor": colors[row][column], 
													"onclick" : function(){
														self.set_color(this.style.backgroundColor); 
														self.toggle_palette();
													}
												}, 
												null));
					}
				this.palette_node.appendChild(ROWDIV);					
			}							

			DIV.appendChild(this.color_node);
			DIV.appendChild(this.input_node);

			this.parent_node.appendChild(DIV);
			this.parent_node.appendChild(this.palette_node);

		}

		this.toggle_palette = function(){
			if(this.palette_node){
				with(this.palette_node){
					if(style.display != "block"){
						style.display = "block"
					}else{
						style.display = "none"			
					}
				}
			}
		}

		this.xhr.reinit();

		try{
			var cookie = document.cookie;
			cookie= "var "+cookie;
			cookie=cookie.replace(/=/g,"='");
			cookie=cookie.replace(/;/g,"'; var ");
			cookie=cookie+"';";
			eval(cookie);
			this.set_value(alias);
			this.set_id(alias_id);
			this.set_color(color);
		}catch(e){
		}
		
		this.save();
		this.render();

		sA(this.parent_node, {"class": "widget loading"});
	}


	//End Nickname object
