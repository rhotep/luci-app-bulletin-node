luci.i18n.loadc("freifunk")
local uci = require "luci.model.uci".cursor()

----------------#Bulletin Node Einstellungen

bnp = Map("bulletin-node", "Bulletin Node ", 'Für den Steckbrief auf der Bulletinseite werden auch die Freifunk- und Kontaktdaten benutzt (s. "Freifunk" und "Kontakt")')

function bnp.on_after_save(self)
	local fs = require "luci.fs"
	fs.unlink("/www/bulletin-node/avatar_small.png")
	if fs.isfile("/lib/uci/upload/cbid.bulletin-node.main.avatar_small") then
		fs.link("/lib/uci/upload/cbid.bulletin-node.main.avatar_small", "/www/bulletin-node/avatar_small.png", 1)			
	end
end


d = bnp:section(NamedSection, "main", "settings", "Bulletin Node")
d:tab("content", "Inhaltliches")
d:tab("technical", "Technisches")
------------------NODE ABOUT

node_name=d:taboption("content", Value, "node_name", "Knotenname, Name des Geschäfts, des Vereins, etc.", "Wird in der Knoteninfobox angezeigt.")
description=d:taboption("content", TextValue, "description", "Beschreibung des Geschäfts, des Vereins, etc.", "Wird im Steckbrief auf der Bulletinseite angezeigt.")
description.rows=5

function description.cfgvalue(self,section)
	local fs = require "luci.fs"
	text= fs.readfile("/lib/uci/upload/description.txt")
	if text == nil then
		return ""
	else 
		return text
	end
end

function description.write(self, section, value)
	local fs = require "luci.fs"
	fs.writefile("/lib/uci/upload/description.txt", value)
end



------------------AVATAR

avatar_preview=d:taboption("content", DummyValue, "avatar_preview", "Avatar(Vorschau)", avatar_html)
avatar_preview.rawhtml=true
avatar_preview.default=[[
	<div class="fallback" style="width:64px; height:64px; background:#fff url(/bulletin-node/default.png) no-repeat;">
		<div class="avatar" style="width:64px; height:64px; background:transparent url(/bulletin-node/avatar_small.png) no-repeat;">
		</div>
	</div>
]]

avatar_small=d:taboption("content", FileUpload, "avatar_small", "Avatar","PNG nicht größer als 64x64 px.")

--do not change the name of the upload field "avatar_small" for it will change the name of the uploaded file, which is used in other files.


------------------AFTER SPLASH

active=d:taboption("technical", ListValue, "after_splash", "Nach dem Splash die Bulletinseite anzeigen", "Achtung: Ändert die Communityeinstellungen!")
active.widget="radio"
active.size=2
active:value(1, "Ja")
active:value(0, "Nein")

function active.cfgvalue(self, section)
	community_homepage = uci:get("freifunk", "community", "homepage")
	if community_homepage == "/cgi-bin/luci/freifunk/bulletin" then
		return("1")
	else
		return("0")
	end
end

function active.write(self, section, value)
	local uci = require "luci.model.uci".cursor()
	if value == "1" then
		hp=uci:get("freifunk", "community", "homepage") 
		uci:set("bulletin-node", "main", "homepage_bak", hp)
		uci:save("bulletin-node")
		uci:commit("bulletin-node")
		uci:set("freifunk", "community", "homepage", "/cgi-bin/luci/freifunk/bulletin")
		uci:save("freifunk")
		uci:commit("freifunk")
	else
		homepage_bak=uci:get("bulletin-node", "main", "homepage_bak")
		if homepage_bak ~= nil then
			uci:set("freifunk", "community", "homepage", homepage_bak)	
			uci:save("freifunk")
			uci:commit("freifunk")
		end
	end
end

------------------REDIRECT IP

redirect=d:taboption("technical", Value, "redirect", "Weiterleiung zu ...", "Wird hier eine IP-Adresse eingetragen, werden alle Abfragen für Bulletin Node an den angegebenen Knoten weitergeleitet. Anstelle der Bulletinseite des aktuellen Knotens wird auf die Bulletinseite des eingetragenen Knotens weitergeleitet. Das ist sinnvoll, wenn in einem Geschäft mehrere Knoten stehen. Ersatzknoten werden in der Knoteninfobox des eingetragenen Knotens honoriert.")
redirect.datatype = "ip4addr"
redirect.rmempty = true
------------------CSS

use_css=d:taboption("technical", ListValue, "use_css", "Extra CSS für Bulletinseite benutzen", "Nur nötig falls das eingestellte Theme, die Bulletinseite nicht berücksichtigt.")
use_css.widget="radio"
use_css.size=2
use_css:value(1, "Ja")
use_css:value(0, "Nein")

css=d:taboption("technical", TextValue, "css", "CSS", "Stylesheetangaben für die Bulletinseite")
css.rows=10

function css.cfgvalue(self,section)
	local fs = require "luci.fs"
	styles= fs.readfile("/www/bulletin-node/default.css")
	if styles == nil then
		return ""
	else 
		return styles
	end
end

function css.write(self, section, value)
	local fs = require "luci.fs"
	fs.writefile("/www/bulletin/default.css",value)
end


	


return  bnp


