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
	npm i --legacy-peer-deps
	npm run stamp
	npm run electron-pack
	npm run dist
tests:
	npm test
install:
	rm -rf $(DESTDIR)$(prefix)/lib/sil-transcriber
	mkdir -p $(DESTDIR)$(prefix)/lib/sil-transcriber
	cp -r $(bindst)/. $(DESTDIR)$(prefix)/lib/sil-transcriber
	mkdir -p $(DESTDIR)$(prefix)/bin
	cp $(binsrc)/src/script/sil-transcriber.sh $(DESTDIR)$(prefix)/bin/sil-transcriber
	mkdir -p $(DESTDIR)$(prefix)/share/python-support
	chmod 777 $(DESTDIR)$(prefix)/share/python-support
	mkdir -p $(DESTDIR)$(prefix)/share/doc/sil-transcriber
	chmod 777 $(DESTDIR)$(prefix)/share/doc/sil-transcriber
	mkdir -p $(DESTDIR)$(prefix)/share/sil-transcriber
	chmod 777 $(DESTDIR)$(prefix)/share/sil-transcriber
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
	-sudo apt-get -y remove sil-transcriber
	sudo rm -rf $(DESTDIR)$(prefix)/lib/sil-transcriber
	-sudo rm $(DESTDIR)$(prefix)/bin/sil-transcriber
	-sudo rm -rf $(DESTDIR)$(prefix)/share/doc/sil-transcriber
	-sudo rm -rf $(DESTDIR)$(prefix)/share/sil-transcriber
	-xdg-desktop-menu uninstall /etc/pathway/sil-transcriber.desktop
	-rm -rf ~/.config/sil-transcriber
clean-build:
	rm -rf debian/sil-transcriber ../sil-transcriber-*
	rm -f debian/*.log *.log debian/*.debhelper debian/*.substvars debian/files
	rm -f ../sil-transcriber_*.tar.gz ../sil-transcriber_*.build ../sil-transcriber_*.diff.gz
	rm -f ../sil-transcriber_*.buildinfo ../sil-transcriber*.bz2
erase-build:
	rm -f ../*.dsc ../*.changes ../sil-transcriber*.deb ../sil-transcriber*.snap

