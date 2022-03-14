
#!/bin/bash
# makeDeb.sh -- Creates release pacakges of SIL Trancriber
#               First optional parameter is a version number e.g. 2.0.8.4
#
# Author: Greg Trihus <greg_trihus@sil.org>
# Date: 2020-06-11

RELEASE=${1:-"2.0.8.4"}
rm -rf ../audiotext-*
rm -rf ../sil-transcriber_*
mkdir ../audiotext-${RELEASE}
#git archive HEAD | tar -x -C ../audiotext-${RELEASE} || exit 2
#cd ../audiotext-${RELEASE}
cp -r . ../audiotext-${RELEASE}
rm -rf ../audiotext-${RELEASE}/.git
rm -rf ../audiotext-${RELEASE}/node_modules
rm -rf ../audiotext-${RELEASE}/src/components/LgPick/index
rm -rf ../audiotext-${RELEASE}/src/buildDate.json
rm -rf ../audiotext-${RELEASE}/package-lock.json
cp debian/changelog ../audiotext-${RELEASE}/debian/.
cp debian/control ../audiotext-${RELEASE}/debian/control
cp debian/rules ../audiotext-${RELEASE}/debian/rules
#cp -rf ../audiotext/debian/source debian/.
#cp ../audiotext/DistFiles/*.csproj DistFiles/.
cd ..

# Delete unwanted non-source files here using find
find audiotext-${RELEASE} -type f -iname "*.hhc" -delete
#find audiotext-${RELEASE} -type f -iname "*.dll" -delete
find audiotext-${RELEASE} -type d -iname bin -exec rm -rf {} \;
find audiotext-${RELEASE} -type d -iname obj -exec rm -rf {} \;

# Tar it up and create symlink for .orig.bz2
tar jcf audiotext-${RELEASE}.tar.bz2 audiotext-${RELEASE} || exit 3
ln -fs audiotext-${RELEASE}.tar.bz2 sil-transcriber_${RELEASE}.orig.tar.bz2

# Do an initial unsigned source build in host OS environment
cd audiotext-${RELEASE}

if [ "$(dpkg --print-architecture)" == "amd64" ]; then
   debuild -eBUILD_NUMBER=${RELEASE} -us -uc || exit 4
else
   dpkg-buildpackage -eBUILD_NUMBER=${RELEASE} -us -uc || exit 4
fi
cp dist/*.snap ..
cd ..
