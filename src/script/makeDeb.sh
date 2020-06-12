
#!/bin/bash
# makeDeb.sh -- Creates release pacakges of SIL Trancriber
#               First optional parameter is a version number e.g. 2.0.8.4
#
# Author: Greg Trihus <greg_trihus@sil.org>
# Date: 2020-06-11

RELEASE=${1:-"2.0.8.4"}
rm -rf ../sil-transcriber-*
rm -rf ../sil-transcriber_*
mkdir ../sil-transcriber-${RELEASE}
#git archive HEAD | tar -x -C ../sil-transcriber-${RELEASE} || exit 2
#cd ../sil-transcriber-${RELEASE}
cp -r . ../sil-transcriber-${RELEASE}
rm -rf ../sil-transcriber-${RELEASE}/.git
rm -rf ../sil-transcriber-${RELEASE}/node_modules
rm -rf ../sil-transcriber-${RELEASE}/src/components/LgPick/index
rm -rf ../sil-transcriber-${RELEASE}/src/buildDate.json
rm -rf ../sil-transcriber-${RELEASE}/package-lock.json
cp debian/changelog ../sil-transcriber-${RELEASE}/debian/.
cp debian/control ../sil-transcriber-${RELEASE}/debian/control
cp debian/rules ../sil-transcriber-${RELEASE}/debian/rules
#cp -rf ../sil-transcriber/debian/source debian/.
#cp ../sil-transcriber/DistFiles/*.csproj DistFiles/.
cd ..

# Delete unwanted non-source files here using find
find sil-transcriber-${RELEASE} -type f -iname "*.hhc" -delete
#find sil-transcriber-${RELEASE} -type f -iname "*.dll" -delete
find sil-transcriber-${RELEASE} -type d -iname bin -exec rm -rf {} \;
find sil-transcriber-${RELEASE} -type d -iname obj -exec rm -rf {} \;

# Tar it up and create symlink for .orig.bz2
tar jcf sil-transcriber-${RELEASE}.tar.bz2 sil-transcriber-${RELEASE} || exit 3
ln -fs sil-transcriber-${RELEASE}.tar.bz2 sil-transcriber_${RELEASE}.orig.tar.bz2

# Do an initial unsigned source build in host OS environment
cd sil-transcriber-${RELEASE}

if [ "$(dpkg --print-architecture)" == "amd64" ]; then
   debuild -eBUILD_NUMBER=${RELEASE} -us -uc || exit 4
else
   dpkg-buildpackage -eBUILD_NUMBER=${RELEASE} -us -uc || exit 4
fi
cp dist/*.snap ..
cd ..
