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
	npx yarn
	npm run stamp
	npm run electron-pack
	npm run dist
tests:
	npm test
install:
	rm -rf $(DESTDIR)$(prefix)/lib/audiotext
	mkdir -p $(DESTDIR)$(prefix)/lib/audiotext
	cp -r $(bindst)/. $(DESTDIR)$(prefix)/lib/audiotext
	mkdir -p $(DESTDIR)$(prefix)/bin
	cp $(binsrc)/src/script/audiotext.sh $(DESTDIR)$(prefix)/bin/audiotext
	mkdir -p $(DESTDIR)$(prefix)/share/python-support
	chmod 777 $(DESTDIR)$(prefix)/share/python-support
	mkdir -p $(DESTDIR)$(prefix)/share/doc/audiotext
	chmod 777 $(DESTDIR)$(prefix)/share/doc/audiotext
	mkdir -p $(DESTDIR)$(prefix)/share/audiotext
	chmod 777 $(DESTDIR)$(prefix)/share/audiotext
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
	-sudo apt-get -y remove audiotext
	sudo rm -rf $(DESTDIR)$(prefix)/lib/audiotext
	-sudo rm $(DESTDIR)$(prefix)/bin/audiotext
	-sudo rm -rf $(DESTDIR)$(prefix)/share/doc/audiotext
	-sudo rm -rf $(DESTDIR)$(prefix)/share/audiotext
	-xdg-desktop-menu uninstall /etc/pathway/audiotext.desktop
	-rm -rf ~/.config/audiotext
clean-build:
	rm -rf debian/audiotext ../audiotext-*
	rm -f debian/*.log *.log debian/*.debhelper debian/*.substvars debian/files
	rm -f ../sil-transcriber_*.tar.gz ../sil-transcriber_*.build ../sil-transcriber_*.diff.gz
	rm -f ../sil-transcriber_*.buildinfo ../audiotext*.bz2
erase-build:
	rm -f ../*.dsc ../*.changes ../audiotext*.deb ../audiotext*.snap

