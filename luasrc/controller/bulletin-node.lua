module("luci.controller.bulletin-node", package.seeall)

local sys 	= require "luci.sys"
local fs 	= require "luci.fs"
local uci 	= require "luci.model.uci".cursor()
local http 	= require "luci.http"
local util 	= require "luci.util"

if not fs.isdirectory("/tmp/bulletin-node") then
	fs.mkdir("/tmp/bulletin-node")
	fs.chmod("/tmp/bulletin-node", "777")
end	


function index()
	entry({"freifunk", "bulletin"}, template("bulletin-node/bulletin"), "Bulletinseite", 100)
	entry({"freifunk", "bulletin", "get_basic_settings"}, call("get_basic_settings"))
	entry({"freifunk", "bulletin", "get_neighbors"}, call("get_neighbors"))
	entry({"freifunk", "bulletin", "get_clients"}, call("get_clients"))
	entry({"freifunk", "bulletin", "update_alias"}, call("update_alias"))
	entry({"freifunk", "bulletin", "post_chat"}, call("post_chat"))
	entry({"freifunk", "bulletin", "get_chat_log"}, call("get_chat_log"))
	entry({"freifunk", "bulletin", "neighbors"}, template("bulletin-node/widgets/neighbors"))
	entry({"admin", "freifunk", "bulletin"}, cbi("bulletin-node-properties"), "Bulletin Node Einstellungen", 100)
	assign({"mini", "freifunk", "bulletin"}, {"admin", "freifunk", "bulletin"}, "Bulletin Node Einstellungen", 50)

	--[[
	entry({"freifunk", "index", "local-ads"}, template("local-ads/local-ads"), "Local Ads", 100)
	entry({"freifunk", "index", "local-ads", "banner"}, template("local-ads/banner"))
	entry({"freifunk", "index", "local-ads", "uci-settings"}, call("get_uci_settings"))

	--]]
end

function write_cache(data, dir, name)

	if not fs.isdirectory("/tmp/bulletin-node/"..dir) then
		fs.mkdir("/tmp/bulletin-node/"..dir)
	end	
	fs.writefile("/tmp/bulletin-node/"..dir.."/"..name, data)	
end

function read_cache(dir, name)
	return(fs.readfile("/tmp/bulletin-node/"..dir.."/"..name))
end

function mcache(dir,name)
	return(fs.mtime("/tmp/bulletin-node/"..dir.."/"..name))	or 0
end


--todo: clear cache!!!


--[[
	Because Javascript cannot send a http request to a remote hosts, lua will do it for us.
	"get_basic_settings" either gets the basic data from this system or it fetches it from ip.

	Returns json string containing an array:
		"redirect"	->	string: IP
		"avatar_scr	->	string: path to avatar image relative to /www include leading "/" !
		"hostname"	->	string: hostname
		"name"		->	string: node name
		"braodcast"	->	string: not in use yet
]]--

function get_basic_settings()
	http.prepare_content("application/json")
	remote_ip = http.formvalue("ip")
	if remote_ip~=null and nixio.getnameinfo(remote_ip) ~= sys.hostname() then

		local mtime = mcache("neighbors", remote_ip)
		local json = ""

		if os.time()-mtime > 60 then			--renew cache
			json = sys.httpget("http://"..remote_ip.."/cgi-bin/luci//freifunk/bulletin/get_basic_settings")			
			write_cache(json, "neighbors", remote_ip)
		else
			json = read_cache("neighbors", remote_ip)	--read from cache
		end		

		http.write(json)
	else
		basic_settings={} 		
		basic_settings["redirect"]		= uci:get("bulletin-node", "main", "redirect")
		basic_settings["avatar_src"]	= "/bulletin-node/avatar_small.png"
		basic_settings["hostname"]		= sys.hostname()
		basic_settings["name"]			= uci:get("bulletin-node", "main", "node_name") 
		basic_settings["broadcast"]		= uci:get("bulletin-node", "main", "broadcast") or uci:get("freifunk", "contact", "note") or " "
		http.write_json(basic_settings)
	end
end

--[[
	Because Javascript cannot send a http request to a remote hosts, lua will do it for us.
	"get_neighbors" either gets the neighbors from this system or it fetches it from ip.
]]--

