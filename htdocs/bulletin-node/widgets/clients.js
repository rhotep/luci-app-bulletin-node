	//Client Object

	function client(id, list_node){
		var self = this;
		this.list_node = list_node;
		this.id = id;
		this.state = "new";
		
		var now = new Date();

		this.settings = {	"color" 	: "#ddff88",
							"alias" 	: "<unnamed>",
							"host"		: "<unknown>",
							"last_seen"	: now.getTime()
		};

		this.get_settings = function(){
			return(this.settings);
		}
		
		this.render = function(){			
			var DIV = document.createElement("div");
				DIV.setAttribute("id", this.id);
				DIV.setAttribute("class", "client "+this.state);
				var COLOR = document.createElement("div");
					COLOR.setAttribute("class", "color");
					COLOR.setAttribute("style", "background-color:"+this.settings["color"]);
				DIV.appendChild(COLOR);
				var NAMEDIV = document.createElement("div");					
					NAMEDIV.setAttribute("class", "name");
					NAMEDIV.setAttribute("title", this.settings["alias"]+"@"+this.settings["host"]);
					var ALIAS = document.createTextNode(this.settings["alias"]+"@"+this.settings["host"]);
					NAMEDIV.appendChild(ALIAS);
				DIV.appendChild(NAMEDIV);
			var node=document.getElementById(this.id);
			if (node){
				this.list_node.replaceChild(DIV, node);
			}else{
				this.list_node.appendChild(DIV);
			}	
			this.bloom();
		}

		this.update = function(settings){
			this.settings = settings;
			this.render();
		}

		this.bloom = function(){										//have changes effect the display immidiately
			sABC("bg-"+this.id, {"style.backgroundColor" : this.settings["color"]});	
			sABC("alias-"+this.id, {"firstChild.data" : this.settings["alias"]});	
			sABC("host-"+this.id, {"firstChild.data" : this.settings["host"]});	
		}
		
		this.remove = function(){
			var node=document.getElementById(this.id);
			if (node){
				this.list_node.removeChild(node)
			}
		}

		this.mark_active = function(){
			this.state = "active";
		}

		this.mark_idle = function mark_idle(){
			this.state = "idle";
		}

							
	}



	//Client List Object

	function client_list(list_node_id){
		var self = this;
		this.http = new XMLHttpRequest();
		this.clients = {};
		this.list_node = document.getElementById(list_node_id);		

		this.get_client = function(id){
			return(this.clients[id]);
		}

		this.update = function (){
			this.http.open("GET","/cgi-bin/luci/freifunk/bulletin/get_clients");
			this.http.onreadystatechange = function () {
		        if (this.readyState == 4){
					self.list_node.nlassName = self.list_node.className.replace(/\s*updating/, "");
					if (this.status == 200) {
						var json=this.responseText;
					
						try{
							var list = eval('('+json+')'); 
						}catch(e){
							var list = null;
						}

						if(list){
							for (var id in self.clients){ 
								if (!list[id]){		//remove disconnected clients				
									self.clients[id].remove();
									delete self.clients[id];
								}
							}
		
							for (var id in list){ 
								if (!self.clients[id]){			
									self.clients[id] = new client(id, self.list_node);
								}
								self.clients[id].update(list[id]);
							}
						}
					}
	    	  	}
	    	}
			this.http.send();			
			this.list_node.className = this.list_node.className.replace(/\s*updating/, "");
			this.list_node.className = this.list_node.className.replace(/\s*loading/, "");
			this.list_node.className = this.list_node.className+" updating";
		}
		
		this.bloom = function(){
			for(var id in this.clients){
				this.clients[id].bloom();
			}
		}	

		window.setInterval(function (){self.update()}, 5000);
		this.list_node.setAttribute("class", "widget loading");
	}
