
#!/bin/bash
# makeDeb.sh -- Creates release pacakges of SIL Trancriber
#               First optional parameter is a version number e.g. 2.0.8.4
#
# Author: Greg Trihus <greg_trihus@sil.org>
# Date: 2020-06-11

RELEASE=${1:-"2.0.8.4"}
rm -rf ../audio-project-manager-*
rm -rf ../sil-transcriber_*
mkdir ../audio-project-manager-${RELEASE}
#git archive HEAD | tar -x -C ../audio-project-manager-${RELEASE} || exit 2
#cd ../audio-project-manager-${RELEASE}
cp -r . ../audio-project-manager-${RELEASE}
rm -rf ../audio-project-manager-${RELEASE}/.git
rm -rf ../audio-project-manager-${RELEASE}/node_modules
rm -rf ../audio-project-manager-${RELEASE}/src/components/LgPick/index
rm -rf ../audio-project-manager-${RELEASE}/src/buildDate.json
rm -rf ../audio-project-manager-${RELEASE}/package-lock.json
cp debian/changelog ../audio-project-manager-${RELEASE}/debian/.
cp debian/control ../audio-project-manager-${RELEASE}/debian/control
cp debian/rules ../audio-project-manager-${RELEASE}/debian/rules
#cp -rf ../audio-project-manager/debian/source debian/.
#cp ../audio-project-manager/DistFiles/*.csproj DistFiles/.
cd ..

# Delete unwanted non-source files here using find
find audio-project-manager-${RELEASE} -type f -iname "*.hhc" -delete
#find audio-project-manager-${RELEASE} -type f -iname "*.dll" -delete
find audio-project-manager-${RELEASE} -type d -iname bin -exec rm -rf {} \;
find audio-project-manager-${RELEASE} -type d -iname obj -exec rm -rf {} \;

# Tar it up and create symlink for .orig.bz2
tar jcf audio-project-manager-${RELEASE}.tar.bz2 audio-project-manager-${RELEASE} || exit 3
ln -fs audio-project-manager-${RELEASE}.tar.bz2 sil-transcriber_${RELEASE}.orig.tar.bz2

# Do an initial unsigned source build in host OS environment
cd audio-project-manager-${RELEASE}

if [ "$(dpkg --print-architecture)" == "amd64" ]; then
   debuild -eBUILD_NUMBER=${RELEASE} -us -uc || exit 4
else
   dpkg-buildpackage -eBUILD_NUMBER=${RELEASE} -us -uc || exit 4
fi
cp dist/*.snap ..
cd ..
