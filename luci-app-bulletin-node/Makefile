include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-bulletin-node
PKG_RELEASE:=0.1.0

PKG_BUILD_DIR := $(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-bulletin-node
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=Freifunk
  TITLE:=Bulletinseite
  DEPENDS:=
endef

define Package/luci-app-bulletin-node/description
  Bulletinseite Chat
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	cp -a ../* $(PKG_BUILD_DIR)
endef

define Build/Configure
endef

define Build/Compile
	$(MAKE) -C $(PKG_BUILD_DIR)/luasrc
endef

define Package/luci-app-bulletin-node/install
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci
	$(CP) $(PKG_BUILD_DIR)/luasrc/* $(1)/usr/lib/lua/luci
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(CP) ./uci-defaults/* $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/www/luci-static
	$(CP) ./htdocs/* $(1)/www
endef

$(eval $(call BuildPackage,luci-app-bulletin-node))