ifndef prefix
prefix=/usr
endif
ifndef bindst
bindst=dist/linux-unpacked
endif
ifndef binsrc
binsrc=${PWD}
endif
build:
	npm install --legacy-peer-deps
	npm run stamp
	npm run electron-pack
	npm run dist
tests:
	npm test
install:
	rm -rf $(DESTDIR)$(prefix)/lib/audio-project-manager
	mkdir -p $(DESTDIR)$(prefix)/lib/audio-project-manager
	cp -r $(bindst)/. $(DESTDIR)$(prefix)/lib/audio-project-manager
	mkdir -p $(DESTDIR)$(prefix)/bin
	cp $(binsrc)/src/script/audio-project-manager.sh $(DESTDIR)$(prefix)/bin/audio-project-manager
	mkdir -p $(DESTDIR)$(prefix)/share/python-support
	chmod 777 $(DESTDIR)$(prefix)/share/python-support
	mkdir -p $(DESTDIR)$(prefix)/share/doc/audio-project-manager
	chmod 777 $(DESTDIR)$(prefix)/share/doc/audio-project-manager
	mkdir -p $(DESTDIR)$(prefix)/share/audio-project-manager
	chmod 777 $(DESTDIR)$(prefix)/share/audio-project-manager
	mkdir -p $(DESTDIR)$(prefix)/share/applications
	chmod 777 $(DESTDIR)$(prefix)/share/applications
	cp debian/*.desktop $(DESTDIR)$(prefix)/share/applications
	mkdir -p $(DESTDIR)$(prefix)/share/pixmaps
	chmod 777 $(DESTDIR)$(prefix)/share/pixmaps
	cp debian/*.png $(DESTDIR)$(prefix)/share/pixmaps
	#cp debian/*.xpm $(DESTDIR)$(prefix)/share/pixmaps
	mkdir -p $(DESTDIR)$(prefix)/share/man
	chmod 777 $(DESTDIR)$(prefix)/share/man
clean:
	rm -rf build dist coverage
uninstall:
	-sudo apt-get -y remove audio-project-manager
	sudo rm -rf $(DESTDIR)$(prefix)/lib/audio-project-manager
	-sudo rm $(DESTDIR)$(prefix)/bin/audio-project-manager
	-sudo rm -rf $(DESTDIR)$(prefix)/share/doc/audio-project-manager
	-sudo rm -rf $(DESTDIR)$(prefix)/share/audio-project-manager
	-xdg-desktop-menu uninstall /etc/pathway/audio-project-manager.desktop
	-rm -rf ~/.config/audio-project-manager
clean-build:
	rm -rf debian/audio-project-manager ../audio-project-manager-*
	rm -f debian/*.log *.log debian/*.debhelper debian/*.substvars debian/files
	rm -f ../audio-project-manager_*.tar.gz ../audio-project-manager_*.build ../audio-project-manager_*.diff.gz
	rm -f ../audio-project-manager_*.buildinfo ../audio-project-manager*.bz2
erase-build:
	rm -f ../*.dsc ../*.changes ../audio-project-manager*.deb ../audio-project-manager*.snap

