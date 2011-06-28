	//requires:		xhr.js
	//recommended: 	alias.js 
	//recommended: 	clients.js 


	//Chat Line Object

	function Line(line){
		this.from 		= line["from"];
		this.to 		= line["to"];
		this.time 		= line["time"];
		this.content	= line["content"];

		this.getNode = function(){
			var Node = 				e("div", 	{"className": "line bg-"+this.from+(this.from==-1 ? " system" : "")}, 	null);
				Node.appendChild(	e(	"div", 	{"className": "from alias-"+this.from},	this.from==-1 ? "//sytem" : "<unnamed>"));
				Node.appendChild(	e(	"div", 	{"className": "host host-"+this.from},	this.from==-1 ? location.hostname : "<unknown>"));
				Node.appendChild(	e(	"div", 	{"className": "time"}, 					h24(this.time*1000)));
				Node.appendChild(	e(	"div", 	{"className": "message"},				this.content));
			return(Node)
		}
	}

	//Chat Object

	function Chat(parent_id, alias_obj, client_list_obj){
		var self = this;

		this.parent_node 	= gEBI(parent_id);
		this.alias_obj 		= alias_obj;
		this.client_list_obj= client_list_obj;
		this.id 			="public_chat";
		
		this.lines 			= new Array();
		this.xhr_u 			= new XHR();
		this.xhr_p 			= new XHR();
		this.form			= null;
		this.input 			= null;
		this.log 			= null;
		this.blocked		= false;
		//this.to = 0;
		//this.status = "";


		this.render = function(){
			if(!this.log){
				this.log 	= 	e("div", 		{"className": "chat_log vstretch"}, 					null);
				this.form 	= 	e("form", 		{"onsubmit" : function(){self.post(); return false}},	null);
				this.input	=	e(	"input",	{"type": "text"});				

				this.form.appendChild(this.input);

				this.parent_node.appendChild(this.log);
				this.parent_node.appendChild(this.form);
			}
			this.refresh_log();	
		}

		this.clear_log = function(){
			if(this.log){
				with(this.log){
					while(firstChild){removeChild(firstChild)}
				}
			}
		}

		this.refresh_log = function(){
			this.clear_log();		
			for(var i = 0; i < this.lines.length; i++){
				this.log.appendChild(this.lines[i].getNode());
			}
			self.alias_obj.bloom();										//colors the lines and fills in client_data
			self.client_list_obj.bloom();
		}


		this.update = function(){
			if(!this.xhr_p.busy()){											//dont update while a post is pending
				var callback = function(xhr, json){
					if(json){		
						self.parent_node.setAttribute("class", "widget");			//done updating: "widget updating" -> "widget"
						self.lines = new Array();
						for (var item in json){ 
							var new_line = new Line(json[item], self.clients);
							self.lines.push(new_line);							
						}
						self.refresh_log();
					}				
				}
				this.xhr_u.cancel();
				this.xhr_u.get("/cgi-bin/luci/freifunk/bulletin/get_chat_log", null, callback);			
				this.parent_node.setAttribute("class", "widget updating");
			}
		}

		this.post = function(){
			var value = this.input.value;
			if(value !="" && !this.blocked){
				this.input.value = "";
				this.block();
				var callback = function(xhr, json){					
					self.unblock();
					self.update();
				}
				this.xhr_p.post("/cgi-bin/luci/freifunk/bulletin/post_chat", {"content": value}, callback);
				this.xhr_u.cancel();							// there will be an update after the post has been sent anyway

				var new_line = new Line({"from": -1, "to": -1, "time": null, "content": "sending >>>>> "+value+" <<<<<<"});
				this.lines.push(new_line);							
				this.refresh_log();			
				this.log.scrollTop = this.log.scrollHeight;
			}
			return(false);
		}

		this.block = function(){
			this.blocked =  true;
			this.form.className ="blocked";
		}

		this.unblock = function(){
			this.blocked =  false;
			this.form.className ="";
		}



		this.xhr_u.reinit();
		this.xhr_p.reinit();

		window.setInterval(function(){self.update()}, 4000);
		this.update();
		this.render();
	}