function get_neighbors()	--better use arp table here?
	http.prepare_content("application/json")
	local remote_ip = http.formvalue("ip") or "127.0.0.1"
	local raw_data = sys.httpget("http://"..remote_ip..":2006/neigh")
	local neighbors = {}
	for ip in string.gmatch(raw_data, "%d+%.%d+%.%d+%.%d+") do
		table.insert(neighbors,ip)
	end	
	http.write_json(neighbors)
end


--[[
	Clients will be identified by a unique id that is assigned at the first checkin. The id is
	stored in a cookie. If a cookie is already set for "alias_id" then update_alias returns the new id and the hostname.
]]--

function update_alias()
	http.prepare_content("application/json")

	local raw_data 	= fs.readfile("/tmp/bulletin-node/clients") or "{}"		
	local clients 	= util.restore_data(raw_data) or {}
	local alias_id 	= http.getcookie("alias_id")
	local alias 	= http.getcookie("alias")
	local remote_ip = http.getenv("REMOTE_ADDR")
	local hostname	= nixio.getnameinfo(remote_ip) or remote_ip

	if alias_id == nil then				--no id assigned
		alias_id=sys.uniqueid(16)
	end

	http.write_json({id = alias_id, host = hostname})

	local time = os.time()

	for key, client in pairs(clients) do
		if time - client["last_seen"] > 100 then	--dont return old entries
			clients[key] = nil
		end
	end
	
	if(clients[alias_id] == nil) then
		add_chat_line({from = -1; to = 0; time = time; content = 'A new user has joined the chat.'})
	end

	if alias then
		alias=string.gsub(alias,"[^-a-zA-Z0-9_äöüÄÖÜß]", "_")
		alias=string.gsub(alias,"^_*", "")
		alias=string.gsub(alias,"^root$", "troll")
	else
		alias = "<unnamed>"
	end

	local client 	= {}

	client["alias"] = alias
	client["color"] = http.getcookie("color") or "#ddff88"
	client["host"] = hostname
	client["last_seen"] = time
	clients[alias_id]=client		
	local new_data = util.serialize_data(clients)
	fs.writefile("/tmp/bulletin-node/clients", new_data)
end


--[[
	Returns all clients except the requesting one
]]--

function get_clients()			
	http.prepare_content("application/json")
	local remote_ip = http.formvalue("ip")
	if remote_ip~=null and nixio.getnameinfo(remote_ip) ~= sys.hostname() then
		json = sys.httpget("http://"..remote_ip.."/cgi-bin/luci/freifunk/bulletin/get_clients")
		http.write(json)
	else
		local raw_data = fs.readfile("/tmp/bulletin-node/clients") or "{}"		
		local clients = util.restore_data(raw_data) or {}
		clients[http.getcookie("alias_id") or -1] = nil			--exclude requesting user
		http.write_json(clients)
	end	
end


--[[
	Chat
]]--

function add_chat_line(new_line)
	local time		= os.time()
	local raw_data 	= fs.readfile("/tmp/bulletin-node/chat.log") or "{}"
	local chat_log 	= util.restore_data(raw_data) or {}
	
	for key, line in pairs(chat_log) do
		if time - line["time"] > 60*60 then						--remove messages older than an hour
			chat_log[key] = nil
		end
	end

	table.insert(chat_log, new_line)
	local new_data = util.serialize_data(chat_log)
	fs.writefile("/tmp/bulletin-node/chat.log", new_data)	
end

function post_chat()
	local time		= os.time()
	local new_line 	= {}
	new_line["from"] 	= http.getcookie("alias_id") or 0		--from 0 messages are anonymous, from -1: system msg
	new_line["to"] 		= http.formvalue("to") or 0				--to 0 messages are public
	new_line["time"] 	= time
	new_line["content"] = http.formvalue("content") or ""

	add_chat_line(new_line)
end


function get_chat_log()
	http.prepare_content("application/json")
	local time		= os.time()
	local raw_data 	= fs.readfile("/tmp/bulletin-node/chat.log") or "{}"
	local chat_log 	= util.restore_data(raw_data) or {}

	for key, line in pairs(chat_log) do
		--remove messages the user is not supposed to read:
		if (line["to"] ~= http.getcookie("alias_id") and (line["to"] ~=0)) or (time - line["time"] > 60*60) then				
			chat_log[key]=nil
		end
	end		
	http.write_json(chat_log)
end






















