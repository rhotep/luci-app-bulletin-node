	// Neighbor object

	function neighbor(ip, parent_node){						
			var basics_default = {	"redirect": 	undefined, 
									"avatar_src": 	"",
									"name":			"Freifunk",
									"hostname":		"",
									"broadcast": 	"Freifunk ist eine Initiative zur Schaffung eines freien, offenen und unabhängigen Funknetzwerks auf WLAN-Basis."
			};


			this.basics		= basics_default;					
			this.ip 		= ip;
			this.id 		= ip.replace(/\./g, "-");
			this.state		= "none";	
			this.parent_node= parent_node;
			this.timeout	= null;
			this.abort		= null;
			
			this.set_basics = function(json){
				try{
					this.basics = eval('('+json+')');
					this.set_state("fine");
				}catch(e){
					this.set_state("unknown");
				}finally{		
					for (item in basics_default){
						if (this.basics[item] == undefined) this.basics[item]=basics_default[item];
					}
				}
			}

			this.update	= function(){		
				var self 	= this;
				this.request = new XMLHttpRequest();
				this.request.open("GET","/cgi-bin/luci/freifunk/bulletin/get_basic_settings?ip="+this.ip);				
				this.request.onreadystatechange = function () {				
					if (this.readyState == 4) {
							window.clearTimeout(self.abort);
							self.set_basics(this.responseText);
							self.render();
							this.timeout = window.setTimeout(function(){self.update()}, 40000+Math.random()*60000);
					}
				}
				this.set_state("checking");
				this.abort = window.setTimeout(function(){
					self.request.abort(); 
					if (self.state=="lost"){
						self.remove();
					}else{
						self.set_state("lost");
					}
			
				},10000);  //updating the basics should not take longer than 10 seconds
				this.request.send();			
			}

			this.set_state= function(state){
				this.state=state;
				var node = document.getElementById(this.id);
				if(node){
					node.setAttribute("class", "neighbor "+this.state);
				}
			}



			
			this.render = function(){
				if(this.state=="dead"){				//js-objects cant delete themselves, but they can play dead instead
					return;
				}
				var DIV = document.createElement("div");
					DIV.setAttribute("id", this.id);
					DIV.setAttribute("class", "neighbor "+this.state);
					var DIVstate = document.createElement("div"); 							
						DIVstate.setAttribute("class", "state");
					DIV.appendChild(DIVstate);
					var DIVfallback = document.createElement("div"); 
						DIVfallback.setAttribute("style", "height:64px; width:64px; background: #fff url('/bulletin-node/default.png') no-repeat");
						DIVfallback.setAttribute("class", "fallback");
						DIVfallback.setAttribute("onclick", "location.href=\"http://"+this.ip+"\"");
						var DIVavatar = document.createElement("div"); 
							DIVavatar.setAttribute("style", "height:64px; width:64px; background: transparent url('http://"+this.ip+this.basics["avatar_src"]+"') no-repeat");
							DIVavatar.setAttribute("class", "avatar");
						DIVfallback.appendChild(DIVavatar);						
					DIV.appendChild(DIVfallback);						
					var DIVname = document.createElement("DIV");
						DIVname.setAttribute("class", "name");
						DIVname.setAttribute("onclick", "location.href=\"http://"+this.ip+"\"");
						var NAME = document.createTextNode(this.basics["name"]);
						DIVname.appendChild(NAME);
					DIV.appendChild(DIVname);
					var DIVhost = document.createElement("DIV");
						DIVhost.setAttribute("class", "host");
						DIVhost.setAttribute("onclick", "location.href=\"http://"+this.ip+"\"");
						var HOST = document.createTextNode(this.basics["hostname"]+" ("+this.ip+")");
						DIVhost.appendChild(HOST);
					DIV.appendChild(DIVhost);
					var DIVbroadcast = document.createElement("DIV");
						DIVbroadcast.setAttribute("class", "broadcast");
						var BROADCAST = document.createTextNode(this.basics["broadcast"]);
						DIVbroadcast.appendChild(BROADCAST);
					DIV.appendChild(DIVbroadcast);
				var node=document.getElementById(this.id);
				if (node){
					this.parent_node.replaceChild(DIV, node);
				}else{
					this.parent_node.appendChild(DIV);
				}					
			}

			this.remove = function(){
				this.set_state("dead");
				var node=document.getElementById(this.id);
				if (node){
					this.parent_node.removeChild(node)
				}
			}

			this.render();
			this.update();
	}

	// Neighbor List Item

	function neighbor_list(list_node_id){
		var self = this;
		this.http = new XMLHttpRequest();
		this.neighbors = {};
		this.list_node = document.getElementById(list_node_id);	

		this.update_neighbors = function(){				
			this.http.open("GET","/cgi-bin/luci/freifunk/bulletin/get_neighbors");

			this.http.onreadystatechange = function () {
			    if (this.readyState == 4){
					self.list_node.setAttribute("class", "widget");
 					if(this.status==200){ 
						var json=this.responseText;
						var ip_list = {}
						try{
							var ip_list = eval('('+json+')'); 
						}catch(e){
							var ip_list = {}
						}

						for (var key in ip_list){ 			//add new nodes
							var ip = ip_list[key];	
							if (!self.neighbors[ip]){			
								self.neighbors[ip] = new neighbor(ip, self.list_node);
							}else{
								if(self.neighbors[ip].state=="dead"){
									self.neighbors[ip] = new neighbor(ip, self.list_node);
								}
							}
						}
					}
				}
			}
			window.setTimeout(function(){self.http.abort();},10000);  //updating neighbors should not take longer than 10 seconds
			this.http.send();
			this.list_node.setAttribute("class", "widget updating");
		}

		this.update_neighbors();
		window.setInterval(function(){self.update_neighbors()}, 60000+Math.random()*10000);
	}


